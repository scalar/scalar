import { createMagicProxy } from '@scalar/json-magic/magic-proxy'
import { describe, expect, it } from 'vitest'

import { resolve } from './resolve'
import type { SchemaObject } from './schemas/v3.2/strict/openapi-document'

describe('resolve.schema', () => {
  it('preserves boolean properties while resolving their enclosing object', () => {
    const schema = { type: 'object', properties: { anything: true, forbidden: false } }
    const resolved = resolve.schema(schema as unknown as SchemaObject)
    expect(resolved).toStrictEqual(schema)
    if (!resolved || !('properties' in resolved)) {
      throw new Error('Expected an object schema')
    }
    expect(resolve.schema(resolved.properties?.anything)).toStrictEqual({ description: 'Accepts any value.' })
    expect(resolve.schema(resolved.properties?.forbidden)).toStrictEqual({ not: {}, description: 'Accepts no value.' })
  })

  it.each([true, false])('explains boolean schemas and reference targets without modifying them: %j', (value) => {
    const expected = value ? { description: 'Accepts any value.' } : { not: {}, description: 'Accepts no value.' }
    expect(resolve.schema(value)).toStrictEqual(expected)
    const document = { components: { schemas: { Model: value } }, body: { $ref: '#/components/schemas/Model' } }
    expect(resolve.schema(createMagicProxy(document).body)).toStrictEqual(expected)
    expect(document.components.schemas.Model).toBe(value)
  })

  it('returns undefined for an undefined schema', () => {
    expect(resolve.schema(undefined)).toBeUndefined()
  })

  it('returns a plain schema unchanged in content', () => {
    const schema = { type: 'object', properties: { id: { type: 'integer' } } } as const

    expect(resolve.schema(schema)).toEqual({ type: 'object', properties: { id: { type: 'integer' } } })
  })

  it('resolves a reference to its target', () => {
    const document = {
      components: { schemas: { User: { type: 'object', properties: { id: { type: 'integer' } } } } },
      body: { $ref: '#/components/schemas/User' },
    }
    const proxy = createMagicProxy(document)

    expect(resolve.schema(proxy.body)).toEqual({
      $ref: '#/components/schemas/User',
      type: 'object',
      properties: { id: { type: 'integer' } },
    })
  })

  it('keeps siblings declared alongside the reference', () => {
    const document = {
      components: { schemas: { User: { type: 'object', title: 'User' } } },
      body: { $ref: '#/components/schemas/User', description: 'The caller' },
    }
    const proxy = createMagicProxy(document)

    const resolved = resolve.schema(proxy.body)
    expect(resolved?.title).toBe('User')
    expect(resolved?.description).toBe('The caller')
  })

  it('reflects an edit made between two calls', () => {
    const document = {
      components: { schemas: { User: { type: 'object', title: 'before' } } },
      body: { $ref: '#/components/schemas/User' },
    }
    const proxy = createMagicProxy(document)

    expect(resolve.schema(proxy.body)?.title).toBe('before')

    document.components.schemas.User.title = 'after'

    expect(resolve.schema(proxy.body)?.title).toBe('after')
  })

  it('produces the same result across repeated calls on the same node', () => {
    const schema = { type: 'object', properties: { id: { type: 'integer' } } } as const

    expect(resolve.schema(schema)).toEqual(resolve.schema(schema))
  })
})
