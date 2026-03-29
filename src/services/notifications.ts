// Notification service - integrates Email, WhatsApp, SMS

export type NotificationPayload = {
  to: { name: string; email?: string; phone?: string }
  templateKey: string
  variables: Record<string, string>
  channels: ('email' | 'whatsapp' | 'sms')[]
}

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
}

export function interpolateTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`)
}

// TODO: Implement actual send functions
// - sendEmail: Use SendGrid
// - sendWhatsApp: Use WhatsApp Business API (Facebook Graph API)
// - sendSMS: Use Twilio
