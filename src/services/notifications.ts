// Notification service — Email (SendGrid), WhatsApp (Meta Business API), SMS (Twilio)

import { env } from '../config/env.js'
import { db, notifications } from '../db/index.js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationChannel = 'email' | 'whatsapp' | 'sms'

export type NotificationPayload = {
  to: { name: string; email?: string; phone?: string }
  templateKey: keyof typeof notificationTemplates
  variables: Record<string, string>
  channels: NotificationChannel[]
  /** DB record ids for audit log */
  context: { workspaceId: string; processId: string; clientId: string }
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export const notificationTemplates = {
  process_created: {
    whatsapp: 'Hi {{name}},\n\nYour {{item}} has been received. Track your status here:\n{{link}}\n\nExpected completion: {{date}}\n\nThank you! 🙏',
    email: {
      subject: 'Your {{item}} has been received — {{company}}',
      body: '<p>Hi {{name}},</p><p>We have received your <strong>{{item}}</strong> and work will begin shortly.</p><p><a href="{{link}}">Track your status →</a></p>',
    },
    sms: 'Hi {{name}}, your {{item}} was received. Track status: {{link}}',
  },
  stage_updated: {
    whatsapp: '📊 Update on your {{item}}:\n\n*{{stage}}*\n\n{{note}}\n\nView full update: {{link}}',
    email: {
      subject: 'Status Update: {{stage}} — {{company}}',
      body: '<p>Your {{item}} has moved to <strong>{{stage}}</strong>.</p><p>{{note}}</p><p><a href="{{link}}">View full details →</a></p>',
    },
    sms: 'Update: Your {{item}} is now at stage: {{stage}}. View: {{link}}',
  },
  ready_for_collection: {
    whatsapp: '✅ Great news! Your {{item}} is *ready for collection*!\n\nPlease collect between {{hours}}.\n\nView details: {{link}}',
    email: {
      subject: '✅ Ready for Collection — {{item}}',
      body: '<h2>Your {{item}} is ready!</h2><p>Please collect it during business hours.</p><p><a href="{{link}}">View final report →</a></p>',
    },
    sms: 'Your {{item}} is ready for collection! View: {{link}}',
  },
  completed: {
    whatsapp: '🎉 Your {{item}} service is complete!\n\nThank you for choosing us. We hope to see you again!\n\nView your report: {{link}}',
    email: {
      subject: 'Service Complete — Thank You!',
      body: '<h2>Service Completed!</h2><p>Thank you for your business. Your detailed report is attached.</p>',
    },
    sms: 'Your {{item}} service is complete. Thank you! Report: {{link}}',
  },
} as const

// ---------------------------------------------------------------------------
// Interpolation
// ---------------------------------------------------------------------------

export function interpolateTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`)
}

// ---------------------------------------------------------------------------
// Channel senders
// ---------------------------------------------------------------------------

async function sendEmail(
  to: { name: string; email: string },
  subject: string,
  html: string,
): Promise<void> {
  if (!env.SENDGRID_API_KEY) {
    console.warn('[notifications] SENDGRID_API_KEY not set — skipping email')
    return
  }

  // Dynamic import so missing optional dep doesn't crash startup
  const sgMail = (await import('@sendgrid/mail')).default
  sgMail.setApiKey(env.SENDGRID_API_KEY)

  await sgMail.send({
    to: { name: to.name, email: to.email },
    from: { name: env.EMAIL_FROM_NAME, email: env.EMAIL_FROM },
    subject,
    html,
  })
}

async function sendWhatsApp(phone: string, body: string): Promise<void> {
  if (!env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
    console.warn('[notifications] WhatsApp credentials not set — skipping')
    return
  }

  const url = `https://graph.facebook.com/v19.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone.replace(/\D/g, ''),
      type: 'text',
      text: { body },
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`WhatsApp API error ${res.status}: ${error}`)
  }
}

async function sendSms(phone: string, body: string): Promise<void> {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_PHONE_NUMBER) {
    console.warn('[notifications] Twilio credentials not set — skipping SMS')
    return
  }

  const twilio = (await import('twilio')).default
  const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN)

  await client.messages.create({
    body,
    from: env.TWILIO_PHONE_NUMBER,
    to: phone,
  })
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

/**
 * Send a notification across one or more channels and persist an audit record.
 * Failures per channel are caught individually — one failing channel doesn't
 * block others.
 */
export async function sendNotification(payload: NotificationPayload): Promise<void> {
  const template = notificationTemplates[payload.templateKey]

  for (const channel of payload.channels) {
    let subject = ''
    let body = ''
    let error: string | null = null

    try {
      if (channel === 'email') {
        if (!payload.to.email) continue
        subject = interpolateTemplate(template.email.subject, payload.variables)
        body = interpolateTemplate(template.email.body, payload.variables)
        await sendEmail({ name: payload.to.name, email: payload.to.email }, subject, body)
      } else if (channel === 'whatsapp') {
        if (!payload.to.phone) continue
        body = interpolateTemplate(template.whatsapp, payload.variables)
        await sendWhatsApp(payload.to.phone, body)
      } else if (channel === 'sms') {
        if (!payload.to.phone) continue
        body = interpolateTemplate(template.sms, payload.variables)
        await sendSms(payload.to.phone, body)
      }

      // Audit log — sent
      await db.insert(notifications).values({
        workspaceId: payload.context.workspaceId,
        processId: payload.context.processId,
        clientId: payload.context.clientId,
        channel,
        templateKey: payload.templateKey,
        subject: subject || null,
        body,
        status: 'sent',
        sentAt: new Date(),
      })
    } catch (err) {
      error = err instanceof Error ? err.message : String(err)
      console.error(`[notifications] Failed to send ${channel} notification:`, error)

      // Audit log — failed
      await db.insert(notifications).values({
        workspaceId: payload.context.workspaceId,
        processId: payload.context.processId,
        clientId: payload.context.clientId,
        channel,
        templateKey: payload.templateKey,
        subject: subject || null,
        body: body || '',
        status: 'failed',
        error,
      }).catch(() => {
        // Don't let audit log failure bubble up
      })
    }
  }
}
