import { beforeAll, afterAll } from 'vitest'

// Set required env vars for tests before any imports
process.env.DATABASE_URL = 'postgresql://postgres:password@localhost:5432/giyant_trace_test'
process.env.JWT_SECRET = 'test-jwt-secret-that-is-long-enough-for-validation'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-that-is-long-enough-too'
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-long!'
process.env.NODE_ENV = 'test'
process.env.WEB_URL = 'http://localhost:3000'
process.env.ADMIN_URL = 'http://localhost:3002'

beforeAll(async () => {
  // Global test setup (e.g. run migrations on test DB)
})

afterAll(async () => {
  // Global teardown
})
