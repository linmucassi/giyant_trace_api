import Fastify from 'fastify'
import { env } from './config/env.js'
import { registerPlugins } from './plugins/index.js'
import { registerRoutes } from './routes/index.js'

const server = Fastify({
  logger: {
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport:
      env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  },
})

async function start() {
  try {
    await registerPlugins(server)
    await registerRoutes(server)

    await server.listen({ port: env.API_PORT, host: env.API_HOST })
    console.log(`🚀 GiyantTrace API running at http://${env.API_HOST}:${env.API_PORT}`)
    console.log(`📖 API Docs: http://${env.API_HOST}:${env.API_PORT}/docs`)
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
