import { coerce, validate } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { asyncApiChannelBindingsObject } from './bindings'
import { asyncApiWsBindingObject } from './ws-binding'

describe('asyncApiWsBindingObject', () => {
  it('accepts Galaxy-style channel ws binding with method and query', () => {
    const binding = {
      method: 'GET',
      query: {
        type: 'object',
        properties: {
          includeHistory: { type: 'boolean', default: false },
        },
      },
    }

    expect(validate(asyncApiWsBindingObject, binding)).toBe(true)
    expect(coerce(asyncApiWsBindingObject, binding)).toEqual(binding)
  })

  it('accepts operation ws binding with bindingVersion and method', () => {
    const binding = {
      bindingVersion: '0.1.0',
      method: 'GET',
    }

    expect(validate(asyncApiWsBindingObject, binding)).toBe(true)
    expect(coerce(asyncApiWsBindingObject, binding)).toEqual(binding)
  })

  it('accepts headers schema for handshake', () => {
    const binding = {
      bindingVersion: '0.1.0',
      headers: {
        type: 'object',
        properties: {
          'X-RateLimit-Limit': { type: 'integer' },
        },
      },
    }

    expect(validate(asyncApiWsBindingObject, binding)).toBe(true)
    expect(coerce(asyncApiWsBindingObject, binding)).toEqual(binding)
  })

  it('rejects invalid handshake method', () => {
    expect(
      validate(asyncApiWsBindingObject, {
        method: 'PUT',
      }),
    ).toBe(false)
  })

  it('accepts a reference object for headers', () => {
    const binding = {
      headers: { $ref: '#/components/schemas/RateLimitHeaders' },
    }

    expect(validate(asyncApiWsBindingObject, binding)).toBe(true)
  })
})

describe('asyncApiChannelBindingsObject', () => {
  it('types ws while leaving other protocol bindings open', () => {
    const bindings = {
      ws: {
        method: 'GET',
        query: { type: 'object', properties: {} },
      },
      kafka: { topic: 'events' },
    }

    expect(validate(asyncApiChannelBindingsObject, bindings)).toBe(true)
  })
})
