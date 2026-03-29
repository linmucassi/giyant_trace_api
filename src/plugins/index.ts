import type { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { ZodError } from 'zod'
import { env } from '../config/env.js'
import { authPlugin } from './auth.js'

export async function registerPlugins(server: FastifyInstance) {
  // Security
  await server.register(helmet, { global: true })

  // CORS
  await server.register(cors, {
    origin: [env.WEB_URL, env.ADMIN_URL],
    credentials: true,
  })

  // JWT
  await server.register(jwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: env.JWT_EXPIRES_IN },
  })

  // Rate limiting
  await server.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW,
  })

  // OpenAPI docs
  await server.register(swagger, {
    openapi: {
      info: {
        title: 'GiyantTrace API',
        description: 'Process Status Management Platform API',
        version: '1.0.0',
      },
      servers: [{ url: `http://localhost:${env.API_PORT}` }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
  })

  await server.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list', deepLinking: true },
  })

  // Auth decorator (must be after JWT)
  await server.register(authPlugin)

  // Convert ZodError validation failures to 400
  server.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        success: false,
        error: 'Validation failed',
        issues: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      })
    }
    server.log.error(error)
    return reply.code(error.statusCode ?? 500).send({
      success: false,
      error: error.message ?? 'Internal server error',
    })
  })
}
