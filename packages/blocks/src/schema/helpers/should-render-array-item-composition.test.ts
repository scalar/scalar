import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { shouldRenderArrayItemComposition } from './should-render-array-item-composition'

describe('should-render-array-item-composition', () => {
  describe('shouldRenderArrayItemComposition', () => {
    it('returns false for undefined value', () => {
      expect(shouldRenderArrayItemComposition(undefined, 'oneOf')).toBe(false)
    })

    it('returns false for non-array schema', () => {
      const schema = {
        type: 'string',
      } as SchemaObject

      expect(shouldRenderArrayItemComposition(schema, 'oneOf')).toBe(false)
    })

    it('returns false when array items do not have the composition keyword', () => {
      const schema = {
        type: 'array',
        items: {
          type: 'string',
        },
      } as SchemaObject

      expect(shouldRenderArrayItemComposition(schema, 'oneOf')).toBe(false)
    })

    it('returns false when array items have composition (compositions are considered complex)', () => {
      const schema = {
        type: 'array',
        items: {
          oneOf: [{ type: 'string' }, { type: 'number' }],
        },
      } as SchemaObject

      // Compositions in items are always considered complex, so this returns false
      expect(shouldRenderArrayItemComposition(schema, 'oneOf')).toBe(false)
    })

    it('returns false when array items are simple types without composition keyword', () => {
      const schema = {
        type: 'array',
        items: {
          type: 'string',
        },
      } as SchemaObject

      // Returns false because items don't have the composition keyword
      expect(shouldRenderArrayItemComposition(schema, 'oneOf')).toBe(false)
    })
  })
})
