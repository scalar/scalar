import { generateUniqueValue } from '@/utils/bundle/hash'
import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'

describe('generateUniqueHash', () => {
  it('should generate hash values from the function we pass in', async () => {
    const hashFunction = async (value: string) => {
      if (value === 'a') {
        return 'a'
      }
      throw 'Ops'
    }

    const result = await generateUniqueValue(hashFunction, 'a', {})

    expect(result).toBe('a')
  })

  it('should return same value for the same input', async () => {
    const hashFunction = async (value: string) => {
      if (value === 'a') {
        return value
      }
      throw 'Ops'
    }

    const map = {}

    const result1 = await generateUniqueValue(hashFunction, 'a', map)
    expect(result1).toBe('a')

    const result2 = await generateUniqueValue(hashFunction, 'a', map)
    expect(result2).toBe('a')
  })

  it('should handle hash collisions', async () => {
    const hashFunction = async (value: string) => {
      // Hash a, b and c will produce collisions
      if (value === 'a' || value === 'b' || value === 'c') {
        return 'd'
      }

      // Hashing the hashed result
      if (value === 'd') {
        return 'e'
      }

      if (value === 'e') {
        return 'f'
      }

      if (value === 'f') {
        return 'g'
      }

      if (value === 'g') {
        return 'h'
      }

      throw 'Ops'
    }

    const map = {}

    const res1 = await generateUniqueValue(hashFunction, 'd', map)
    expect(res1).toBe('e')

    const res2 = await generateUniqueValue(hashFunction, 'b', map)
    expect(res2).toBe('d')

    // Takes the first available spot
    const res3 = await generateUniqueValue(hashFunction, 'a', map)
    expect(res3).toBe('f')

    // Produces the same output for the same input
    const res4 = await generateUniqueValue(hashFunction, 'a', map)
    expect(res4).toBe('f')

    const res5 = await generateUniqueValue(hashFunction, 'c', map)
    expect(res5).toBe('g')

    const res6 = await generateUniqueValue(hashFunction, 'g', map)
    expect(res6).toBe('h')
  })

  it('should throw when it reaches max depth', async () => {
    const hashFunction = async () => {
      return 'a'
    }

    const map = {}
    const result1 = await generateUniqueValue(hashFunction, 'a', map)
    expect(result1).toBe('a')

    const result2 = await generateUniqueValue(hashFunction, 'a', map)
    expect(result2).toBe('a')

    expect(() => generateUniqueValue(hashFunction, 'b', map)).rejects.toThrowError()
  })

  it('should generate the same value for the same input even when the function generates random values', async () => {
    const map = {}
    const result = await generateUniqueValue(() => randomUUID(), 'a', map)

    // Expect to get the same output for the same input even when the generator returns random values
    expect(await generateUniqueValue(() => randomUUID(), 'a', map)).toBe(result)
  })
})
