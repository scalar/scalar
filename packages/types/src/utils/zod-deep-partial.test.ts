import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { zodDeepPartial } from './zod-deep-partial.ts'

describe('zodDeepPartial', () => {
  // Test basic types
  it('should not make basic types optional', () => {
    const schema = z.string()
    const result = zodDeepPartial(schema)
    expect(result.isOptional()).toBe(false)
  })

  it('should not have default values', () => {
    const schema = z.object({ defaulted: z.string().default('test') })
    const result = zodDeepPartial(schema)
    expect(result.parse({})).toEqual({})
  })

  it('should not have nested default values', () => {
    const schema = z.object({ parent: z.object({ defaulted: z.string().default('test') }) })
    const result = zodDeepPartial(schema)
    expect(result.parse({})).toEqual({})
  })

  // Test object types
  it('should make all object fields optional', () => {
    const schema = z.object({
      required: z.string(),
      alreadyOptional: z.string().optional(),
      nested: z.object({
        deepRequired: z.number(),
      }),
    })

    const result = zodDeepPartial(schema)

    // Create type to verify structure
    type Result = z.infer<typeof result>
    const valid: Result = {} // Should compile with empty object
    expect(result.parse(valid)).toEqual({})

    // Should accept partial data
    expect(result.parse({ required: 'test' })).toEqual({ required: 'test' })

    // Should accept nested partial data
    expect(result.parse({ nested: {} })).toEqual({ nested: {} })
  })

  // Test default values
  it('should remove default values', () => {
    const schema = z.object({
      withDefault: z.string().default('test'),
      nested: z.object({
        deepWithDefault: z.number().default(42),
      }),
    })

    const result = zodDeepPartial(schema)

    // Check if defaults are removed
    expect(result.parse({})).toEqual({})
  })

  // Test catch values
  it('should remove catch values for non-existent parameters', () => {
    const schema = z.object({
      withCatch: z.string().catch('fallback'),
      nested: z.object({
        deepWithCatch: z.number().catch(0),
      }),
    })

    const result = zodDeepPartial(schema)
    expect(result.parse({})).toEqual({})
  })

  // Test catch values
  it('should catch invalid values for existing parameters', () => {
    const schema = z.object({
      withCatch: z.string().catch('fallback'),
      nested: z.object({
        deepWithCatch: z.number().catch(0),
      }),
    })

    const result = zodDeepPartial(schema)

    // Invalid data should be caught
    expect(result.parse({ withCatch: 123, nested: { deepWithCatch: 'invalid' } })).toEqual({
      withCatch: 'fallback',
      nested: { deepWithCatch: 0 },
    })
  })

  // Test complex nested structure
  it('should handle complex nested structures', () => {
    const schema = z.object({
      array: z.array(
        z.object({
          field: z.string().default('test'),
          optional: z.number().optional(),
        }),
      ),
      record: z.record(z.string(), z.boolean().catch(false)),
      union: z.union([z.string(), z.number().default(0)]),
    })

    const result = zodDeepPartial(schema)

    // Everything should be optional
    const valid: z.infer<typeof result> = {}
    expect(result.parse(valid)).toEqual({})

    // Should accept partial nested structures
    expect(
      result.parse({
        array: [{}],
        record: {},
      }),
    ).toEqual({
      array: [{}],
      record: {},
    })

    // Should still validate types when provided
    expect(() =>
      result.parse({
        array: [{ field: 123 }], // Invalid type
      }),
    ).toThrow()
  })

  // Test security scheme cleaning
  it('should clean security scheme default values', () => {
    const schema = z.object({
      type: z.literal('apiKey'),
      name: z.string().default(''),
      in: z.enum(['header', 'query', 'cookie']).default('header'),
      nameKey: z.string().default(''),
      uid: z.string().default(''),
    })

    const result = zodDeepPartial(schema)

    // Should not include any default values
    expect(result.parse({})).toEqual({})

    // Should accept partial data
    expect(result.parse({ type: 'apiKey', name: 'x-api-key' })).toEqual({ type: 'apiKey', name: 'x-api-key' })
  })

  it('should clean nested security scheme defaults', () => {
    const schema = z.object({
      flows: z
        .object({
          implicit: z
            .object({
              type: z.literal('implicit'),
              authorizationUrl: z.string().default(''),
              scopes: z.record(z.string(), z.string().optional().default('')).default({}),
              selectedScopes: z.array(z.string()).default([]),
              'x-scalar-client-id': z.string().default(''),
              token: z.string().default(''),
            })
            .optional(),
        })
        .default({}),
    })

    const result = zodDeepPartial(schema)

    // Should not include any default values
    expect(result.parse({})).toEqual({})

    // Should accept partial nested data
    expect(
      result.parse({
        flows: {
          implicit: {
            type: 'implicit',
            authorizationUrl: 'https://auth.example.com',
          },
        },
      }),
    ).toEqual({
      flows: {
        implicit: {
          type: 'implicit',
          authorizationUrl: 'https://auth.example.com',
        },
      },
    })
  })

  it('should clean record of security schemes', () => {
    const schema = z.record(
      z.string(),
      z.object({
        type: z.literal('http'),
        scheme: z
          .string()
          .toLowerCase()
          .pipe(z.enum(['basic', 'bearer']))
          .default('basic'),
        bearerFormat: z.union([z.literal('JWT'), z.string()]).default('JWT'),
        username: z.string().default(''),
        password: z.string().default(''),
        token: z.string().default(''),
      }),
    )

    const result = zodDeepPartial(schema)

    // Should not include any default values
    expect(result.parse({})).toEqual({})

    // Should accept partial data in record values
    expect(
      result.parse({
        basicAuth: {
          type: 'http',
          scheme: 'basic',
        },
      }),
    ).toEqual({
      basicAuth: {
        type: 'http',
        scheme: 'basic',
      },
    })
  })

  it('should properly clean security schemes with multiple defaults', () => {
    const schema = z.object({
      apiKey: z.object({
        type: z.literal('apiKey'),
        name: z.string(),
        in: z.literal('header'),
        nameKey: z.string().default(''),
        uid: z.string().default(''),
        value: z.string().default(''),
      }),
      basic: z.object({
        type: z.literal('http'),
        scheme: z.literal('basic'),
        bearerFormat: z.string().default('JWT'),
        nameKey: z.string().default(''),
        password: z.string().default(''),
        token: z.string().default(''),
        uid: z.string().default(''),
        username: z.string().default(''),
      }),
    })

    const result = zodDeepPartial(schema)

    const input = {
      apiKey: {
        type: 'apiKey',
        name: 'api_key',
        in: 'header',
      },
      basic: {
        type: 'http',
        scheme: 'basic',
      },
    }

    // Should not include any default values
    expect(result.parse(input)).toEqual(input)
  })

  it('should clean default values in union types', () => {
    const schema = z.union([
      z.object({
        type: z.literal('http'),
        scheme: z.string().default('basic'),
        bearerFormat: z.string().default('JWT'),
        username: z.string().default(''),
        password: z.string().default(''),
        token: z.string().default(''),
      }),
      z.object({
        type: z.literal('apiKey'),
        name: z.string(),
        in: z.literal('header'),
        value: z.string().default(''),
      }),
    ])

    const result = zodDeepPartial(schema)

    // Test with http type
    expect(
      result.parse({
        type: 'http',
        scheme: 'basic',
      }),
    ).toEqual({
      type: 'http',
      scheme: 'basic',
    })

    // Test with apiKey type
    expect(
      result.parse({
        type: 'apiKey',
        name: 'api_key',
        in: 'header',
      }),
    ).toEqual({
      type: 'apiKey',
      name: 'api_key',
      in: 'header',
    })
  })
})
