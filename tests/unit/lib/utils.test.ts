import { describe, it, expect } from 'vitest'
import {
  generateId,
  generateTrackingToken,
  generateReferenceNumber,
  calculateExpectedCompletion,
} from '../../../src/lib/utils.js'

describe('generateId', () => {
  it('returns a string of the requested length', () => {
    expect(generateId(32)).toHaveLength(32)
    expect(generateId(16)).toHaveLength(16)
  })

  it('returns unique values each call', () => {
    expect(generateId()).not.toBe(generateId())
  })
})

describe('generateTrackingToken', () => {
  it('returns a non-empty string', () => {
    const token = generateTrackingToken()
    expect(typeof token).toBe('string')
    expect(token.length).toBeGreaterThan(20)
  })

  it('returns unique tokens', () => {
    expect(generateTrackingToken()).not.toBe(generateTrackingToken())
  })
})

describe('generateReferenceNumber', () => {
  it('starts with GT-', () => {
    expect(generateReferenceNumber()).toMatch(/^GT-/)
  })

  it('returns unique values', () => {
    const refs = new Set(Array.from({ length: 20 }, () => generateReferenceNumber()))
    expect(refs.size).toBe(20)
  })
})

describe('calculateExpectedCompletion', () => {
  it('returns a future date', () => {
    const result = calculateExpectedCompletion([
      { expectedDurationHours: 24 },
      { expectedDurationHours: 48 },
    ])
    expect(result.getTime()).toBeGreaterThan(Date.now())
  })

  it('adds up all stage hours correctly', () => {
    const before = Date.now()
    const result = calculateExpectedCompletion([{ expectedDurationHours: 1 }])
    const after = Date.now()
    const expectedMs = 1 * 3600 * 1000
    expect(result.getTime() - before).toBeGreaterThanOrEqual(expectedMs - 10)
    expect(result.getTime() - after).toBeLessThanOrEqual(expectedMs + 10)
  })
})
