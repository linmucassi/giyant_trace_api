import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db, workspaces, workspaceSettings } from '../db/index.js'
import { eq } from 'drizzle-orm'

const updateWorkspaceSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
})

const updateSettingsSchema = z.object({
  notificationsEmail: z.boolean().optional(),
  notificationsWhatsapp: z.boolean().optional(),
  notificationsSms: z.boolean().optional(),
  timezone: z.string().optional(),
  currency: z.string().length(3).optional(),
  whatsappNumber: z.string().optional(),
  emailFrom: z.string().email().optional(),
})

export async function workspaceRoutes(server: FastifyInstance) {
  const preHandler = [server.authenticate]

  server.get('/', { preHandler }, async (request, reply) => {
    const payload = request.user as any
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, payload.workspaceId))

    if (!workspace) return reply.code(404).send({ success: false, error: 'Workspace not found' })
    return reply.send({ success: true, data: workspace })
  })

  server.put('/', { preHandler }, async (request, reply) => {
    const payload = request.user as any
    const body = updateWorkspaceSchema.parse(request.body)

    const [updated] = await db
      .update(workspaces)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(workspaces.id, payload.workspaceId))
      .returning()

    return reply.send({ success: true, data: updated })
  })

  server.get('/settings', { preHandler }, async (request, reply) => {
    const payload = request.user as any
    const [settings] = await db
      .select()
      .from(workspaceSettings)
      .where(eq(workspaceSettings.workspaceId, payload.workspaceId))

    return reply.send({ success: true, data: settings })
  })

  server.put('/settings', { preHandler }, async (request, reply) => {
    const payload = request.user as any
    const body = updateSettingsSchema.parse(request.body)

    const [updated] = await db
      .update(workspaceSettings)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(workspaceSettings.workspaceId, payload.workspaceId))
      .returning()

    return reply.send({ success: true, data: updated })
  })
}
