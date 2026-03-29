import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db, processes, workspaces, workspaceSettings, clientFeedback } from '../db/index.js'
import { eq } from 'drizzle-orm'

const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
})

export async function publicRoutes(server: FastifyInstance) {
  // Track process by token (public, no auth)
  server.get('/track/:token', async (request, reply) => {
    const { token } = request.params as { token: string }

    const process = await db.query.processes.findFirst({
      where: eq(processes.trackingToken, token),
      with: {
        client: { columns: { id: true, name: true } },
        stages: {
          orderBy: (s: any, { asc }: any) => [asc(s.order)],
          with: {
            updates: {
              where: (u: any, { eq }: any) => eq(u.isClientVisible, true),
              orderBy: (u: any, { desc }: any) => [desc(u.createdAt)],
            },
          },
        },
      },
    })

    if (!process) {
      return reply.code(404).send({ success: false, error: 'Process not found' })
    }

    const [workspace] = await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        logoUrl: workspaces.logoUrl,
        primaryColor: workspaces.primaryColor,
        secondaryColor: workspaces.secondaryColor,
      })
      .from(workspaces)
      .where(eq(workspaces.id, process.workspaceId))

    // Filter internal-only updates
    const sanitized = {
      ...process,
      workspace,
      stages: process.stages.map((stage: any) => ({
        ...stage,
        updates: stage.updates.filter((u: any) => u.isClientVisible),
      })),
    }

    return reply.send({ success: true, data: sanitized })
  })

  // Submit client feedback
  server.post('/track/:token/feedback', async (request, reply) => {
    const { token } = request.params as { token: string }
    const body = feedbackSchema.parse(request.body)

    const [process] = await db
      .select({ id: processes.id, status: processes.status })
      .from(processes)
      .where(eq(processes.trackingToken, token))

    if (!process) return reply.code(404).send({ success: false, error: 'Process not found' })

    const [feedback] = await db
      .insert(clientFeedback)
      .values({ processId: process.id, rating: body.rating, comment: body.comment })
      .returning()

    return reply.code(201).send({ success: true, data: feedback })
  })
}
