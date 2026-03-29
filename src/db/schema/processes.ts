import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  numeric,
  timestamp,
  pgEnum,
  jsonb,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { workspaces } from './workspaces.js'
import { clients } from './clients.js'
import { templates, templateStages } from './templates.js'
import { users } from './users.js'

export const processStatusEnum = pgEnum('process_status', ['active', 'completed', 'cancelled', 'on_hold'])
export const stageStatusEnum = pgEnum('stage_status', ['pending', 'active', 'completed', 'skipped'])
export const attachmentTypeEnum = pgEnum('attachment_type', ['image', 'document', 'video'])

export const processes = pgTable('processes', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  clientId: uuid('client_id').notNull().references(() => clients.id),
  templateId: uuid('template_id').references(() => templates.id),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  referenceNumber: varchar('reference_number', { length: 50 }).notNull(),
  status: processStatusEnum('status').notNull().default('active'),
  currentStageId: uuid('current_stage_id'),
  progressPercentage: integer('progress_percentage').notNull().default(0),
  trackingToken: varchar('tracking_token', { length: 64 }).notNull().unique(),
  expectedCompletionAt: timestamp('expected_completion_at'),
  actualCompletionAt: timestamp('actual_completion_at'),
  totalCost: numeric('total_cost', { precision: 10, scale: 2 }),
  currency: varchar('currency', { length: 3 }).notNull().default('ZAR'),
  createdById: uuid('created_by_id').references(() => users.id),
  assignedToId: uuid('assigned_to_id').references(() => users.id),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const processStages = pgTable('process_stages', {
  id: uuid('id').primaryKey().defaultRandom(),
  processId: uuid('process_id').notNull().references(() => processes.id, { onDelete: 'cascade' }),
  templateStageId: uuid('template_stage_id').references(() => templateStages.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  order: integer('order').notNull(),
  status: stageStatusEnum('status').notNull().default('pending'),
  expectedDurationHours: integer('expected_duration_hours').notNull().default(24),
  expectedCompletionAt: timestamp('expected_completion_at'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const stageUpdates = pgTable('stage_updates', {
  id: uuid('id').primaryKey().defaultRandom(),
  processId: uuid('process_id').notNull().references(() => processes.id, { onDelete: 'cascade' }),
  processStageId: uuid('process_stage_id').references(() => processStages.id),
  content: text('content').notNull(),
  isClientVisible: boolean('is_client_visible').notNull().default(true),
  createdById: uuid('created_by_id').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const attachments = pgTable('attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  processId: uuid('process_id').references(() => processes.id, { onDelete: 'cascade' }),
  processStageId: uuid('process_stage_id').references(() => processStages.id),
  type: attachmentTypeEnum('type').notNull().default('image'),
  filename: varchar('filename', { length: 255 }).notNull(),
  url: text('url').notNull(),
  size: integer('size').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  isClientVisible: boolean('is_client_visible').notNull().default(true),
  caption: text('caption'),
  uploadedById: uuid('uploaded_by_id').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const clientFeedback = pgTable('client_feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  processId: uuid('process_id').notNull().references(() => processes.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// Relations
export const processesRelations = relations(processes, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [processes.workspaceId], references: [workspaces.id] }),
  client: one(clients, { fields: [processes.clientId], references: [clients.id] }),
  template: one(templates, { fields: [processes.templateId], references: [templates.id] }),
  createdBy: one(users, { fields: [processes.createdById], references: [users.id] }),
  assignedTo: one(users, { fields: [processes.assignedToId], references: [users.id] }),
  stages: many(processStages),
  updates: many(stageUpdates),
  attachments: many(attachments),
  feedback: many(clientFeedback),
}))

export const processStagesRelations = relations(processStages, ({ one, many }) => ({
  process: one(processes, { fields: [processStages.processId], references: [processes.id] }),
  templateStage: one(templateStages, { fields: [processStages.templateStageId], references: [templateStages.id] }),
  updates: many(stageUpdates),
  attachments: many(attachments),
}))

export const stageUpdatesRelations = relations(stageUpdates, ({ one }) => ({
  process: one(processes, { fields: [stageUpdates.processId], references: [processes.id] }),
  stage: one(processStages, { fields: [stageUpdates.processStageId], references: [processStages.id] }),
  createdBy: one(users, { fields: [stageUpdates.createdById], references: [users.id] }),
}))
