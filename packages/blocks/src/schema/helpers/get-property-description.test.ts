import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { getPropertyDescriptionKey } from './get-property-description'

describe('get-property-description', () => {
  describe('getPropertyDescriptionKey', () => {
    it('returns null for undefined value', () => {
      expect(getPropertyDescriptionKey(undefined)).toBeNull()
    })

    it('returns the description key for integer type with default format', () => {
      const schema = {
        type: 'integer',
      } as SchemaObject

      expect(getPropertyDescriptionKey(schema)).toBe('schema.typeInteger')
    })

    it('returns the description key for integer type with int32 format', () => {
      const schema = {
        type: 'integer',
        format: 'int32',
      } as SchemaObject

      expect(getPropertyDescriptionKey(schema)).toBe('schema.formatInt32')
    })

    it('returns the description key for string type with date format', () => {
      const schema = {
        type: 'string',
        format: 'date',
      } as SchemaObject

      expect(getPropertyDescriptionKey(schema)).toBe('schema.formatDate')
    })

    it('returns the description key for string type with contentEncoding instead of format', () => {
      const schema = {
        type: 'string',
        contentEncoding: 'base64',
      } as SchemaObject

      expect(getPropertyDescriptionKey(schema)).toBe('schema.formatBase64')
    })
  })
})
