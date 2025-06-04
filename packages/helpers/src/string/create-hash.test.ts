import { describe, it, expect } from 'vitest'
import { createHash } from './create-hash'

describe('createHash', () => {
  it('should return 0 for undefined input', () => {
    expect(createHash(undefined)).toBe(0)
  })

  it('should return 0 for empty string', () => {
    expect(createHash('')).toBe(0)
  })

  it('should generate consistent hash for same input', () => {
    const input = 'test string'
    const hash1 = createHash(input)
    const hash2 = createHash(input)
    expect(hash1).toBe(hash2)
  })

  it('should generate different hashes for different inputs', () => {
    const hash1 = createHash('test1')
    const hash2 = createHash('test2')
    expect(hash1).not.toBe(hash2)
  })

  it('should handle special characters', () => {
    const input = '!@#$%^&*()_+'
    const hash = createHash(input)
    expect(typeof hash).toBe('number')
    expect(Number.isInteger(hash)).toBe(true)
  })

  it('should handle unicode characters', () => {
    const input = 'Hello 世界'
    const hash = createHash(input)
    expect(typeof hash).toBe('number')
    expect(Number.isInteger(hash)).toBe(true)
  })

  it('should generate 32-bit integer', () => {
    const input = 'test string'
    const hash = createHash(input)
    expect(hash).toBeGreaterThanOrEqual(-2147483648) // -2^31
    expect(hash).toBeLessThanOrEqual(2147483647) // 2^31 - 1
  })
})
