import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { getPropertyDescription } from './get-property-description'

describe('get-property-description', () => {
  describe('getPropertyDescription', () => {
    it('returns null for undefined value', () => {
      expect(getPropertyDescription(undefined)).toBeNull()
    })

    it('returns description for integer type with default format', () => {
      const schema = {
        type: 'integer',
      } as SchemaObject

      expect(getPropertyDescription(schema)).toBe('Integer numbers.')
    })

    it('returns description for integer type with int32 format', () => {
      const schema = {
        type: 'integer',
        format: 'int32',
      } as SchemaObject

      expect(getPropertyDescription(schema)).toBe('Signed 32-bit integers (commonly used integer type).')
    })

    it('returns description for string type with date format', () => {
      const schema = {
        type: 'string',
        format: 'date',
      } as SchemaObject

      expect(getPropertyDescription(schema)).toBe(
        'full-date notation as defined by RFC 3339, section 5.6, for example, 2017-07-21',
      )
    })

    it('returns description for string type with contentEncoding instead of format', () => {
      const schema = {
        type: 'string',
        contentEncoding: 'base64',
      } as SchemaObject

      expect(getPropertyDescription(schema)).toBe('base64-encoded characters, for example, U3dhZ2dlciByb2Nrcw==')
    })
  })
})
