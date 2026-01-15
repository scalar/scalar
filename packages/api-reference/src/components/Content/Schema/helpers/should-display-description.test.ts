import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { shouldDisplayDescription } from './should-display-description'

describe('should-display-description', () => {
  describe('shouldDisplayDescription', () => {
    it('returns null for undefined value', () => {
      expect(shouldDisplayDescription(undefined)).toBeNull()
    })

    it('returns prop description when provided and schema has no properties', () => {
      const schema = {
        type: 'string',
      } as SchemaObject

      expect(shouldDisplayDescription(schema, 'Custom description')).toBe('Custom description')
    })

    it('returns schema description when no prop description provided', () => {
      const schema = {
        type: 'string',
        description: 'Schema description',
      } as SchemaObject

      expect(shouldDisplayDescription(schema)).toBe('Schema description')
    })

    it('returns null when schema has properties', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        description: 'Should not show',
      } as SchemaObject

      expect(shouldDisplayDescription(schema, 'Also should not show')).toBeNull()
    })

    it('returns null when schema has allOf composition', () => {
      const schema = {
        allOf: [{ type: 'string' }],
        description: 'Should not show',
      } as SchemaObject

      expect(shouldDisplayDescription(schema)).toBeNull()
    })
  })
})
