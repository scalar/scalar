import { describe, expect, it } from 'vitest'

import { schemaSignature, signaturesMatch } from './schema-signature'

describe('schemaSignature', () => {
  it('matches for an untouched schema', () => {
    const schema = {
      allOf: [{ type: 'object', properties: { name: { type: 'string' } } }, { description: 'A person' }],
    }

    expect(signaturesMatch(schemaSignature(schema), schemaSignature(schema))).toBe(true)
  })

  it('notices an edited value inside an allOf member', () => {
    const schema = {
      allOf: [{ type: 'object', properties: { name: { type: 'string', description: 'Before' } } }],
    }
    const before = schemaSignature(schema)

    schema.allOf[0]!.properties!.name.description = 'After'

    expect(signaturesMatch(before, schemaSignature(schema))).toBe(false)
  })

  it('notices an added property', () => {
    const schema: Record<string, any> = { allOf: [{ type: 'object', properties: { name: { type: 'string' } } }] }
    const before = schemaSignature(schema)

    schema.allOf[0].properties.age = { type: 'number' }

    expect(signaturesMatch(before, schemaSignature(schema))).toBe(false)
  })

  it('notices a removed allOf member', () => {
    const schema = { allOf: [{ type: 'object' }, { description: 'A person' }] }
    const before = schemaSignature(schema)

    schema.allOf.pop()

    expect(signaturesMatch(before, schemaSignature(schema))).toBe(false)
  })

  it('notices a child object swapped for an equal one', () => {
    const schema: Record<string, any> = { allOf: [{ type: 'object' }], externalDocs: { url: 'https://example.com' } }
    const before = schemaSignature(schema)

    schema.externalDocs = { url: 'https://example.com' }

    expect(signaturesMatch(before, schemaSignature(schema))).toBe(false)
  })

  it('reads through a resolved $ref', () => {
    const target: Record<string, any> = { type: 'object', properties: { name: { type: 'string' } } }
    const schema = { allOf: [{ $ref: '#/components/schemas/Person', '$ref-value': target }] }
    const before = schemaSignature(schema)

    target.properties.name = { type: 'integer' }

    expect(signaturesMatch(before, schemaSignature(schema))).toBe(false)
  })

  it('terminates on a self-referential schema', () => {
    const inner: Record<string, any> = { type: 'object', properties: {} }
    inner.properties.self = inner
    const schema = { allOf: [inner] }

    expect(() => schemaSignature(schema)).not.toThrow()
    expect(signaturesMatch(schemaSignature(schema), schemaSignature(schema))).toBe(true)
  })
})
