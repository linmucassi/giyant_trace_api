import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { workspaces } from './workspaces.js'

export const industryEnum = pgEnum('industry', [
  'auto_repair',
  'electronics_repair',
  'furniture',
  'logistics',
  'home_services',
  'custom',
])

export const templates = pgTable('templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  industry: industryEnum('industry').notNull().default('custom'),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const templateStages = pgTable('template_stages', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id').notNull().references(() => templates.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  order: integer('order').notNull(),
  expectedDurationHours: integer('expected_duration_hours').notNull().default(24),
  color: varchar('color', { length: 7 }).notNull().default('#3B82F6'),
  icon: varchar('icon', { length: 50 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const templatesRelations = relations(templates, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [templates.workspaceId],
    references: [workspaces.id],
  }),
  stages: many(templateStages),
}))

export const templateStagesRelations = relations(templateStages, ({ one }) => ({
  template: one(templates, {
    fields: [templateStages.templateId],
    references: [templates.id],
  }),
}))
