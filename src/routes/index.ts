import type { FastifyInstance } from 'fastify'
import { authRoutes } from './auth.js'
import { workspaceRoutes } from './workspaces.js'
import { clientRoutes } from './clients.js'
import { processRoutes } from './processes.js'
import { templateRoutes } from './templates.js'
import { publicRoutes } from './public.js'
import { webhookRoutes } from './webhooks.js'
import { analyticsRoutes } from './analytics.js'

export async function registerRoutes(server: FastifyInstance) {
  await server.register(publicRoutes, { prefix: '/api/v1/public' })
  await server.register(authRoutes, { prefix: '/api/v1/auth' })
  await server.register(workspaceRoutes, { prefix: '/api/v1/workspace' })
  await server.register(clientRoutes, { prefix: '/api/v1/clients' })
  await server.register(processRoutes, { prefix: '/api/v1/processes' })
  await server.register(templateRoutes, { prefix: '/api/v1/templates' })
  await server.register(analyticsRoutes, { prefix: '/api/v1/analytics' })
  await server.register(webhookRoutes, { prefix: '/api/v1/webhooks' })

  server.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))
}
