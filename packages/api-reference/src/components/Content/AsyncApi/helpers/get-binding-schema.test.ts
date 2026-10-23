import { describe, expect, it } from 'vitest'

import { getBindingEntries } from './get-binding-entries'
import { type BindingScope, getBindingSchema } from './get-binding-schema'

describe('get-binding-schema', () => {
  it.each<[string, BindingScope, string]>([
    ['mqtt', 'server', 'sessionExpiryInterval'],
    ['mqtt', 'server', 'maximumPacketSize'],
    ['mqtt', 'operation', 'messageExpiryInterval'],
    ['mqtt', 'message', 'correlationData'],
    ['mqtt', 'message', 'responseTopic'],
    ['kafka', 'operation', 'groupId'],
    ['kafka', 'operation', 'clientId'],
    ['kafka', 'message', 'key'],
    ['ws', 'channel', 'query'],
    ['ws', 'channel', 'headers'],
    ['http', 'operation', 'query'],
    ['http', 'message', 'headers'],
  ])('recognizes %s %s %s schemas', (protocol, scope, field) => {
    expect(getBindingSchema(protocol, scope, field, { type: 'string' })).toMatchObject({ type: 'string' })
  })

  it.each<[string, BindingScope | undefined, string, Record<string, unknown>]>([
    ['ws', 'operation', 'headers', { type: 'object', properties: { 'X-RateLimit-Limit': { type: 'integer' } } }],
    ['ws', 'message', 'message', { type: 'object', properties: { eventId: { type: 'string' } } }],
    ['custom', 'channel', 'query', { properties: { token: { type: 'string' } } }],
    ['custom', undefined, 'payload', { type: ['string', 'null'] }],
    ['custom', 'message', 'value', { type: 'string', enum: ['created', 'deleted'] }],
    ['custom', 'operation', 'batch', { items: { type: 'string' } }],
    ['custom', 'message', 'choice', { oneOf: [{ type: 'string' }, { type: 'integer' }] }],
    ['custom', 'message', 'choice', { anyOf: [{ type: 'string' }] }],
    ['custom', 'message', 'combined', { allOf: [{ properties: { id: { type: 'string' } } }] }],
  ])('detects schema shapes in %s %s %s', (protocol, scope, field, schema) => {
    expect(getBindingSchema(protocol, scope, field, schema)).toStrictEqual(schema)
  })

  it.each([
    60,
    false,
    null,
    {},
    { topic: 'offline', message: 'disconnected' },
    { type: 'record', fields: [] },
    { type: ['record'] },
    { type: [] },
    { properties: { retries: 3 } },
    { items: ['orders', 'events'] },
    { oneOf: [] },
    { oneOf: ['orders', 'events'] },
    { $ref: '#/missing' },
    { schemaFormat: 'application/vnd.apache.avro+json', schema: { type: 'record', fields: [] } },
  ])('keeps ordinary settings and unsupported schemas as source: %j', (value) => {
    expect(getBindingSchema('custom', 'message', 'settings', value)).toBeUndefined()
  })

  it('preserves opaque extensions even when they contain schema keywords', () => {
    expect(getBindingSchema('ws', 'operation', 'x-data', { type: 'object', properties: {} })).toBeUndefined()
  })

  it('renders explicit JSON Schema wrappers', () => {
    expect(
      getBindingSchema('custom', 'message', 'body', {
        schemaFormat: 'application/schema+json;version=draft-07',
        schema: { type: 'string' },
      }),
    ).toStrictEqual({ type: 'string' })
  })

  it('keeps documented schema positions authoritative for schemas without structural keywords', () => {
    expect(getBindingSchema('ws', 'channel', 'query', {})).toStrictEqual({})
    expect(getBindingSchema('kafka', 'message', 'key', { enum: ['created'] })).toStrictEqual({ enum: ['created'] })
    expect(getBindingSchema('kafka', 'message', 'key', true)).toStrictEqual({ description: 'Accepts any value.' })
    expect(getBindingSchema('kafka', 'message', 'key', { type: 'record', fields: [] })).toBeUndefined()
  })

  it('renders resolved schema references without exposing store metadata', () => {
    const entries = getBindingEntries(
      {
        kafka: {
          groupId: {
            $ref: '#/components/schemas/Group',
            '$ref-value': { type: 'string', enum: ['billing'] },
          },
        },
      },
      'operation',
    )
    expect(entries[0]?.fields[0]?.schema).toMatchObject({ type: 'string', enum: ['billing'] })
    expect(entries[0]?.fields[0]?.content).not.toContain('$ref-value')
  })
})
