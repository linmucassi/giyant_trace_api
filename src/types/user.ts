import type { ID } from './common'

export type UserRole = 'owner' | 'admin' | 'member'

export type User = {
  id: ID
  workspaceId: ID
  email: string
  name: string
  role: UserRole
  avatarUrl?: string
  isActive: boolean
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

export type AuthTokens = {
  accessToken: string
  refreshToken: string
}

export type LoginInput = {
  email: string
  password: string
}

export type RegisterInput = {
  workspaceName: string
  workspaceSlug: string
  name: string
  email: string
  password: string
}

export type InviteUserInput = {
  email: string
  name: string
  role: UserRole
}
