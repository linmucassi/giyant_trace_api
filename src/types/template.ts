import type { ID } from './common'

export type Industry =
  | 'auto_repair'
  | 'electronics_repair'
  | 'furniture'
  | 'logistics'
  | 'home_services'
  | 'custom'

export type TemplateStage = {
  id: ID
  templateId: ID
  name: string
  description?: string
  order: number
  expectedDurationHours: number
  color: string
  icon?: string
}

export type Template = {
  id: ID
  workspaceId?: ID
  name: string
  industry: Industry
  description?: string
  isActive: boolean
  stages: TemplateStage[]
  createdAt: Date
  updatedAt: Date
}

export type CreateTemplateInput = {
  name: string
  industry: Industry
  description?: string
  stages: Array<{
    name: string
    description?: string
    order: number
    expectedDurationHours: number
    color?: string
    icon?: string
  }>
}
