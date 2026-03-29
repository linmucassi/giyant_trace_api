import type { FastifyInstance } from 'fastify'
import { env } from '../config/env.js'

export async function webhookRoutes(server: FastifyInstance) {
  // WhatsApp webhook verification
  server.get('/whatsapp', async (request, reply) => {
    const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = request.query as any

    if (mode === 'subscribe' && token === env.WHATSAPP_VERIFY_TOKEN) {
      return reply.send(challenge)
    }
    return reply.code(403).send({ success: false, error: 'Forbidden' })
  })

  // WhatsApp incoming messages
  server.post('/whatsapp', async (request, reply) => {
    // Handle incoming WhatsApp messages (delivery status, client replies)
    server.log.info({ body: request.body }, 'WhatsApp webhook received')
    return reply.send({ success: true })
  })
}
