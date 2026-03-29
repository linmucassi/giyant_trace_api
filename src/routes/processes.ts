import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db, processes, processStages, stageUpdates, clients } from '../db/index.js'
import { eq, and, sql, desc } from 'drizzle-orm'
import { generateTrackingToken, generateReferenceNumber } from '../lib/utils.js'

const createProcessSchema = z.object({
  clientId: z.string().uuid(),
  templateId: z.string().uuid().optional(),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  assignedToId: z.string().uuid().optional(),
  totalCost: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  stages: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        expectedDurationHours: z.number().int().positive(),
      })
    )
    .optional(),
  metadata: z.record(z.unknown()).optional(),
})

const addUpdateSchema = z.object({
  stageId: z.string().uuid().optional(),
  content: z.string().min(1),
  isClientVisible: z.boolean().default(true),
})

export async function processRoutes(server: FastifyInstance) {
  const preHandler = [server.authenticate]

  // List processes
  server.get('/', { preHandler }, async (request, reply) => {
    const payload = request.user as any
    const { status, page = '1', limit = '20' } = request.query as any
    const offset = (Number(page) - 1) * Number(limit)

    const conditions = [eq(processes.workspaceId, payload.workspaceId)]
    if (status) conditions.push(eq(processes.status, status))

    const [total] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(processes)
      .where(and(...conditions))

    const data = await db.query.processes.findMany({
      where: and(...conditions),
      with: { client: true, stages: { orderBy: (s: any, { asc }: any) => [asc(s.order)] } },
      limit: Number(limit),
      offset,
      orderBy: [desc(processes.createdAt)],
    })

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

  // Get single process
  server.get('/:id', { preHandler }, async (request, reply) => {
    const payload = request.user as any
    const { id } = request.params as { id: string }

    const process = await db.query.processes.findFirst({
      where: and(eq(processes.id, id), eq(processes.workspaceId, payload.workspaceId)),
      with: {
        client: true,
        stages: {
          orderBy: (s: any, { asc }: any) => [asc(s.order)],
          with: { updates: { orderBy: (u: any, { desc }: any) => [desc(u.createdAt)] } },
        },
        createdBy: { columns: { id: true, name: true } },
        assignedTo: { columns: { id: true, name: true } },
      },
    })

    if (!process) return reply.code(404).send({ success: false, error: 'Process not found' })
    return reply.send({ success: true, data: process })
  })

  // Create process
  server.post('/', { preHandler }, async (request, reply) => {
    const payload = request.user as any
    const body = createProcessSchema.parse(request.body)

    // Verify client belongs to workspace
    const [client] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, body.clientId), eq(clients.workspaceId, payload.workspaceId)))
    if (!client) return reply.code(404).send({ success: false, error: 'Client not found' })

    const trackingToken = generateTrackingToken()
    const referenceNumber = generateReferenceNumber()

    const [process] = await db
      .insert(processes)
      .values({
        workspaceId: payload.workspaceId,
        clientId: body.clientId,
        templateId: body.templateId,
        title: body.title,
        description: body.description,
        referenceNumber,
        trackingToken,
        totalCost: body.totalCost?.toString(),
        currency: body.currency ?? 'ZAR',
        createdById: payload.sub,
        assignedToId: body.assignedToId,
        metadata: body.metadata,
      })
      .returning()

    // Create stages if provided
    if (body.stages?.length) {
      let expectedDate = new Date()
      const stageData = body.stages.map((s, i) => {
        const stage = {
          processId: process.id,
          name: s.name,
          description: s.description,
          order: i + 1,
          expectedDurationHours: s.expectedDurationHours,
          expectedCompletionAt: new Date(expectedDate.getTime() + s.expectedDurationHours * 3600000),
          status: (i === 0 ? 'active' : 'pending') as 'active' | 'pending',
          startedAt: i === 0 ? new Date() : undefined,
        }
        expectedDate = stage.expectedCompletionAt
        return stage
      })

      const createdStages = await db.insert(processStages).values(stageData).returning()

      // Set current stage
      await db
        .update(processes)
        .set({ currentStageId: createdStages[0].id })
        .where(eq(processes.id, process.id))
    }

    return reply.code(201).send({ success: true, data: { ...process, trackingToken } })
  })

  // Advance to next stage
  server.post('/:id/advance', { preHandler }, async (request, reply) => {
    const payload = request.user as any
    const { id } = request.params as { id: string }

    const process = await db.query.processes.findFirst({
      where: and(eq(processes.id, id), eq(processes.workspaceId, payload.workspaceId)),
      with: { stages: { orderBy: (s: any, { asc }: any) => [asc(s.order)] } },
    })

    if (!process) return reply.code(404).send({ success: false, error: 'Process not found' })

    const currentIdx = process.stages.findIndex((s: any) => s.id === process.currentStageId)
    const currentStage = process.stages[currentIdx]
    const nextStage = process.stages[currentIdx + 1]

    if (currentStage) {
      await db
        .update(processStages)
        .set({ status: 'completed', completedAt: new Date() })
        .where(eq(processStages.id, currentStage.id))
    }

    if (nextStage) {
      await db
        .update(processStages)
        .set({ status: 'active', startedAt: new Date() })
        .where(eq(processStages.id, nextStage.id))

      const completedCount = currentIdx + 1 + 1
      const progress = Math.round((completedCount / process.stages.length) * 100)

      await db
        .update(processes)
        .set({ currentStageId: nextStage.id, progressPercentage: progress, updatedAt: new Date() })
        .where(eq(processes.id, id))
    } else {
      // All stages complete
      await db
        .update(processes)
        .set({
          status: 'completed',
          progressPercentage: 100,
          actualCompletionAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(processes.id, id))
    }

    return reply.send({ success: true, data: { advanced: true } })
  })

  // Add update/note
  server.post('/:id/updates', { preHandler }, async (request, reply) => {
    const payload = request.user as any
    const { id } = request.params as { id: string }
    const body = addUpdateSchema.parse(request.body)

    // Verify process belongs to workspace
    const [process] = await db
      .select({ id: processes.id })
      .from(processes)
      .where(and(eq(processes.id, id), eq(processes.workspaceId, payload.workspaceId)))

    if (!process) return reply.code(404).send({ success: false, error: 'Process not found' })

    const [update] = await db
      .insert(stageUpdates)
      .values({
        processId: id,
        processStageId: body.stageId,
        content: body.content,
        isClientVisible: body.isClientVisible,
        createdById: payload.sub,
      })
      .returning()

    return reply.code(201).send({ success: true, data: update })
  })

  // Generate PDF report (placeholder — full implementation uses @react-pdf/renderer)
  server.post('/:id/pdf', { preHandler }, async (request, reply) => {
    const payload = request.user as any
    const { id } = request.params as { id: string }

    const process = await db.query.processes.findFirst({
      where: and(eq(processes.id, id), eq(processes.workspaceId, payload.workspaceId)),
      with: { client: true, stages: { with: { updates: true } } },
    })

    if (!process) return reply.code(404).send({ success: false, error: 'Process not found' })

    // TODO: Generate actual PDF using @react-pdf/renderer
    return reply.send({
      success: true,
      data: {
        message: 'PDF generation queued',
        processId: id,
        downloadUrl: `/api/v1/processes/${id}/pdf/download`,
      },
    })
  })
}
