import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db, clients } from '../db/index.js'
import { eq, and, ilike, sql } from 'drizzle-orm'

const createClientSchema = z.object({
  name: z.string().min(1).max(255),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  metadata: z.record(z.unknown()).optional(),
})

export async function clientRoutes(server: FastifyInstance) {
  const preHandler = [server.authenticate]

  // List clients
  server.get('/', { preHandler }, async (request, reply) => {
    const payload = request.user as any
    const { search, page = '1', limit = '20' } = request.query as any
    const offset = (Number(page) - 1) * Number(limit)

    const conditions = [eq(clients.workspaceId, payload.workspaceId)]
    if (search) conditions.push(ilike(clients.name, `%${search}%`))

    const [total] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(clients)
      .where(and(...conditions))

    const data = await db
      .select()
      .from(clients)
      .where(and(...conditions))
      .limit(Number(limit))
      .offset(offset)
      .orderBy(clients.name)

    return reply.send({
      success: true,
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: total.count,
        totalPages: Math.ceil(total.count / Number(limit)),
      },
    })
  })

  // Get client
  server.get('/:id', { preHandler }, async (request, reply) => {
    const payload = request.user as any
    const { id } = request.params as { id: string }

    const [client] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, id), eq(clients.workspaceId, payload.workspaceId)))

    if (!client) return reply.code(404).send({ success: false, error: 'Client not found' })
    return reply.send({ success: true, data: client })
  })

  // Create client
  server.post('/', { preHandler }, async (request, reply) => {
    const payload = request.user as any
    const body = createClientSchema.parse(request.body)

    const [client] = await db
      .insert(clients)
      .values({ ...body, workspaceId: payload.workspaceId })
      .returning()

    return reply.code(201).send({ success: true, data: client })
  })

  // Update client
  server.put('/:id', { preHandler }, async (request, reply) => {
    const payload = request.user as any
    const { id } = request.params as { id: string }
    const body = createClientSchema.partial().parse(request.body)

    const [updated] = await db
      .update(clients)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(clients.id, id), eq(clients.workspaceId, payload.workspaceId)))
      .returning()

    if (!updated) return reply.code(404).send({ success: false, error: 'Client not found' })
    return reply.send({ success: true, data: updated })
  })

  // Delete client
  server.delete('/:id', { preHandler }, async (request, reply) => {
    const payload = request.user as any
    const { id } = request.params as { id: string }

    await db.delete(clients).where(and(eq(clients.id, id), eq(clients.workspaceId, payload.workspaceId)))
    return reply.send({ success: true, data: null })
  })
}
