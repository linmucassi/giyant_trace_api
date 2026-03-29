import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  pgEnum,
  jsonb,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const planEnum = pgEnum('plan', ['starter', 'growth', 'pro', 'enterprise'])

export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  logoUrl: text('logo_url'),
  primaryColor: varchar('primary_color', { length: 7 }).notNull().default('#3B82F6'),
  secondaryColor: varchar('secondary_color', { length: 7 }).notNull().default('#1E40AF'),
  plan: planEnum('plan').notNull().default('starter'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

export const workspaceSettings = pgTable('workspace_settings', {
  workspaceId: uuid('workspace_id').primaryKey().references(() => workspaces.id, { onDelete: 'cascade' }),
  notificationsEmail: boolean('notifications_email').notNull().default(true),
  notificationsWhatsapp: boolean('notifications_whatsapp').notNull().default(false),
  notificationsSms: boolean('notifications_sms').notNull().default(false),
  defaultTemplateId: uuid('default_template_id'),
  timezone: varchar('timezone', { length: 100 }).notNull().default('Africa/Johannesburg'),
  currency: varchar('currency', { length: 3 }).notNull().default('ZAR'),
  whatsappNumber: varchar('whatsapp_number', { length: 20 }),
  emailFrom: varchar('email_from', { length: 255 }),
  customDomain: varchar('custom_domain', { length: 255 }),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  settings: one(workspaceSettings, {
    fields: [workspaces.id],
    references: [workspaceSettings.workspaceId],
  }),
}))
