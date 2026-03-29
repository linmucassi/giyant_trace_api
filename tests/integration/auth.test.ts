import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { buildApp } from '../helpers/app.js'
import type { FastifyInstance } from 'fastify'

// Mock the database module so integration tests don't need a real DB
vi.mock('../../src/db/index.js', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue([]),
        limit: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }),
  },
  users: {},
  workspaces: {},
  workspaceSettings: {},
  subscriptions: {},
  refreshTokens: {},
}))

let app: FastifyInstance

beforeAll(async () => {
  app = await buildApp()
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

describe('POST /api/v1/auth/register', () => {
  it('returns 400 for missing required fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email: 'not-an-email' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('returns 400 for invalid email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        workspaceName: 'Test Workshop',
        workspaceSlug: 'test-workshop',
        name: 'Test User',
        email: 'bad-email',
        password: 'password123',
      },
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('POST /api/v1/auth/login', () => {
  it('returns 400 for missing credentials', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {},
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('GET /api/v1/auth/me', () => {
  it('returns 401 without token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/auth/me' })
    expect(res.statusCode).toBe(401)
  })
})
