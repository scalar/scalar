import type { AsyncApiMessageObject } from '@scalar/types/asyncapi/3.1'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { unpackProxyObject } from '@scalar/workspace-store/helpers/unpack-proxy'
import { isAsyncApiDocument } from '@scalar/workspace-store/schemas'
import { describe, expect, it } from 'vitest'

import { getGeneratedPayloadExample } from './get-generated-payload-example'
import { getMessageExampleContent } from './get-message-example-content'

/** Keep fixtures permissive enough to exercise unsupported input from user documents. */
const generate = (message: Record<string, unknown>): unknown =>
  getGeneratedPayloadExample(message as AsyncApiMessageObject)

describe('get-generated-payload-example', () => {
  it.each([true, false])('skips direct, referenced, and wrapped boolean payload schemas: %j', (schema) => {
    expect(generate({ payload: schema })).toBeUndefined()
    expect(generate({ payload: { $ref: '#/schema', '$ref-value': schema } })).toBeUndefined()
    expect(generate({ payload: { schemaFormat: 'application/schema+json', schema } })).toBeUndefined()
  })

  it('preserves literal data without invoking inherited setters', () => {
    const value = { scalarPayloadField: 'event' }
    Object.defineProperty(Object.prototype, 'scalarPayloadField', {
      configurable: true,
      set: () => {
        throw new Error('Inherited setter must not be invoked')
      },
    })
    try {
      expect(generate({ payload: { type: 'object', const: value } })).toStrictEqual(value)
    } finally {
      Reflect.deleteProperty(Object.prototype, 'scalarPayloadField')
    }
  })

  it('snapshots a shared reference target once for many properties', async () => {
    const properties = Object.fromEntries(
      Array.from({ length: 100 }, (_, index) => [`field${index}`, { $ref: '#/components/schemas/Shared' }]),
    )
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'events',
      document: {
        asyncapi: '3.0.0',
        info: { title: 'Events', version: '1.0.0' },
        components: { schemas: { Shared: { type: 'string', const: 'event' } } },
        channels: {
          events: { address: 'events', messages: { event: { payload: { type: 'object', properties } } } },
        },
      },
    })
    const document = store.workspace.documents.events
    if (!document || !isAsyncApiDocument(document)) {
      throw new Error('Expected an ingested AsyncAPI document')
    }
    const shared = getResolvedRef(getResolvedRef(document.components)?.schemas?.Shared)
    const reads = { count: 0 }
    Object.defineProperty(unpackProxyObject(shared), 'description', {
      configurable: true,
      enumerable: true,
      get: () => {
        reads.count += 1
        return 'Shared target'
      },
    })

    expect(generate(getResolvedRef(document.channels?.events)?.messages?.event ?? {})).toStrictEqual(
      Object.fromEntries(Array.from({ length: 100 }, (_, index) => [`field${index}`, 'event'])),
    )
    expect(reads.count).toBe(1)
  })

  it('retains virtual targets for referenced schemas while hiding them in literal payload data', async () => {
    const value = { $ref: '#/components/schemas/Name', id: 1 }
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'events',
      document: {
        asyncapi: '3.0.0',
        info: { title: 'Events', version: '1.0.0' },
        components: {
          schemas: {
            Name: { type: 'string', const: 'event-name' },
            Data: { type: 'object', const: value },
            Event: {
              type: 'object',
              properties: {
                name: { $ref: '#/components/schemas/Name' },
                data: { $ref: '#/components/schemas/Data' },
              },
            },
          },
        },
        channels: {
          events: { address: 'events', messages: { event: { payload: { $ref: '#/components/schemas/Event' } } } },
        },
      },
    })
    const document = store.workspace.documents.events
    if (!document || !isAsyncApiDocument(document)) {
      throw new Error('Expected an ingested AsyncAPI document')
    }
    const result = generate(getResolvedRef(document.channels?.events)?.messages?.event ?? {})
    expect(getMessageExampleContent({ payload: result })).toBe(
      JSON.stringify({ name: 'event-name', data: value }, null, 2),
    )
  })

  it.each(['const', 'example', 'default', 'examples', 'enum'])(
    'keeps virtual reference metadata out of ingested %s data',
    async (keyword) => {
      const value = { $ref: '#/components/schemas/Event', id: 1, nested: [{ $ref: '#/components/schemas/Event' }] }
      const store = createWorkspaceStore()
      await store.addDocument({
        name: 'events',
        document: {
          asyncapi: '3.0.0',
          info: { title: 'Events', version: '1.0.0' },
          components: { schemas: { Event: { type: 'string' } } },
          channels: {
            events: {
              address: 'events',
              messages: {
                event: {
                  payload: { type: 'object', [keyword]: ['examples', 'enum'].includes(keyword) ? [value] : value },
                },
              },
            },
          },
        },
      })
      const document = store.workspace.documents.events
      if (!document || !isAsyncApiDocument(document)) {
        throw new Error('Expected an ingested AsyncAPI document')
      }
      const message = getResolvedRef(document.channels?.events)?.messages?.event
      const result = generate(message ?? {})
      expect(JSON.stringify(result)).toBe(JSON.stringify(value))
      expect(getMessageExampleContent({ payload: result })).toBe(JSON.stringify(value, null, 2))
    },
  )

  it.each(['const', 'example', 'default'])('preserves literal __proto__ fields in %s data', (keyword) => {
    const value = JSON.parse('{"__proto__":{"id":1},"normal":2}')
    expect(generate({ payload: { type: 'object', [keyword]: value } })).toStrictEqual(value)
  })

  it.each(['const', 'example', 'default'])('preserves literal $ref fields in %s data', (keyword) => {
    const value = { $ref: 'literal', id: 1 }
    expect(generate({ payload: { type: 'object', [keyword]: value } })).toStrictEqual(value)
  })

  it('preserves a property named $ref', () => {
    expect(
      generate({
        payload: {
          type: 'object',
          properties: {
            $ref: { type: 'string', const: 'literal' },
            id: { type: 'integer', const: 1 },
          },
        },
      }),
    ).toStrictEqual({ $ref: 'literal', id: 1 })
  })

  it('generates an object using schema examples, defaults, and enums', () => {
    expect(
      generate({
        payload: {
          type: 'object',
          properties: {
            id: { type: 'string', examples: ['evt-1'] },
            count: { type: 'integer', default: 3 },
            kind: { type: 'string', enum: ['created'] },
          },
        },
      }),
    ).toStrictEqual({ id: 'evt-1', count: 3, kind: 'created' })
  })

  it.each([null, false, 0, '', { id: 'authored' }])('preserves an explicit %j payload', (payload) => {
    expect(generate({ payload: { type: 'string' }, examples: [{ payload }] })).toBeUndefined()
  })

  it('resolves explicit example references before deciding whether to generate', () => {
    expect(
      generate({ payload: { type: 'string' }, examples: [{ $ref: '#/example', '$ref-value': { payload: false } }] }),
    ).toBeUndefined()
  })

  it('generates alongside header-only and unresolved examples', () => {
    expect(
      generate({
        payload: { type: 'string', const: 'hello' },
        examples: [{ headers: { trace: 'abc' } }, { $ref: '#/missing' }, { name: 'Empty' }],
      }),
    ).toBe('hello')
  })

  it.each([
    [{ type: 'string', const: 'hello' }, 'hello'],
    [{ type: 'boolean', const: false }, false],
    [{ type: 'integer', const: 0 }, 0],
    [{ type: 'null' }, null],
    [{ type: 'array', items: { type: 'string', const: 'item' } }, ['item']],
    [{ type: 'object', examples: [{ id: 'schema-example' }] }, { id: 'schema-example' }],
  ])('generates values for %j', (payload, expected) => {
    expect(generate({ payload })).toStrictEqual(expected)
  })

  it('resolves nested references and compositions', () => {
    expect(
      generate({
        payload: {
          allOf: [
            {
              $ref: '#/base',
              '$ref-value': { type: 'object', properties: { id: { type: 'string', const: 'evt-1' } } },
            },
            {
              type: 'object',
              properties: {
                data: {
                  $ref: '#/data',
                  '$ref-value': {
                    oneOf: [{ type: 'integer', const: 42 }, { type: 'string' }],
                  },
                },
              },
            },
          ],
        },
      }),
    ).toStrictEqual({ id: 'evt-1', data: 42 })
  })

  it.each([
    'application/vnd.aai.asyncapi+json;version=3.0.0',
    'application/vnd.aai.asyncapi+yaml;version=3.1.0',
    'application/schema+json;version=draft-07',
    'application/schema+yaml;version=draft-07',
  ])('unwraps %s schemas', (schemaFormat) => {
    expect(
      generate({
        payload: {
          $ref: '#/wrapped',
          '$ref-value': {
            schemaFormat,
            schema: { $ref: '#/schema', '$ref-value': { type: 'string', const: 'wrapped' } },
          },
        },
      }),
    ).toBe('wrapped')
  })

  it.each([
    undefined,
    true,
    false,
    { $ref: '#/missing' },
    { schemaFormat: 'application/vnd.apache.avro+json;version=1.9.0', schema: { type: 'string' } },
    { schemaFormat: 'application/vnd.google.protobuf;version=3', schema: 'message Event {}' },
  ])('skips unsupported or missing schemas: %j', (payload) => {
    expect(generate({ payload })).toBeUndefined()
  })

  it('includes read-only, write-only, and deprecated fields like the schema view', () => {
    expect(
      generate({
        payload: {
          type: 'object',
          properties: {
            read: { type: 'string', const: 'r', readOnly: true },
            write: { type: 'string', const: 'w', writeOnly: true },
            old: { type: 'string', const: 'o', deprecated: true },
          },
        },
      }),
    ).toStrictEqual({ read: 'r', write: 'w', old: 'o' })
  })

  it('terminates for recursive payloads without changing the schema', () => {
    const payload: Record<string, unknown> = { type: 'object', properties: {} }
    const reference = { $ref: '#/recursive', '$ref-value': payload }
    payload.properties = { id: { type: 'string', const: 'event' }, child: reference }
    const result = generate({ payload })
    expect(JSON.stringify(result)).toContain('"id":"event"')
    expect(payload.properties).toStrictEqual({ id: { type: 'string', const: 'event' }, child: reference })
  })
})
