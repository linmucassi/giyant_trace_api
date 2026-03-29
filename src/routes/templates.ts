import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db, templates, templateStages } from '../db/index.js'
import { eq, and, or, isNull } from 'drizzle-orm'

const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  industry: z.enum(['auto_repair', 'electronics_repair', 'furniture', 'logistics', 'home_services', 'custom']),
  description: z.string().optional(),
  stages: z.array(
    z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      order: z.number().int().min(1),
      expectedDurationHours: z.number().int().min(0),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      icon: z.string().optional(),
    })
  ).min(1),
})

export async function templateRoutes(server: FastifyInstance) {
  const preHandler = [server.authenticate]

  // List templates (global + workspace-specific)
  server.get('/', { preHandler }, async (request, reply) => {
    const payload = request.user as any

    const data = await db.query.templates.findMany({
      where: and(
        eq(templates.isActive, true),
        or(isNull(templates.workspaceId), eq(templates.workspaceId, payload.workspaceId))
      ),
      with: { stages: { orderBy: (s: any, { asc }: any) => [asc(s.order)] } },
      orderBy: (t: any, { asc }: any) => [asc(t.name)],
    })

    return reply.send({ success: true, data })
  })

  // Create template
  server.post('/', { preHandler }, async (request, reply) => {
    const payload = request.user as any
    const body = createTemplateSchema.parse(request.body)
    const { stages, ...templateData } = body

    const [template] = await db
      .insert(templates)
      .values({ ...templateData, workspaceId: payload.workspaceId })
      .returning()

    await db.insert(templateStages).values(
      stages.map((s) => ({ ...s, templateId: template.id, color: s.color ?? '#3B82F6' }))
    )

    const full = await db.query.templates.findFirst({
      where: eq(templates.id, template.id),
      with: { stages: { orderBy: (s: any, { asc }: any) => [asc(s.order)] } },
    })

    return reply.code(201).send({ success: true, data: full })
  })

  // Delete template
  server.delete('/:id', { preHandler }, async (request, reply) => {
    const payload = request.user as any
    const { id } = request.params as { id: string }

    await db
      .delete(templates)
      .where(and(eq(templates.id, id), eq(templates.workspaceId, payload.workspaceId)))

    return reply.send({ success: true, data: null })
  })
}
