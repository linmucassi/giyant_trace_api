import crypto from 'node:crypto'

export function generateId(length = 32): string {
  return crypto.randomBytes(length).toString('hex').slice(0, length)
}

export function generateTrackingToken(): string {
  return crypto.randomBytes(32).toString('base64url')
}

export function generateReferenceNumber(): string {
  const prefix = 'GT'
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

export function calculateExpectedCompletion(
  stages: Array<{ expectedDurationHours: number }>
): Date {
  const totalHours = stages.reduce((acc, s) => acc + s.expectedDurationHours, 0)
  return new Date(Date.now() + totalHours * 3600000)
}
