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

  it('leaves constants, unknown fields, wrong scopes, and unavailable references as source', () => {
    expect(getBindingSchema('mqtt', 'server', 'sessionExpiryInterval', 60)).toBeUndefined()
    expect(getBindingSchema('mqtt', 'server', 'clientId', { type: 'string' })).toBeUndefined()
    expect(getBindingSchema('ws', 'message', 'headers', { type: 'object' })).toBeUndefined()
    expect(getBindingSchema('custom', 'channel', 'query', { type: 'object' })).toBeUndefined()
    expect(getBindingSchema('ws', undefined, 'query', { type: 'object' })).toBeUndefined()
    expect(getBindingSchema('ws', 'channel', 'query', { $ref: '#/missing' })).toBeUndefined()
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
