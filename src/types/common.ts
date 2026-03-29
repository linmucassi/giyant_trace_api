export type ID = string

export type Pagination = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type PaginatedResponse<T> = {
  data: T[]
  pagination: Pagination
}

export type ApiResponse<T> = {
  success: true
  data: T
} | {
  success: false
  error: string
  code?: string
}

export type DateRange = {
  from: Date
  to: Date
}

export type FileAttachment = {
  id: ID
  filename: string
  url: string
  mimeType: string
  size: number
  type: 'image' | 'document' | 'video'
  caption?: string
  isClientVisible: boolean
  createdAt: Date
}

export type NotificationChannel = 'email' | 'whatsapp' | 'sms'
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'delivered'
