import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { getModelNameFromSchema } from './schema-name'

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
      const schema: SchemaObject = { __scalar_: '' }
      expect(getModelNameFromSchema(schema)).toBe(null)
    })
  })
})
