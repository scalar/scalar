import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { resolveSchemaNode } from './resolve-schema-node'

describe('resolveSchemaNode', () => {
  it('returns a plain schema unchanged', () => {
    const schema = { type: 'object', properties: { name: { type: 'string' } } } as SchemaObject

    expect(resolveSchemaNode(schema)).toBe(schema)
  })

  it('returns the same object for the same reference', () => {
    const reference = {
      $ref: '#/components/schemas/Person',
      '$ref-value': { type: 'object', properties: { name: { type: 'string' } } },
    } as unknown as SchemaObject

    expect(resolveSchemaNode(reference)).toBe(resolveSchemaNode(reference))
  })

  it('merges the reference siblings onto the target', () => {
    const reference = {
      $ref: '#/components/schemas/Person',
      description: 'The person making the request',
      '$ref-value': { type: 'object', description: 'A person' },
    } as unknown as SchemaObject

    expect(resolveSchemaNode(reference)).toMatchObject({
      type: 'object',
      description: 'The person making the request',
    })
  })

  it('reflects an edit to the target between two calls', () => {
    const target: Record<string, unknown> = { type: 'object', description: 'Before' }
    const reference = { $ref: '#/components/schemas/Person', '$ref-value': target } as unknown as SchemaObject

    expect(resolveSchemaNode(reference)?.description).toBe('Before')

    // The API client edits documents in place, so a resolved node cached on the
    // reference must not survive the edit.
    target.description = 'After'

    expect(resolveSchemaNode(reference)?.description).toBe('After')
  })

  it('reflects an edit to the reference siblings between two calls', () => {
    const reference: Record<string, unknown> = {
      $ref: '#/components/schemas/Person',
      '$ref-value': { type: 'object' },
    }

    expect(resolveSchemaNode(reference as unknown as SchemaObject)?.title).toBeUndefined()

    reference.title = 'Person'

    expect(resolveSchemaNode(reference as unknown as SchemaObject)?.title).toBe('Person')
  })

  it('reflects the target being replaced between two calls', () => {
    const reference: Record<string, unknown> = {
      $ref: '#/components/schemas/Person',
      '$ref-value': { type: 'object', description: 'Before' },
    }

    expect(resolveSchemaNode(reference as unknown as SchemaObject)?.description).toBe('Before')

    reference['$ref-value'] = { type: 'object', description: 'After' }

    expect(resolveSchemaNode(reference as unknown as SchemaObject)?.description).toBe('After')
  })
})
