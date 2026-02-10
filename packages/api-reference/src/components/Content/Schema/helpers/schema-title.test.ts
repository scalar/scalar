import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { getModelTitle, getModelTitleFromSchema } from './schema-title'

describe('schema-title', () => {
  describe('getModelTitleFromSchema', () => {
    it('returns title when present', () => {
      const schema: SchemaObject = { title: 'Galaxy Planet', type: 'object' }
      expect(getModelTitleFromSchema(schema)).toBe('Galaxy Planet')
    })

    it('returns null when only name is present (name is not in JSON Schema spec)', () => {
      const schema = { name: 'Galaxy Planet', type: 'object' } as any
      expect(getModelTitleFromSchema(schema)).toBe(null)
    })

    it('returns title when both title and name present', () => {
      const schema = { title: 'Galaxy Planet', name: 'Other Name', type: 'object' } as any
      expect(getModelTitleFromSchema(schema)).toBe('Galaxy Planet')
    })

    it('returns null for empty object', () => {
      const schema: SchemaObject = { __scalar_: '' }
      expect(getModelTitleFromSchema(schema)).toBe(null)
    })

    it('prefers resolved schema title over ref name when both present', () => {
      const schema = {
        type: 'string',
        title: 'HelloWorldTitle',
        $ref: '#/components/schemas/HelloWorld',
      } as SchemaObject & { $ref: string }
      expect(getModelTitleFromSchema(schema)).toBe('HelloWorldTitle')
    })
  })

  describe('getModelTitle', () => {
    it('returns null when value has no type', () => {
      const value = { properties: { name: { type: 'string' } } }
      // @ts-expect-error
      expect(getModelTitle(value)).toBe(null)
    })

    it('returns nothing when hideModelTitles is true', () => {
      const value: SchemaObject = {
        type: 'array',
        items: { type: 'string' },
      }
      expect(getModelTitle(value, true)).toBe(null)
    })

    it('returns null when hideModelTitles is true and not array', () => {
      const value: SchemaObject = { type: 'object' }
      expect(getModelTitle(value, true)).toBe(null)
    })

    it('returns model title with title', () => {
      const value: SchemaObject = {
        type: 'object',
        title: 'Planet',
      }
      expect(getModelTitle(value)).toBe('Planet')
    })

    it('returns array model title with title', () => {
      const value: SchemaObject = {
        type: 'array',
        title: 'PlanetArray',
      }
      expect(getModelTitle(value)).toBe('array PlanetArray[]')
    })

    it('handles array with item title', () => {
      const value: SchemaObject = {
        type: 'array',
        items: {
          type: 'object',
          title: 'Planet',
        },
      }
      expect(getModelTitle(value)).toBe('array Planet[]')
    })

    it('handles array with item without title or ref (falls back to type)', () => {
      const value: SchemaObject = {
        type: 'array',
        items: {
          type: 'object',
        },
      }
      expect(getModelTitle(value)).toBe('array object[]')
    })

    it('handles array with basic item type', () => {
      const value: SchemaObject = {
        type: 'array',
        items: { type: 'string' },
      }
      expect(getModelTitle(value)).toBe('array string[]')
    })

    it('handles array with object items fallback', () => {
      const value: SchemaObject = {
        type: 'array',
        items: { __scalar_: 'empty' },
      }

      expect(getModelTitle(value)).toBe('array object[]')
    })
  })
})
