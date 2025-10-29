import { beforeAll, describe, expect, it } from 'vitest'

import { generateHash } from './generate-hash'

// Ensure Web Crypto API is available in the Node test environment
beforeAll(async () => {
  const hasSubtle = typeof globalThis.crypto !== 'undefined' && 'subtle' in globalThis.crypto
  if (!hasSubtle) {
    const { webcrypto } = await import('node:crypto')
    // We cast to unknown first to avoid bringing DOM lib types into the test env
    // This assignment makes the Web Crypto API available for the function under test
    globalThis.crypto = webcrypto as unknown as Crypto
  }
})

describe('generateHash', () => {
  it('returns the correct SHA-256 hash for a known input', async () => {
    const result = await generateHash('hello world')
    expect(result).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9')
  })

  it('returns the correct SHA-256 hash for an empty string', async () => {
    const result = await generateHash('')
    expect(result).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
  })

  it('produces deterministic results for the same input', async () => {
    const first = await generateHash('deterministic')
    const second = await generateHash('deterministic')
    expect(first).toBe(second)
  })

  it('produces different results for different inputs', async () => {
    const a = await generateHash('foo')
    const b = await generateHash('bar')
    expect(a).not.toBe(b)
  })

  it('returns a lowercase hexadecimal string of length 64', async () => {
    const result = await generateHash('format-check')
    expect(result).toMatch(/^[a-f0-9]{64}$/)
  })
})
