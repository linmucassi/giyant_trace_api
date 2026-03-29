import type { ID } from './common'

export type Plan = 'starter' | 'growth' | 'pro' | 'enterprise'

export type Workspace = {
  id: ID
  name: string
  slug: string
  logoUrl?: string
  primaryColor: string
  secondaryColor: string
  plan: Plan
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export type WorkspaceSettings = {
  workspaceId: ID
  notificationsEmail: boolean
  notificationsWhatsapp: boolean
  notificationsSms: boolean
  defaultTemplateId?: ID
  timezone: string
  currency: string
  whatsappNumber?: string
  emailFrom?: string
  customDomain?: string
  updatedAt: Date
}

export type CreateWorkspaceInput = {
  name: string
  slug: string
  industry?: string
}

export type UpdateWorkspaceInput = Partial<{
  name: string
  logoUrl: string
  primaryColor: string
  secondaryColor: string
}>

export type UpdateWorkspaceSettingsInput = Partial<WorkspaceSettings>
