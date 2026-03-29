import type { ID, NotificationChannel, NotificationStatus } from './common'

export type Notification = {
  id: ID
  workspaceId: ID
  processId: ID
  clientId: ID
  channel: NotificationChannel
  templateKey: string
  subject?: string
  body: string
  status: NotificationStatus
  sentAt?: Date
  error?: string
  createdAt: Date
}

export type SendNotificationInput = {
  processId: ID
  channel: NotificationChannel[]
  templateKey: string
  customMessage?: string
}

export type NotificationTemplate = {
  key: string
  channel: NotificationChannel
  subject?: string
  body: string
  variables: string[]
}
