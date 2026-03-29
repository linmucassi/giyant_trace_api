import type { FastifyRequest, FastifyReply } from 'fastify'
import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import { db } from '../db/index.js'
import { users } from '../db/index.js'
import { eq } from 'drizzle-orm'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      sub: string
      workspaceId: string
      role: string
      email: string
    }
    user: {
      id: string
      workspaceId: string
      role: string
      email: string
    }
  }
}

export const authPlugin = fp(async (server: FastifyInstance) => {
  server.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify()
      const payload = request.user as any
      const [user] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1)

      if (!user || !user.isActive) {
        return reply.code(401).send({ success: false, error: 'Unauthorized' })
      }
      ;(request as any).currentUser = user
    } catch {
      return reply.code(401).send({ success: false, error: 'Unauthorized' })
    }
  })
})

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}
