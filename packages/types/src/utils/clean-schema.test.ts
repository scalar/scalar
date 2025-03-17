import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { cleanSchema } from './clean-schema.ts'

describe('cleanSchema', () => {
  // Test basic types
  it('should make basic types optional', () => {
    const schema = z.string()
    const result = cleanSchema(schema)
    expect(result.isOptional()).toBe(true)
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

    const result = cleanSchema(schema)

    // Check if the schema is optional
    expect(result.isOptional()).toBe(true)

    // Create type to verify structure
    type Result = z.infer<typeof result>
    const valid: Result = {} // Should compile with empty object
    expect(result.safeParse(valid).success).toBe(true)

    // Should accept partial data
    expect(
      result.safeParse({
        required: 'test',
      }).success,
    ).toBe(true)

    // Should accept nested partial data
    expect(
      result.safeParse({
        nested: {},
      }).success,
    ).toBe(true)
  })

  // Test default values
  it('should remove default values', () => {
    const schema = z.object({
      withDefault: z.string().default('test'),
      nested: z.object({
        deepWithDefault: z.number().default(42),
      }),
    })

    const result = cleanSchema(schema)

    // Check if defaults are removed
    const parsed = result.safeParse({})
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data).toEqual({})
    }
  })

  // Test catch values
  it('should remove catch values', () => {
    const schema = z.object({
      withCatch: z.string().catch('fallback'),
      nested: z.object({
        deepWithCatch: z.number().catch(0),
      }),
    })

    const result = cleanSchema(schema)

    // Invalid data should not be caught and transformed
    const parsed = result.safeParse({ withCatch: 123, nested: { deepWithCatch: 'invalid' } })
    expect(parsed.success).toBe(false)
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

    const result = cleanSchema(schema)

    // Everything should be optional
    const valid: z.infer<typeof result> = {}
    expect(result.safeParse(valid).success).toBe(true)

    // Should accept partial nested structures
    expect(
      result.safeParse({
        array: [{}],
        record: {},
      }).success,
    ).toBe(true)

    // Should still validate types when provided
    const invalidParse = result.safeParse({
      array: [{ field: 123 }], // Invalid type
    })
    expect(invalidParse.success).toBe(false)
  })
})
