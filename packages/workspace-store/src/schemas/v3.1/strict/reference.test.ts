import type { Static } from '@scalar/typebox'
import { Type } from '@scalar/typebox'
import { Value } from '@scalar/typebox/value'
import type { RequiredDeep } from 'type-fest'
import { describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/typebox-coerce'

import {
  type ReferenceObject,
  ReferenceObjectExtensionsSchema,
  ReferenceObjectSchema,
  type ReferenceType,
  reference,
} from './reference'

describe('reference', () => {
  describe('ReferenceObjectSchema', () => {
    describe('strict type checking', () => {
      it('performs deep type checking on all nested properties', () => {
        type SchemaType = RequiredDeep<Static<typeof ReferenceObjectSchema>>
        type TypescriptType = RequiredDeep<ReferenceObject>

        const _test: SchemaType = {} as TypescriptType
        const _test2: TypescriptType = {} as SchemaType
        expect(_test).toEqual(_test2)
      })
    })

    describe('strict type checking for reference function', () => {
      it('performs deep type checking on reference schema and ReferenceType', () => {
        const TestSchema = Type.Object({
          name: Type.String(),
          age: Type.Number(),
        })
        const referencedSchema = Type.Union([TestSchema, reference(TestSchema)])

        type SchemaType = Static<typeof referencedSchema>
        type TypescriptType = ReferenceType<{ name: string; age: number }>

        const _test: SchemaType = {} as TypescriptType
        const _test2: TypescriptType = {} as SchemaType
        expect(_test).toEqual(_test2)
      })
    })

    describe('value checking', () => {
      it('parses valid reference object with minimal required fields correctly', () => {
        const validInput = {
          $ref: '#/components/schemas/User',
        }

        const result = coerceValue(ReferenceObjectSchema, validInput)

        expect(result).toEqual({
          $ref: '#/components/schemas/User',
        })
      })

      it('parses valid reference object with all fields correctly', () => {
        const validInput = {
          $ref: '#/components/schemas/User',
          summary: 'A user object',
          description: 'Detailed description of a user object',
          $status: 'loading',
          $global: true,
        }

        const result = coerceValue(ReferenceObjectSchema, validInput)

        expect(result).toEqual({
          $ref: '#/components/schemas/User',
          summary: 'A user object',
          description: 'Detailed description of a user object',
          $status: 'loading',
          $global: true,
        })
      })

      it('parses valid reference object with external URI correctly', () => {
        const validInput = {
          $ref: 'https://example.com/schemas/user.json',
          summary: 'External user schema',
          description: 'User schema from external source',
        }

        const result = coerceValue(ReferenceObjectSchema, validInput)

        expect(result).toEqual({
          $ref: 'https://example.com/schemas/user.json',
          summary: 'External user schema',
          description: 'User schema from external source',
        })
      })

      it('parses valid reference object with error status correctly', () => {
        const validInput = {
          $ref: '#/components/schemas/MissingSchema',
          $status: 'error',
          description: 'This reference could not be resolved',
        }

        const result = coerceValue(ReferenceObjectSchema, validInput)

        expect(result).toEqual({
          $ref: '#/components/schemas/MissingSchema',
          $status: 'error',
          description: 'This reference could not be resolved',
        })
      })

      it('parses valid reference object with optional fields omitted correctly', () => {
        const validInput = {
          $ref: '#/components/responses/Success',
        }

        const result = coerceValue(ReferenceObjectSchema, validInput)

        expect(result).toEqual({
          $ref: '#/components/responses/Success',
        })
      })

      describe('invalid inputs', () => {
        it('fails when given non-object input', () => {
          const invalidInput = 'not an object'

          expect(Value.Check(ReferenceObjectSchema, invalidInput)).toBe(false)
        })

        it('fails when given null input', () => {
          const invalidInput = null

          expect(Value.Check(ReferenceObjectSchema, invalidInput)).toBe(false)
        })

        it('fails when given array input', () => {
          const invalidInput = [
            {
              $ref: '#/components/schemas/User',
            },
          ]

          expect(Value.Check(ReferenceObjectSchema, invalidInput)).toBe(false)
        })

        it('fails when $ref is missing', () => {
          const invalidInput = {
            summary: 'Missing $ref',
            description: 'This should fail',
          }

          expect(Value.Check(ReferenceObjectSchema, invalidInput)).toBe(false)
        })

        it('fails when $ref is not a string', () => {
          const invalidInput = {
            $ref: 123,
          }

          expect(Value.Check(ReferenceObjectSchema, invalidInput)).toBe(false)
        })

        it('fails when summary is not a string', () => {
          const invalidInput = {
            $ref: '#/components/schemas/User',
            summary: 123,
          }

          expect(Value.Check(ReferenceObjectSchema, invalidInput)).toBe(false)
        })

        it('fails when description is not a string', () => {
          const invalidInput = {
            $ref: '#/components/schemas/User',
            description: 456,
          }

          expect(Value.Check(ReferenceObjectSchema, invalidInput)).toBe(false)
        })

        it('fails when $status has invalid value', () => {
          const invalidInput = {
            $ref: '#/components/schemas/User',
            $status: 'invalid',
          }

          expect(Value.Check(ReferenceObjectSchema, invalidInput)).toBe(false)
        })

        it('fails when $global is not a boolean', () => {
          const invalidInput = {
            $ref: '#/components/schemas/User',
            $global: 'true',
          }

          expect(Value.Check(ReferenceObjectSchema, invalidInput)).toBe(false)
        })
      })
    })
  })

  describe('ReferenceObjectExtensionsSchema', () => {
    describe('value checking', () => {
      it('parses valid extensions correctly', () => {
        const validInput = {
          $status: 'loading',
          $global: false,
        }

        const result = coerceValue(ReferenceObjectExtensionsSchema, validInput)

        expect(result).toEqual({
          $status: 'loading',
          $global: false,
        })
      })

      it('parses extensions with optional fields omitted correctly', () => {
        const validInput = {}

        const result = coerceValue(ReferenceObjectExtensionsSchema, validInput)

        expect(result).toEqual({})
      })

      it('parses extensions with only $status correctly', () => {
        const validInput = {
          $status: 'error',
        }

        const result = coerceValue(ReferenceObjectExtensionsSchema, validInput)

        expect(result).toEqual({
          $status: 'error',
        })
      })

      it('parses extensions with only $global correctly', () => {
        const validInput = {
          $global: true,
        }

        const result = coerceValue(ReferenceObjectExtensionsSchema, validInput)

        expect(result).toEqual({
          $global: true,
        })
      })

      describe('invalid inputs', () => {
        it('fails when $status has invalid value', () => {
          const invalidInput = {
            $status: 'processing',
          }

          expect(Value.Check(ReferenceObjectExtensionsSchema, invalidInput)).toBe(false)
        })

        it('fails when $global is not a boolean', () => {
          const invalidInput = {
            $global: 'yes',
          }

          expect(Value.Check(ReferenceObjectExtensionsSchema, invalidInput)).toBe(false)
        })
      })
    })
  })

  describe('reference function', () => {
    it('fails validation when $ref is missing from reference schema', () => {
      // @ts-expect-error - $ref is missing
      const Schema = reference({
        type: 'string',
      })

      const invalidInput = {
        $ref_value: 'test',
      }

      expect(Value.Check(Schema, invalidInput)).toBe(false)
    })
  })

  describe('ReferenceType', () => {
    it('allows direct value', () => {
      const directValue: ReferenceType<string> = 'hello'
      expect(directValue).toBe('hello')
    })

    it('allows reference object with value', () => {
      const referenceValue: ReferenceType<{ id: number }> = {
        $ref: '#/components/schemas/Item',
        summary: 'An item reference',
        '$ref-value': { id: 123 },
      }
      expect(referenceValue.$ref).toBe('#/components/schemas/Item')
      expect(referenceValue['$ref-value'].id).toBe(123)
    })

    it('allows reference object with extensions', () => {
      const referenceValue: ReferenceType<number[]> = {
        $ref: '#/components/schemas/Numbers',
        $status: 'error',
        $global: false,
        '$ref-value': [1, 2, 3],
      }
      expect(referenceValue.$status).toBe('error')
      expect(referenceValue.$global).toBe(false)
      expect(referenceValue['$ref-value']).toEqual([1, 2, 3])
    })
  })
})
