import type { FastifyInstance } from 'fastify'
import { db, processes, processStages, clientFeedback } from '../db/index.js'
import { eq, and, gte, sql, avg } from 'drizzle-orm'

export async function analyticsRoutes(server: FastifyInstance) {
  const preHandler = [server.authenticate]

  server.get('/overview', { preHandler }, async (request, reply) => {
    const payload = request.user as any
    const workspaceId = payload.workspaceId

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [stats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`sum(case when status = 'active' then 1 else 0 end)::int`,
        completed: sql<number>`sum(case when status = 'completed' then 1 else 0 end)::int`,
        onHold: sql<number>`sum(case when status = 'on_hold' then 1 else 0 end)::int`,
      })
      .from(processes)
      .where(eq(processes.workspaceId, workspaceId))

    const [recentStats] = await db
      .select({ newThisMonth: sql<number>`count(*)::int` })
      .from(processes)
      .where(and(eq(processes.workspaceId, workspaceId), gte(processes.createdAt, thirtyDaysAgo)))

    const [avgRating] = await db
      .select({ avg: avg(clientFeedback.rating) })
      .from(clientFeedback)
      .innerJoin(processes, eq(clientFeedback.processId, processes.id))
      .where(eq(processes.workspaceId, workspaceId))

    return reply.send({
      success: true,
      data: {
        ...stats,
        newThisMonth: recentStats.newThisMonth,
        averageRating: avgRating.avg ? Number(avgRating.avg).toFixed(1) : null,
      },
    })
  })
}
