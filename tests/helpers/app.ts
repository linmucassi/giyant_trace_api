import Fastify from 'fastify'
import { registerPlugins } from '../../src/plugins/index.js'
import { registerRoutes } from '../../src/routes/index.js'

export async function buildApp() {
  const app = Fastify({ logger: false })
  await registerPlugins(app)
  await registerRoutes(app)
  return app
}
