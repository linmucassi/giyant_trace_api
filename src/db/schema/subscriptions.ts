import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { workspaces } from './workspaces.js'

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'trialing',
  'active',
  'past_due',
  'cancelled',
  'expired',
])

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  plan: varchar('plan', { length: 50 }).notNull().default('starter'),
  status: subscriptionStatusEnum('status').notNull().default('trialing'),
  trialEndsAt: timestamp('trial_ends_at'),
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  externalId: varchar('external_id', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  workspace: one(workspaces, { fields: [subscriptions.workspaceId], references: [workspaces.id] }),
}))
