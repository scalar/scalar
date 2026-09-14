import type { AsyncApiMessageObject } from '@scalar/types/asyncapi/3.1'
import { describe, expect, it } from 'vitest'

import { resolveMessageTraits } from './resolve-message-traits'

const asMessage = (value: unknown): AsyncApiMessageObject => value as AsyncApiMessageObject

describe('resolve-message-traits', () => {
  it('preserves messages without traits', () => {
    const message = asMessage({ payload: { type: 'string' } })
    expect(resolveMessageTraits(message)).toBe(message)
  })

  it('inherits referenced trait headers and metadata', () => {
    const trait = {
      headers: { type: 'object', properties: { correlationId: { type: 'string' } } },
      title: 'Shared title',
      description: 'Shared description',
      examples: [{ payload: 'example' }],
      bindings: { kafka: { bindingVersion: '0.5.0' } },
    }
    const message = asMessage({ traits: [{ $ref: '#/components/messageTraits/common', '$ref-value': trait }] })
    expect(resolveMessageTraits(message)).toStrictEqual({ ...message, ...trait })
  })

  it('merges nested headers from multiple traits with message fields taking precedence', () => {
    const message = asMessage({
      traits: [
        { headers: { properties: { correlationId: { type: 'string' }, shared: { type: 'string' } } }, title: 'First' },
        {
          headers: { properties: { tenantId: { type: 'string' }, shared: { description: 'Inherited' } } },
          title: 'Last',
        },
      ],
      headers: { properties: { shared: { type: 'integer' }, local: { type: 'boolean' } } },
      title: 'Message',
    })
    const original = structuredClone(message)
    expect(resolveMessageTraits(message)).toStrictEqual({
      ...message,
      headers: {
        properties: {
          correlationId: { type: 'string' },
          tenantId: { type: 'string' },
          shared: { type: 'integer', description: 'Inherited' },
          local: { type: 'boolean' },
        },
      },
    })
    expect(message).toStrictEqual(original)
  })

  it('applies traits in order and replaces arrays instead of concatenating them', () => {
    const message = asMessage({
      traits: [
        { title: 'First', tags: [{ name: 'first' }], headers: { required: ['first'] } },
        { title: 'Last', tags: [{ name: 'last' }], headers: { required: ['last'] } },
      ],
      headers: { required: [] },
    })
    expect(resolveMessageTraits(message)).toStrictEqual({ ...message, title: 'Last', tags: [{ name: 'last' }] })
  })

  it('removes null keys using JSON Merge Patch semantics', () => {
    const message = asMessage({
      traits: [
        {
          headers: { properties: { removedByTrait: { type: 'string' }, removedByMessage: { type: 'string' } } },
          'x-note': 'first',
        },
        { headers: { properties: { removedByTrait: null } } },
      ],
      headers: { properties: { removedByMessage: null } },
      'x-note': null,
    })
    expect(resolveMessageTraits(message)).toStrictEqual({ traits: message.traits, headers: { properties: {} } })
  })

  it('merges referenced header schemas without leaving a stale reference wrapper', () => {
    const message = asMessage({
      traits: [
        {
          headers: {
            $ref: '#/components/schemas/Headers',
            '$ref-value': { properties: { inherited: { type: 'string' } } },
          },
        },
      ],
      headers: { $ref: '#/components/schemas/Local', '$ref-value': { properties: { local: { type: 'string' } } } },
    })
    expect(resolveMessageTraits(message)).toStrictEqual({
      ...message,
      headers: { properties: { inherited: { type: 'string' }, local: { type: 'string' } } },
    })
  })

  it('ignores unresolved traits', () => {
    const message = asMessage({ title: 'Message', traits: [{ $ref: '#/missing' }] })
    expect(resolveMessageTraits(message)).toStrictEqual(message)
  })

  it('preserves unrelated recursive payloads', () => {
    const payload: Record<string, unknown> = { type: 'object' }
    payload.properties = { child: payload }
    const message = asMessage({ payload, traits: [{ title: 'Inherited' }] })
    expect(resolveMessageTraits(message).payload).toBe(payload)
  })

  it('handles recursive trait schemas', () => {
    const headers: Record<string, unknown> = { type: 'object' }
    headers.properties = { child: headers }
    const result = resolveMessageTraits(asMessage({ traits: [{ headers }] }))
    expect(result.headers).toStrictEqual(headers)
    expect(result.headers).not.toBe(headers)
  })

  it('preserves schema properties named __proto__ without changing object prototypes', () => {
    const headers = JSON.parse('{"properties":{"__proto__":{"type":"string"}}}')
    const result = resolveMessageTraits(asMessage({ traits: [{ headers }] }))
    expect(result.headers).toStrictEqual(headers)
    expect(Object.getPrototypeOf(result.headers)).toBe(Object.prototype)
  })
})
