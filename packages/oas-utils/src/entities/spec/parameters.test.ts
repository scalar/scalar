import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { oasParameterSchema } from '../../../src/entities/spec/parameters'

describe('oasParameterSchema', () => {
  it('should validate a parameter with a correct example', () => {
    const validParameterWithExample = {
      in: 'query',
      name: 'limit',
      example: 10,
    }

    expect(() =>
      oasParameterSchema.parse(validParameterWithExample),
    ).not.toThrow()
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

    expect(() => oasParameterSchema.parse(validParameter)).not.toThrow()
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

    expect(() => oasParameterSchema.parse(invalidParameter)).toThrow(z.ZodError)
  })
})
