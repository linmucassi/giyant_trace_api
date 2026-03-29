import type { ID, FileAttachment } from './common'
import type { Client } from './client'
import type { User } from './user'

export type ProcessStatus = 'active' | 'completed' | 'cancelled' | 'on_hold'
export type StageStatus = 'pending' | 'active' | 'completed' | 'skipped'

export type ProcessStage = {
  id: ID
  processId: ID
  templateStageId?: ID
  name: string
  description?: string
  order: number
  status: StageStatus
  expectedDurationHours: number
  expectedCompletionAt?: Date
  startedAt?: Date
  completedAt?: Date
  updates: StageUpdate[]
  attachments: FileAttachment[]
  createdAt: Date
  updatedAt: Date
}

export type StageUpdate = {
  id: ID
  processId: ID
  processStageId?: ID
  content: string
  isClientVisible: boolean
  createdBy?: Pick<User, 'id' | 'name'>
  createdAt: Date
}

export type Process = {
  id: ID
  workspaceId: ID
  client: Pick<Client, 'id' | 'name' | 'phone' | 'email'>
  templateId?: ID
  title: string
  description?: string
  referenceNumber: string
  status: ProcessStatus
  currentStageId?: ID
  progressPercentage: number
  trackingToken: string
  expectedCompletionAt?: Date
  actualCompletionAt?: Date
  totalCost?: number
  currency: string
  createdBy?: Pick<User, 'id' | 'name'>
  assignedTo?: Pick<User, 'id' | 'name'>
  stages: ProcessStage[]
  attachments: FileAttachment[]
  metadata?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export type PublicProcess = Omit<Process, 'workspaceId' | 'createdBy' | 'metadata'> & {
  workspace: {
    name: string
    logoUrl?: string
    primaryColor: string
    secondaryColor: string
  }
  internalUpdatesHidden: true
}

export type CreateProcessInput = {
  clientId: ID
  templateId?: ID
  title: string
  description?: string
  assignedToId?: ID
  totalCost?: number
  currency?: string
  stages?: Array<{
    name: string
    description?: string
    expectedDurationHours: number
  }>
  metadata?: Record<string, unknown>
}

export type UpdateProcessInput = Partial<{
  title: string
  description: string
  status: ProcessStatus
  assignedToId: ID
  totalCost: number
  expectedCompletionAt: Date
}>

export type AddStageUpdateInput = {
  stageId?: ID
  content: string
  isClientVisible?: boolean
}

export type ClientFeedback = {
  id: ID
  processId: ID
  rating: 1 | 2 | 3 | 4 | 5
  comment?: string
  createdAt: Date
}
