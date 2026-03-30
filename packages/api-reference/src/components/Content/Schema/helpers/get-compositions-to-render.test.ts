import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { SchemaObjectSchema, type SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { getCompositionsToRender } from './get-compositions-to-render'

describe('get-compositions-to-render', () => {
  describe('getCompositionsToRender', () => {
    it('returns empty array for undefined value', () => {
      expect(getCompositionsToRender(undefined)).toEqual([])
    })

    it('returns property-level composition when schema has oneOf', () => {
      const schema = {
        oneOf: [{ type: 'string' }, { type: 'number' }],
      } as SchemaObject

      const result = getCompositionsToRender(schema)
      expect(result).toHaveLength(1)
      expect(result?.[0]?.composition).toBe('oneOf')
      expect(result?.[0]?.value).toBe(schema)
    })

    it('returns empty array when array items have composition (compositions are considered complex)', () => {
      const schema = {
        type: 'array',
        items: {
          oneOf: [{ type: 'string' }, { type: 'boolean' }],
        },
      } as SchemaObject

      // Compositions in array items are considered complex, so they won't be rendered
      // via shouldRenderArrayItemComposition
      const result = getCompositionsToRender(schema)
      expect(result).toHaveLength(0)
    })

    it('returns multiple compositions when schema has multiple composition keywords', () => {
      const schema = {
        oneOf: [{ type: 'string' }],
        anyOf: [{ type: 'number' }],
      } as SchemaObject

      const result = getCompositionsToRender(schema)
      expect(result).toHaveLength(2)
      expect(result.map((r) => r.composition)).toEqual(['oneOf', 'anyOf'])
    })

    it('infers oneOf from discriminator mapping when explicit oneOf is missing', () => {
      const schema = {
        type: 'object',
        discriminator: {
          propertyName: 'shapeType',
          mapping: {
            circle: '#/components/schemas/Circle',
            rectangle: '#/components/schemas/Rectangle',
          },
        },
      } as SchemaObject

      const result = getCompositionsToRender(schema)

      expect(result).toHaveLength(1)
      expect(result[0]?.composition).toBe('oneOf')
      expect(result[0]?.value.oneOf?.map((entry) => ('$ref' in entry ? entry.$ref : undefined))).toStrictEqual([
        '#/components/schemas/Circle',
        '#/components/schemas/Rectangle',
      ])
    })

    it('does not infer oneOf when anyOf is already present', () => {
      const schema = coerceValue(SchemaObjectSchema, {
        type: 'object',
        anyOf: [{ $ref: '#/components/schemas/Circle' }, { $ref: '#/components/schemas/Rectangle' }],
        discriminator: {
          propertyName: 'shapeType',
          mapping: {
            circle: '#/components/schemas/Circle',
            rectangle: '#/components/schemas/Rectangle',
          },
        },
      })

      const result = getCompositionsToRender(schema)

      expect(result).toHaveLength(1)
      expect(result[0]?.composition).toBe('anyOf')
    })

    it('does not infer oneOf when allOf is already present', () => {
      const schema = coerceValue(SchemaObjectSchema, {
        type: 'object',
        allOf: [{ $ref: '#/components/schemas/Circle' }, { $ref: '#/components/schemas/Rectangle' }],
        discriminator: {
          propertyName: 'shapeType',
          mapping: {
            circle: '#/components/schemas/Circle',
            rectangle: '#/components/schemas/Rectangle',
          },
        },
      })

      const result = getCompositionsToRender(schema)

      expect(result).toHaveLength(1)
      expect(result[0]?.composition).toBe('allOf')
    })

    it('does not infer oneOf from an empty discriminator mapping', () => {
      const schema = {
        type: 'object',
        discriminator: {
          propertyName: 'shapeType',
          mapping: {},
        },
      } as SchemaObject

      const result = getCompositionsToRender(schema)

      expect(result).toStrictEqual([])
    })

    it('returns empty array when schema has no compositions', () => {
      const schema = {
        type: 'string',
      } as SchemaObject

      expect(getCompositionsToRender(schema)).toEqual([])
    })
  })
})
