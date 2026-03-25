import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
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

    it('returns empty array when schema has no compositions', () => {
      const schema = {
        type: 'string',
      } as SchemaObject

      expect(getCompositionsToRender(schema)).toEqual([])
    })
  })
})
