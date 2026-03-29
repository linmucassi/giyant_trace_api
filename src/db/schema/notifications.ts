import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { workspaces } from './workspaces.js'
import { processes } from './processes.js'
import { clients } from './clients.js'

export const notificationChannelEnum = pgEnum('notification_channel', ['email', 'whatsapp', 'sms'])
export const notificationStatusEnum = pgEnum('notification_status', ['pending', 'sent', 'failed', 'delivered'])

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  processId: uuid('process_id').notNull().references(() => processes.id, { onDelete: 'cascade' }),
  clientId: uuid('client_id').notNull().references(() => clients.id),
  channel: notificationChannelEnum('channel').notNull(),
  templateKey: varchar('template_key', { length: 100 }).notNull(),
  subject: varchar('subject', { length: 500 }),
  body: text('body').notNull(),
  status: notificationStatusEnum('status').notNull().default('pending'),
  sentAt: timestamp('sent_at'),
  error: text('error'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const notificationsRelations = relations(notifications, ({ one }) => ({
  workspace: one(workspaces, { fields: [notifications.workspaceId], references: [workspaces.id] }),
  process: one(processes, { fields: [notifications.processId], references: [processes.id] }),
  client: one(clients, { fields: [notifications.clientId], references: [clients.id] }),
}))
