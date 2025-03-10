import { ParameterObjectSchema } from '@/entities/spec/parameters'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

describe('ParameterObjectSchema', () => {
  it('should validate a parameter with a correct example', () => {
    const validParameterWithExample = {
      in: 'query',
      name: 'limit',
      example: 10,
    }

    expect(() => ParameterObjectSchema.parse(validParameterWithExample)).not.toThrow()
  })

  it('should validate examples as a record with correct structure', () => {
    const validExamples = {
      milkyWay: {
        value: 'Milky Way',
        summary: 'Our galaxy',
      },
      andromeda: {
        value: 'Andromeda',
        summary: 'Nearest major galaxy',
      },
    }

    const validParameter = {
      in: 'query',
      name: 'galaxy',
      examples: validExamples,
    }

    expect(() => ParameterObjectSchema.parse(validParameter)).not.toThrow()
  })

  it('should fail validation if examples have incorrect structure', () => {
    const invalidExamples = {
      milkyWay: {
        value: 'Milky Way',
        // Summary is optional, so this should not cause a failure
      },
      andromeda: 'This should be an object, not a string',
    }

    const invalidParameter = {
      in: 'query',
      name: 'galaxy',
      examples: invalidExamples,
    }

    expect(() => ParameterObjectSchema.parse(invalidParameter)).toThrow(z.ZodError)
  })

  it('should validate examples as an array', () => {
    const validParameter = {
      in: 'query',
      name: 'galaxy',
      examples: ['Milky Way', 'Andromeda'],
    }

    expect(() => ParameterObjectSchema.parse(validParameter)).not.toThrow()
  })

  it('should validate examples with a single array item', () => {
    const validParameter = {
      in: 'query',
      name: 'galaxy',
      examples: ['Milky Way'],
    }

    expect(() => ParameterObjectSchema.parse(validParameter)).not.toThrow()
  })

  it('should validate with an empty array of examples', () => {
    const validParameter = {
      in: 'query',
      name: 'galaxy',
      examples: [],
    }

    expect(() => ParameterObjectSchema.parse(validParameter)).not.toThrow()
  })
})
