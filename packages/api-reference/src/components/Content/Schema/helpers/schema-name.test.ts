import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { getModelName, getModelNameFromSchema } from './schema-name'

describe('schema-name', () => {
  describe('getModelNameFromSchema', () => {
    it('returns title when present', () => {
      const schema: SchemaObject = { title: 'Galaxy Planet', type: 'object' }
      expect(getModelNameFromSchema(schema)).toBe('Galaxy Planet')
    })

    it('returns name when present', () => {
      const schema = { name: 'Galaxy Planet', type: 'object' } as any
      expect(getModelNameFromSchema(schema)).toBe('Galaxy Planet')
    })

    it('prefers title over name', () => {
      const schema = { title: 'Galaxy Planet', name: 'Other Name', type: 'object' } as any
      expect(getModelNameFromSchema(schema)).toBe('Galaxy Planet')
    })

    it('returns null for empty object', () => {
      const schema: SchemaObject = { _: '' }
      expect(getModelNameFromSchema(schema)).toBe(null)
    })
  })

  describe('getModelName', () => {
    it('returns null when value has no type', () => {
      const value = { properties: { name: { type: 'string' } } }
      // @ts-ignore
      expect(getModelName(value)).toBe(null)
    })

    it('returns nothing when hideModelNames is true', () => {
      const value: SchemaObject = {
        type: 'array',
        items: { type: 'string' },
      }
      expect(getModelName(value, true)).toBe(null)
    })

    it('returns null when hideModelNames is true and not array', () => {
      const value: SchemaObject = { type: 'object' }
      expect(getModelName(value, true)).toBe(null)
    })

    it('returns model name with title', () => {
      const value: SchemaObject = {
        type: 'object',
        title: 'Planet',
      }
      expect(getModelName(value)).toBe('Planet')
    })

    it('returns array model name with title', () => {
      const value: SchemaObject = {
        type: 'array',
        title: 'PlanetArray',
      }
      expect(getModelName(value)).toBe('array PlanetArray[]')
    })

    it('handles array with item title', () => {
      const value: SchemaObject = {
        type: 'array',
        items: {
          type: 'object',
          title: 'Planet',
        },
      }
      expect(getModelName(value)).toBe('array Planet[]')
    })

    it('handles array with item name', () => {
      const value: SchemaObject = {
        type: 'array',
        items: {
          type: 'object',
          name: 'Planet',
        },
      }
      expect(getModelName(value)).toBe('array Planet[]')
    })

    it('handles array with basic item type', () => {
      const value: SchemaObject = {
        type: 'array',
        items: { type: 'string' },
      }
      expect(getModelName(value)).toBe('array string[]')
    })

    it('handles array with object items fallback', () => {
      const value: SchemaObject = {
        type: 'array',
        items: { _: 'empty' },
      }

      expect(getModelName(value)).toBe('array object[]')
    })
  })
})
