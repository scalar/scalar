import { createMagicProxy } from '@scalar/json-magic/magic-proxy'
import { describe, expect, it } from 'vitest'

import { resolve } from './resolve'

describe('resolve.schema', () => {
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
