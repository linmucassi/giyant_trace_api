import type { ID } from './common'

export type Client = {
  id: ID
  workspaceId: ID
  name: string
  phone?: string
  email?: string
  metadata?: Record<string, unknown>
  processCount?: number
  createdAt: Date
  updatedAt: Date
}

export type CreateClientInput = {
  name: string
  phone?: string
  email?: string
  metadata?: Record<string, unknown>
}

export type UpdateClientInput = Partial<CreateClientInput>
