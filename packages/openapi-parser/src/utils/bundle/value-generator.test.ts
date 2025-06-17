import { generateUniqueValue, uniqueValueGeneratorFactory } from '@/utils/bundle/value-generator'
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
})

describe('uniqueValueGeneratorFactory', () => {
  it('should generate unique values while caching the previously generated values', async () => {
    let calls = 0
    const compress = (value: string) => {
      // Ensure we return the same value only once for the input 'b'
      if (value === 'b' && calls === 0) {
        calls++
        return 'another-value'
      }
      calls++
      return 'should not be returned'
    }
    const { generate } = uniqueValueGeneratorFactory(compress, {
      'b': 'a',
    })

    // Should use the value from the cache
    expect(await generate('a')).toBe('b')

    // should use the generator function to generate a unique value
    expect(await generate('b')).toBe('another-value')

    // should generate the same value when we call generate with the same input
    expect(await generate('b')).toBe('another-value')
  })

  it('should handle conflicts', async () => {
    const compress = (value: string) => {
      if (value === 'a') {
        return 'c'
      }

      if (value === 'b') {
        return 'c'
      }

      if (value === 'c') {
        return 'd'
      }
      return 'should not be returned'
    }
    const { generate } = uniqueValueGeneratorFactory(compress, {})

    expect(await generate('a')).toBe('c')
    expect(await generate('b')).toBe('d')
  })

  it('should handle numeric strings by prefixing them with letters', async () => {
    const compress = (value: string) => {
      if (!value) {
        return '92819102'
      }
      return 'radom value'
    }

    const { generate } = uniqueValueGeneratorFactory(compress, {})

    // Prefix with a letter
    expect(await generate('')).toBe('a92819102')

    // Should return the same value for same input
    expect(await generate('')).toBe('a92819102')

    expect(await generate('abc')).toBe('radom value')
  })
})
