import { describe, expect, it } from 'vitest'

import { generateHash } from './generate-hash'

describe('generateHash', () => {
  it('generates a hash from a simple string', async () => {
    const result = await generateHash('hello world')

    // Should return a non-empty string
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('produces consistent hashes for the same input', async () => {
    const input = 'consistent-test-string'
    const hash1 = await generateHash(input)
    const hash2 = await generateHash(input)
    const hash3 = await generateHash(input)

    // Same input should always produce the same hash
    expect(hash1).toBe(hash2)
    expect(hash2).toBe(hash3)
  })

  it('produces different hashes for different inputs', async () => {
    const hash1 = await generateHash('first string')
    const hash2 = await generateHash('second string')
    const hash3 = await generateHash('first strinG') // Case-sensitive

    // Different inputs should produce different hashes
    expect(hash1).not.toBe(hash2)
    expect(hash1).not.toBe(hash3)
    expect(hash2).not.toBe(hash3)
  })

  it('handles empty string', async () => {
    const result = await generateHash('')

    // Should handle empty strings without throwing
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')

    // Empty string should produce a consistent hash
    const result2 = await generateHash('')
    expect(result).toBe(result2)
  })

  it('handles special characters and unicode', async () => {
    const inputs = [
      '🚀 emoji test',
      'special chars: !@#$%^&*()',
      'unicode: こんにちは世界',
      'newlines\nand\ttabs',
      'mixed: 👾 special!@# unicode: 你好',
    ]

    const hashes = await Promise.all(inputs.map((input) => generateHash(input)))

    // All should produce valid hashes
    hashes.forEach((hash) => {
      expect(hash).toBeTruthy()
      expect(typeof hash).toBe('string')
    })

    // All should be unique
    const uniqueHashes = new Set(hashes)
    expect(uniqueHashes.size).toBe(inputs.length)

    // Should be consistent on repeated calls
    const repeatedHash = await generateHash('🚀 emoji test')
    expect(repeatedHash).toBe(hashes[0])
  })
})
