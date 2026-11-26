import { describe, expect, it } from 'vitest'

import { cloneDocument } from './clone-document'

describe('clone-document', () => {
  it('copies nested objects and arrays', () => {
    const document = { openapi: '3.1.0', paths: { '/pets': { get: { tags: ['pets'] } } } }

    const result = cloneDocument(document)

    expect(result).toStrictEqual(document)
    expect(result).not.toBe(document)
    expect(result.paths['/pets']).not.toBe(document.paths['/pets'])
    expect(result.paths['/pets'].get.tags).not.toBe(document.paths['/pets'].get.tags)
  })

  it('keeps shared and circular references', () => {
    const schema: Record<string, unknown> = { type: 'object' }
    schema.properties = { self: schema }
    const document = { components: { schemas: { Pet: schema, Alias: schema } } }

    const result = cloneDocument(document)
    const copied = result.components.schemas.Pet

    expect(copied).not.toBe(schema)
    expect(result.components.schemas.Alias).toBe(copied)
    expect((copied.properties as Record<string, unknown>).self).toBe(copied)
  })

  it('copies a document wrapped in a proxy', () => {
    const document = new Proxy({ openapi: '3.1.0', info: { title: 'Pets' } }, {})

    const result = cloneDocument(document)

    expect(result).toStrictEqual({ openapi: '3.1.0', info: { title: 'Pets' } })
    expect(() => structuredClone(result)).not.toThrow()
  })

  it('shares values that are not plain objects or arrays', () => {
    const handler = (): string => 'handled'
    const date = new Date(0)
    const document = { handler, date }

    const result = cloneDocument(document)

    expect(result.handler).toBe(handler)
    expect(result.date).toBe(date)
  })

  it('keeps a __proto__ key as an ordinary key', () => {
    const document = JSON.parse('{"__proto__": {"polluted": true}, "openapi": "3.1.0"}') as Record<string, unknown>

    const result = cloneDocument(document)

    expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
    expect(Object.keys(result)).toStrictEqual(['__proto__', 'openapi'])
    expect((result as { polluted?: boolean }).polluted).toBeUndefined()
  })

  it('keeps sparse arrays sparse', () => {
    // biome-ignore lint/suspicious/noSparseArray: the hole is what is being tested
    const document = { items: [1, , 3] }

    const result = cloneDocument(document)

    expect(result.items).toHaveLength(3)
    expect(1 in result.items).toBe(false)
  })
})
