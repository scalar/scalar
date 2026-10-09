import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { normalizeObjectComposition } from './normalize-object-composition'

describe('normalize-object-composition', () => {
  it('keeps property annotations instead of annotations from referenced members', () => {
    const schema = coerceValue(SchemaObjectSchema, {
      title: 'Payload',
      description: 'User payload',
      deprecated: false,
      readOnly: false,
      writeOnly: true,
      example: { id: 'property' },
      allOf: [
        {
          $ref: '#/components/schemas/User',
          '$ref-value': {
            type: 'object',
            title: 'User',
            description: 'A user component',
            deprecated: true,
            readOnly: true,
            writeOnly: false,
            example: { id: 'member' },
            properties: { id: { type: 'string' } },
          },
        },
        { type: 'object', properties: { tag: { type: 'string' } } },
      ],
    })
    const result = normalizeObjectComposition(schema, 'data')
    expect(result?.title).toBe('Payload')
    expect(result?.description).toBe('User payload')
    expect(result?.deprecated).toBe(false)
    expect(result?.readOnly).toBe(false)
    expect(result?.writeOnly).toBe(true)
    expect(result?.example).toEqual({ id: 'property' })
    expect(Object.keys(result && 'properties' in result ? (result.properties ?? {}) : {})).toEqual(['id', 'tag'])
  })

  it('does not label an unannotated property with a member model name', () => {
    const schema = coerceValue(SchemaObjectSchema, {
      allOf: [
        { type: 'object', title: 'Member', description: 'Member description', properties: { id: { type: 'string' } } },
      ],
    })
    const result = normalizeObjectComposition(schema, 'data')
    expect(result?.title).toBeUndefined()
    expect(result?.description).toBeUndefined()
  })
})
