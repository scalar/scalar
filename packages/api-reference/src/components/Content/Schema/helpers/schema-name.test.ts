import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { getModelNameFromSchema } from './schema-name'

describe('schema-name', () => {
  describe('getModelNameFromSchema', () => {
    it('returns title when present', () => {
      const schema: SchemaObject = { title: 'Galaxy Planet', type: 'object' }
      expect(getModelNameFromSchema(schema)).toEqual({ schemaKey: null, label: 'Galaxy Planet' })
    })

    it('returns name when present', () => {
      const schema = { name: 'Galaxy Planet', type: 'object' } as any
      expect(getModelNameFromSchema(schema)).toEqual({ schemaKey: null, label: 'Galaxy Planet' })
    })

    it('prefers title over name', () => {
      const schema = { title: 'Galaxy Planet', name: 'Other Name', type: 'object' } as any
      expect(getModelNameFromSchema(schema)).toEqual({ schemaKey: null, label: 'Galaxy Planet' })
    })

    it('prefers title over ref name when both exist', () => {
      const schema = {
        $ref: '#/components/schemas/account-information-request',
        title: 'Consumer',
        type: 'object',
      } as any
      expect(getModelNameFromSchema(schema)).toEqual({
        schemaKey: 'account-information-request',
        label: 'Consumer',
      })
    })

    it('returns null for empty object', () => {
      const schema: SchemaObject = { __scalar_: '' }
      expect(getModelNameFromSchema(schema)).toBe(null)
    })

    it('links a $ref that targets components.schemas', () => {
      const schema = { $ref: '#/components/schemas/Planet' } as any
      expect(getModelNameFromSchema(schema)).toEqual({ schemaKey: 'Planet', label: 'Planet' })
    })

    it('does not link a $ref into a non-schema component bucket', () => {
      const schema = { $ref: '#/components/parameters/Planet' } as any
      expect(getModelNameFromSchema(schema)).toEqual({ schemaKey: null, label: 'Planet' })
    })

    it('does not link a $ref into components.responses', () => {
      const schema = { $ref: '#/components/responses/Planet' } as any
      expect(getModelNameFromSchema(schema)).toEqual({ schemaKey: null, label: 'Planet' })
    })

    it('does not link a $ref into an external file', () => {
      const schema = { $ref: './planets.yaml#/Planet' } as any
      expect(getModelNameFromSchema(schema)).toEqual({ schemaKey: null, label: 'Planet' })
    })

    it('keeps the title but drops the link for a non-schema $ref', () => {
      const schema = { $ref: '#/components/parameters/Planet', title: 'Consumer', type: 'object' } as any
      expect(getModelNameFromSchema(schema)).toEqual({ schemaKey: null, label: 'Consumer' })
    })
  })
})
