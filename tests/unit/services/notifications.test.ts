import { describe, it, expect } from 'vitest'
import { interpolateTemplate, notificationTemplates } from '../../../src/services/notifications.js'

describe('interpolateTemplate', () => {
  it('replaces all known variables', () => {
    const result = interpolateTemplate('Hi {{name}}, your {{item}} is ready.', {
      name: 'Thabo',
      item: 'car',
    })
    expect(result).toBe('Hi Thabo, your car is ready.')
  })

  it('leaves unknown variables as-is', () => {
    const result = interpolateTemplate('Hello {{name}}, ref: {{unknown}}', { name: 'Linda' })
    expect(result).toBe('Hello Linda, ref: {{unknown}}')
  })

  it('handles empty variables object', () => {
    const result = interpolateTemplate('Hi {{name}}', {})
    expect(result).toBe('Hi {{name}}')
  })
})

describe('notificationTemplates', () => {
  it('has templates for all key events', () => {
    const keys = ['process_created', 'stage_updated', 'ready_for_collection', 'completed']
    for (const key of keys) {
      expect(notificationTemplates).toHaveProperty(key)
    }
  })

  it('each template has whatsapp, email and sms variants', () => {
    for (const [, template] of Object.entries(notificationTemplates)) {
      expect(template).toHaveProperty('whatsapp')
      expect(template).toHaveProperty('email')
      expect(template).toHaveProperty('sms')
    }
  })
})
