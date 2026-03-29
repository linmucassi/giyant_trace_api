import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db, users, workspaces, workspaceSettings, subscriptions, refreshTokens } from '../db/index.js'
import { eq, and } from 'drizzle-orm'
import { generateId } from '../lib/utils.js'
import { env } from '../config/env.js'

const registerSchema = z.object({
  workspaceName: z.string().min(2).max(100),
  workspaceSlug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export async function authRoutes(server: FastifyInstance) {
  // Register
  server.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body)

    // Check slug availability
    const [existing] = await db.select().from(workspaces).where(eq(workspaces.slug, body.workspaceSlug))
    if (existing) {
      return reply.code(409).send({ success: false, error: 'Workspace slug already taken' })
    }

    const [existingUser] = await db.select().from(users).where(eq(users.email, body.email))
    if (existingUser) {
      return reply.code(409).send({ success: false, error: 'Email already registered' })
    }

    const passwordHash = await bcrypt.hash(body.password, 12)

    // Create workspace
    const [workspace] = await db
      .insert(workspaces)
      .values({ name: body.workspaceName, slug: body.workspaceSlug })
      .returning()

    // Create workspace settings
    await db.insert(workspaceSettings).values({ workspaceId: workspace.id })

    // Create trial subscription
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 14)
    await db.insert(subscriptions).values({
      workspaceId: workspace.id,
      plan: 'starter',
      status: 'trialing',
      trialEndsAt,
    })

    // Create owner user
    const [user] = await db
      .insert(users)
      .values({
        workspaceId: workspace.id,
        email: body.email,
        passwordHash,
        name: body.name,
        role: 'owner',
      })
      .returning()

    const accessToken = server.jwt.sign({
      sub: user.id,
      workspaceId: workspace.id,
      role: user.role,
      email: user.email,
    })

    return reply.code(201).send({
      success: true,
      data: {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        workspace: { id: workspace.id, name: workspace.name, slug: workspace.slug },
        tokens: { accessToken },
      },
    })
  })

  // Login
  server.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body)

    const [user] = await db.select().from(users).where(eq(users.email, body.email))
    if (!user || !user.isActive) {
      return reply.code(401).send({ success: false, error: 'Invalid credentials' })
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash)
    if (!valid) {
      return reply.code(401).send({ success: false, error: 'Invalid credentials' })
    }

    // Update last login
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id))

    const accessToken = server.jwt.sign({
      sub: user.id,
      workspaceId: user.workspaceId,
      role: user.role,
      email: user.email,
    })

    const refreshToken = generateId(64)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await db.insert(refreshTokens).values({ userId: user.id, token: refreshToken, expiresAt })

    return reply.send({
      success: true,
      data: {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        tokens: { accessToken, refreshToken },
      },
    })
  })

  // Get current user
  server.get('/me', {
    preHandler: [server.authenticate],
    handler: async (request, reply) => {
      const payload = request.user as any
      const [user] = await db
        .select({ id: users.id, name: users.name, email: users.email, role: users.role, workspaceId: users.workspaceId })
        .from(users)
        .where(eq(users.id, payload.sub))

      if (!user) return reply.code(404).send({ success: false, error: 'User not found' })
      return reply.send({ success: true, data: user })
    },
  })
}
