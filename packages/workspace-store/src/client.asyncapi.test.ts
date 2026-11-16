import fs from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { getValueAtPath } from '@scalar/helpers/object/get-value-at-path'
import { readFiles } from '@scalar/json-magic/bundle/plugins/node'
import { getRaw } from '@scalar/json-magic/magic-proxy'
import { assert, describe, expect, it } from 'vitest'
import { watchEffect } from 'vue'

import { createWorkspaceStore } from '@/client'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { createServerWorkspaceStore } from '@/server'

const literal = {
  $ref: 'https://example.test/literal.json',
  name: 'kept',
  nested: { $ref: './literal.json', id: 7 },
  local: { $ref: '#/components/schemas/Id', id: 8 },
}
const document = {
  asyncapi: '3.1.0',
  info: { title: 'Events', version: '1', 'x-data': structuredClone(literal) },
  channels: { events: { address: 'events', messages: { event: { $ref: '#/components/messages/Event' } } } },
  operations: { send: { action: 'send', channel: { $ref: '#/channels/events' } } },
  components: {
    messages: {
      Event: {
        name: 'Event',
        payload: {
          type: 'object',
          properties: { id: { $ref: '#/components/schemas/Id' } },
          default: structuredClone(literal),
          enum: [structuredClone(literal)],
          const: structuredClone(literal),
          examples: [structuredClone(literal)],
        },
        headers: { type: 'object', default: structuredClone(literal) },
        examples: [
          {
            payload: structuredClone(literal),
            headers: { reference: { ...structuredClone(literal), $ref: './literal.json' } },
          },
        ],
        'x-data': structuredClone(literal),
      },
    },
    schemas: { Id: { type: 'integer' } },
  },
}

const messagePath = ['components', 'messages', 'Event']
const literalPaths = [
  ['info', 'x-data'],
  ...['default', 'enum', 'const', 'examples'].map((key) => [...messagePath, 'payload', key]),
  [...messagePath, 'headers', 'default'],
  [...messagePath, 'examples'],
  [...messagePath, 'x-data'],
]

/** Reject unexpected loads so traversal tests also catch requests for literal values. */
const createStoreWithStringSchema = (): { store: ReturnType<typeof createWorkspaceStore>; requests: string[] } => {
  const requests: string[] = []
  const store = createWorkspaceStore({
    fetch: (input) => {
      requests.push(String(input))
      if (String(input) === 'https://example.test/value.json') return Promise.resolve(Response.json({ type: 'string' }))
      throw new Error(`Unexpected fetch: ${input}`)
    },
  })
  return { store, requests }
}

describe('client.asyncapi', () => {
  it.each(
    [
      { draft: '04', idKeyword: 'id' },
      { draft: '06', idKeyword: '$id' },
      { draft: '07', idKeyword: '$id' },
    ].flatMap((format) => [false, true].map((lazy) => ({ ...format, lazy }))),
  )('uses the draft-$draft identifier for relative references (lazy: $lazy)', async ({ draft, idKeyword, lazy }) => {
    const { store, requests } = createStoreWithStringSchema()
    await store.addDocument({
      name: 'events',
      document: {
        asyncapi: '3.1.0',
        info: { title: 'Events', version: '1' },
        components: {
          schemas: {
            Wrapped: {
              schemaFormat: `application/schema+json;version=draft-${draft}`,
              schema: {
                id: 'https://ignored.test/',
                $id: 'https://ignored.test/',
                [idKeyword]: 'https://example.test/base.json',
                properties: { value: { $ref: 'value.json' } },
              },
            },
          },
        },
        ...(lazy ? { 'x-scalar-navigation': {} } : {}),
      },
    })
    if (lazy) {
      expect(requests).toStrictEqual([])
      await store.resolve(['components', 'schemas', 'Wrapped'])
    }
    const value = getValueAtPath(store.workspace.documents.events, [
      'components',
      'schemas',
      'Wrapped',
      'schema',
      'properties',
      'value',
    ])
    expect(requests).toStrictEqual(['https://example.test/value.json'])
    expect(getRaw(getResolvedRef(value))).toStrictEqual({ type: 'string' })
  })

  it.each(['04', '06', '07'].flatMap((draft) => [false, true].map((lazy) => ({ draft, lazy }))))(
    'preserves unknown keywords in draft-$draft wrappers (lazy: $lazy)',
    async ({ draft, lazy }) => {
      const { store, requests } = createStoreWithStringSchema()
      const literal = { $ref: 'https://example.test/literal.json', note: 'keep' }
      await store.addDocument({
        name: 'events',
        document: {
          asyncapi: '3.1.0',
          info: { title: 'Events', version: '1' },
          components: {
            schemas: {
              Wrapped: {
                schemaFormat: `application/schema+json;version=draft-${draft}`,
                schema: {
                  properties: { value: { $ref: 'https://example.test/value.json' } },
                  prefixItems: [literal],
                },
              },
            },
          },
          ...(lazy ? { 'x-scalar-navigation': {} } : {}),
        },
      })
      if (lazy) {
        expect(requests).toStrictEqual([])
        await store.resolve(['components', 'schemas', 'Wrapped'])
      }
      const schema = getValueAtPath(store.workspace.documents.events, ['components', 'schemas', 'Wrapped', 'schema'])
      expect(getValueAtPath(getRaw(schema), ['prefixItems'])).toStrictEqual([literal])
      expect(getRaw(getResolvedRef(getValueAtPath(schema, ['properties', 'value'])))).toStrictEqual({ type: 'string' })
      expect(requests).toStrictEqual(['https://example.test/value.json'])
    },
  )

  it.each([
    { lazy: false, wrapperFirst: false },
    { lazy: false, wrapperFirst: true },
    { lazy: true, wrapperFirst: false },
    { lazy: true, wrapperFirst: true },
  ])(
    'retains referenced wrapper vocabulary (lazy: $lazy, wrapper first: $wrapperFirst)',
    async ({ lazy, wrapperFirst }) => {
      const { store, requests } = createStoreWithStringSchema()
      const wrapper = {
        schemaFormat: 'application/schema+json;version=draft-07',
        schema: { $ref: 'https://example.test/value.json' },
      }
      const native = { properties: { value: { $ref: '#/components/schemas/Wrapped' } } }
      await store.addDocument({
        name: 'events',
        document: {
          asyncapi: '3.1.0',
          info: { title: 'Events', version: '1' },
          components: {
            schemas: wrapperFirst ? { Wrapped: wrapper, Native: native } : { Native: native, Wrapped: wrapper },
          },
          ...(lazy ? { 'x-scalar-navigation': {} } : {}),
        },
      })
      if (lazy) {
        expect(requests).toStrictEqual([])
        await store.resolve(['components', 'schemas', 'Native'])
        await store.resolve(['components', 'schemas', 'Wrapped'])
      }
      const loaded = getValueAtPath(store.workspace.documents.events, ['components', 'schemas', 'Wrapped', 'schema'])
      expect(getRaw(getResolvedRef(loaded))).toStrictEqual({ type: 'string' })
      expect(requests).toStrictEqual(['https://example.test/value.json'])
    },
  )

  it.each(
    [
      'application/schema+json;version=draft-04',
      'application/schema+yaml;version=draft-06',
      'application/vnd.oai.openapi;version=3.0.0',
      'application/vnd.oai.openapi+json;version=3.0.4',
      'application/vnd.oai.openapi+yaml;version=3.0.0',
    ].flatMap((schemaFormat) => [false, true].map((lazy) => ({ schemaFormat, lazy }))),
  )('ignores legacy wrapper reference siblings ($schemaFormat, lazy: $lazy)', async ({ schemaFormat, lazy }) => {
    const { store, requests } = createStoreWithStringSchema()
    const ignored = { properties: { sibling: { $ref: 'https://example.test/ignored.json' } } }
    await store.addDocument({
      name: 'events',
      document: {
        asyncapi: '3.1.0',
        info: { title: 'Events', version: '1' },
        components: {
          schemas: {
            Wrapped: { schemaFormat, schema: { $ref: 'https://example.test/value.json', ...ignored } },
          },
        },
        ...(lazy ? { 'x-scalar-navigation': {} } : {}),
      },
    })
    if (lazy) {
      expect(requests).toStrictEqual([])
      await store.resolve(['components', 'schemas', 'Wrapped'])
    }
    const loaded = getValueAtPath(store.workspace.documents.events, ['components', 'schemas', 'Wrapped', 'schema'])
    expect(getRaw(getResolvedRef(loaded))).toStrictEqual({ type: 'string' })
    expect(getValueAtPath(getRaw(loaded), ['properties'])).toStrictEqual(ignored.properties)
    expect(requests).toStrictEqual(['https://example.test/value.json'])
  })

  it.each([false, true])('ignores AsyncAPI 2.x parameter schema reference siblings (lazy: %s)', async (lazy) => {
    const { store, requests } = createStoreWithStringSchema()
    await store.addDocument({
      name: 'events',
      document: {
        asyncapi: '2.6.0',
        info: { title: 'Events', version: '1' },
        channels: {
          events: {
            parameters: {
              id: {
                schema: {
                  $ref: 'https://example.test/value.json',
                  properties: { sibling: { $ref: 'https://example.test/ignored.json' } },
                },
              },
            },
          },
        },
        ...(lazy ? { 'x-scalar-navigation': {} } : {}),
      },
    })
    if (lazy) {
      expect(requests).toStrictEqual([])
      await store.resolve(['channels', 'events'])
    }
    const loaded = getValueAtPath(store.workspace.documents.events, [
      'channels',
      'events',
      'parameters',
      'id',
      'schema',
    ])
    expect(getRaw(getResolvedRef(loaded))).toStrictEqual({ type: 'string' })
    expect(requests).toStrictEqual(['https://example.test/value.json'])
  })

  it.each([
    { asyncapi: '3.0.0', lazy: false },
    { asyncapi: '3.1.0', lazy: false },
    { asyncapi: '3.0.0', lazy: true },
    { asyncapi: '3.1.0', lazy: true },
  ])('ignores schema reference siblings ($asyncapi, lazy: $lazy)', async ({ asyncapi, lazy }) => {
    const requests: string[] = []
    const ignored = { ignored: { $ref: 'https://example.test/ignored.json' } }
    const reference = { $ref: 'https://example.test/actual.json', properties: ignored }
    const store = createWorkspaceStore({
      fetch: (input) => {
        const url = String(input)
        requests.push(url)
        if (url === 'https://example.test/actual.json') return Promise.resolve(Response.json({ type: 'string' }))
        throw new Error(`Unexpected fetch: ${url}`)
      },
    })
    await store.addDocument({
      name: 'events',
      document: {
        asyncapi,
        info: { title: 'Events', version: '1' },
        components: {
          schemas: {
            Actual: { type: 'string' },
            Local: { ...structuredClone(reference), $ref: '#/components/schemas/Actual' },
            Native: structuredClone(reference),
            Wrapped: {
              schemaFormat: `application/vnd.aai.asyncapi+json;version=${asyncapi}`,
              schema: structuredClone(reference),
            },
            Draft07: {
              schemaFormat: 'application/schema+json;version=draft-07',
              schema: structuredClone(reference),
            },
          },
        },
        ...(lazy ? { 'x-scalar-navigation': {} } : {}),
      },
    })
    const paths = [['Local'], ['Native'], ['Wrapped', 'schema'], ['Draft07', 'schema']]
    if (lazy) {
      expect(requests).toStrictEqual([])
      for (const [name] of paths) await store.resolve(['components', 'schemas', name!])
    }
    for (const path of paths) {
      const loaded = getValueAtPath(store.workspace.documents.events, ['components', 'schemas', ...path])
      expect(getRaw(getResolvedRef(loaded))).toStrictEqual({ type: 'string' })
      expect(getValueAtPath(getRaw(loaded), ['properties'])).toStrictEqual(ignored)
      await store.resolve(['components', 'schemas', path[0]!])
    }
    expect(requests).toStrictEqual(['https://example.test/actual.json'])
  })

  it.each([
    { asyncapi: '3.0.0', lazy: false },
    { asyncapi: '3.1.0', lazy: false },
    { asyncapi: '3.0.0', lazy: true },
    { asyncapi: '3.1.0', lazy: true },
  ])('resolves named servers and variables ($asyncapi, lazy: $lazy)', async ({ asyncapi, lazy }) => {
    const requests: string[] = []
    const server = {
      host: '{default}.example.test',
      protocol: 'kafka',
      variables: { default: { $ref: 'https://example.test/variable.json' } },
      'x-data': structuredClone(literal),
    }
    const store = createWorkspaceStore({
      fetch: (input) => {
        const url = String(input)
        requests.push(url)
        if (url === 'https://example.test/server.json') return Promise.resolve(Response.json(server))
        if (url === 'https://example.test/variable.json') return Promise.resolve(Response.json({ default: 'events' }))
        throw new Error(`Unexpected fetch: ${url}`)
      },
    })
    await store.addDocument({
      name: 'events',
      document: {
        asyncapi,
        info: { title: 'Events', version: '1' },
        servers: { default: { $ref: 'https://example.test/server.json' } },
        ...(lazy ? { 'x-scalar-navigation': {} } : {}),
      },
    })
    if (lazy) {
      expect(requests).toStrictEqual([])
      await store.resolve(['servers', 'default'])
    }
    const loaded = getResolvedRef(getValueAtPath(store.workspace.documents.events, ['servers', 'default']))
    expect(getValueAtPath(loaded, ['host'])).toBe('{default}.example.test')
    expect(getRaw(getResolvedRef(getValueAtPath(loaded, ['variables', 'default'])))).toStrictEqual({
      default: 'events',
    })
    expect(getValueAtPath(getRaw(loaded), ['x-data'])).toStrictEqual(literal)
    await store.resolve(['servers', 'default'])
    expect(requests).toStrictEqual(['https://example.test/server.json', 'https://example.test/variable.json'])
  })

  it.each([
    { asyncapi: '3.0.0', lazy: false },
    { asyncapi: '3.1.0', lazy: false },
    { asyncapi: '3.0.0', lazy: true },
    { asyncapi: '3.1.0', lazy: true },
  ])('resolves binding query schemas ($asyncapi, lazy: $lazy)', async ({ asyncapi, lazy }) => {
    const requests: string[] = []
    const store = createWorkspaceStore({
      fetch: (input) => {
        requests.push(String(input))
        if (String(input) === 'https://example.test/id.json') return Promise.resolve(Response.json({ type: 'string' }))
        throw new Error(`Unexpected fetch: ${input}`)
      },
    })
    const path = ['operations', 'send', 'bindings', 'http', 'query']
    await store.addDocument({
      name: 'events',
      document: {
        asyncapi,
        info: { title: 'Events', version: '1' },
        channels: { events: { address: '/events' } },
        operations: {
          send: {
            action: 'send',
            channel: { $ref: '#/channels/events' },
            bindings: {
              http: {
                method: 'GET',
                bindingVersion: '0.3.0',
                query: {
                  type: 'object',
                  properties: { default: { $ref: 'https://example.test/id.json' } },
                  default: structuredClone(literal),
                },
              },
            },
          },
        },
        ...(lazy ? { 'x-scalar-navigation': {} } : {}),
      },
    })
    if (lazy) {
      expect(requests).toStrictEqual([])
      await store.resolve(['operations', 'send'])
    }
    const query = getValueAtPath(store.workspace.documents.events, path)
    expect(getRaw(getResolvedRef(getValueAtPath(query, ['properties', 'default'])))).toStrictEqual({ type: 'string' })
    expect(getValueAtPath(getRaw(query), ['default'])).toStrictEqual(literal)
    await store.resolve(['operations', 'send'])
    expect(requests).toStrictEqual(['https://example.test/id.json'])
  })

  it.each([
    { asyncapi: '3.0.0', lazy: false },
    { asyncapi: '3.1.0', lazy: false },
    { asyncapi: '3.0.0', lazy: true },
    { asyncapi: '3.1.0', lazy: true },
  ])('resolves schema vocabulary references ($asyncapi, lazy: $lazy)', async ({ asyncapi, lazy }) => {
    const requests: string[] = []
    const extraItem = { type: 'integer' }
    const externalDocs = { url: 'https://example.test/docs', description: 'Schema documentation' }
    const literalDocs = { $ref: 'https://example.test/literal.json', name: 'kept' }
    const schema = {
      type: 'object',
      properties: {
        list: {
          type: 'array',
          items: [{ type: 'string' }],
          additionalItems: { $ref: 'https://example.test/item.json' },
        },
        metadata: { type: 'object', externalDocs: { $ref: 'https://example.test/docs.json' } },
      },
    }
    const store = createWorkspaceStore({
      fetch: (input) => {
        const url = String(input)
        requests.push(url)
        if (url === 'https://example.test/item.json') return Promise.resolve(Response.json(extraItem))
        if (url === 'https://example.test/docs.json') return Promise.resolve(Response.json(externalDocs))
        throw new Error(`Unexpected fetch: ${url}`)
      },
    })
    await store.addDocument({
      name: 'events',
      document: {
        asyncapi,
        info: { title: 'Events', version: '1' },
        components: {
          schemas: {
            Native: structuredClone(schema),
            Wrapped: {
              schemaFormat: `application/vnd.aai.asyncapi+json;version=${asyncapi}`,
              schema: structuredClone(schema),
            },
            JsonSchema: {
              schemaFormat: 'application/schema+json;version=draft-07',
              schema: { ...structuredClone(schema.properties.list), externalDocs: literalDocs },
            },
          },
        },
        ...(lazy ? { 'x-scalar-navigation': {} } : {}),
      },
    })
    if (lazy) {
      expect(requests).toStrictEqual([])
      for (const name of ['Native', 'Wrapped', 'JsonSchema']) {
        await store.resolve(['components', 'schemas', name])
      }
    }
    const loaded = store.workspace.documents.events
    expect(requests).toStrictEqual(['https://example.test/item.json', 'https://example.test/docs.json'])
    for (const path of [['Native'], ['Wrapped', 'schema']]) {
      const resolved = getValueAtPath(loaded, ['components', 'schemas', ...path])
      expect(getRaw(getResolvedRef(getValueAtPath(resolved, ['properties', 'list', 'additionalItems'])))).toStrictEqual(
        extraItem,
      )
      expect(
        getRaw(getResolvedRef(getValueAtPath(resolved, ['properties', 'metadata', 'externalDocs']))),
      ).toStrictEqual(externalDocs)
    }
    const jsonSchema = getValueAtPath(loaded, ['components', 'schemas', 'JsonSchema', 'schema'])
    expect(getRaw(getResolvedRef(getValueAtPath(jsonSchema, ['additionalItems'])))).toStrictEqual(extraItem)
    expect(getValueAtPath(getRaw(jsonSchema), ['externalDocs'])).toStrictEqual(literalDocs)
    for (const name of ['Native', 'Wrapped', 'JsonSchema']) {
      await store.resolve(['components', 'schemas', name])
    }
    expect(requests).toStrictEqual(['https://example.test/item.json', 'https://example.test/docs.json'])
  })

  it.each([
    { asyncapi: '3.0.0', lazy: false },
    { asyncapi: '3.1.0', lazy: false },
    { asyncapi: '3.0.0', lazy: true },
    { asyncapi: '3.1.0', lazy: true },
  ])('resolves Multi Format Schema references ($asyncapi, lazy: $lazy)', async ({ asyncapi, lazy }) => {
    const fetched: string[] = []
    const schema = {
      type: 'object',
      properties: { id: { $ref: './id.json' } },
      default: structuredClone(literal),
      examples: [structuredClone(literal)],
    }
    const store = createWorkspaceStore({
      fetch: (input) => {
        const url = String(input)
        fetched.push(url)
        if (url === 'https://example.test/schema.json') {
          return Promise.resolve(new Response(JSON.stringify(schema)))
        }
        if (url === 'https://example.test/id.json') {
          return Promise.resolve(new Response('{"type":"integer"}'))
        }
        throw new Error(`Unexpected fetch: ${url}`)
      },
    })
    const multiFormatSchema = {
      schemaFormat: 'application/schema+json;version=draft-07',
      schema: { $ref: './schema.json' },
    }
    await store.addDocument({
      name: 'events',
      documentSource: 'https://example.test/events.json',
      document: {
        asyncapi,
        info: { title: 'Events', version: '1' },
        channels: { events: { messages: { event: { $ref: '#/components/messages/Event' } } } },
        components: {
          messages: {
            Event: { payload: structuredClone(multiFormatSchema), headers: structuredClone(multiFormatSchema) },
          },
          schemas: { Event: structuredClone(multiFormatSchema) },
        },
        ...(lazy ? { 'x-scalar-navigation': {} } : {}),
      },
    })
    if (lazy) {
      expect(fetched).toStrictEqual([])
      await store.resolve(messagePath)
      await store.resolve(['components', 'schemas', 'Event'])
    }
    const loaded = store.workspace.documents.events
    for (const path of [
      [...messagePath, 'payload'],
      [...messagePath, 'headers'],
      ['components', 'schemas', 'Event'],
    ]) {
      const resolved = getResolvedRef(getValueAtPath(loaded, [...path, 'schema']))
      expect(getValueAtPath(resolved, ['type'])).toBe('object')
      expect(getRaw(getResolvedRef(getValueAtPath(resolved, ['properties', 'id'])))).toStrictEqual({ type: 'integer' })
      expect(getValueAtPath(getRaw(resolved), ['default'])).toStrictEqual(literal)
      expect(getValueAtPath(getRaw(resolved), ['examples'])).toStrictEqual([literal])
    }
    expect(fetched).toStrictEqual(['https://example.test/schema.json', 'https://example.test/id.json'])
    await store.resolve(messagePath)
    await store.resolve(['components', 'schemas', 'Event'])
    expect(fetched).toStrictEqual(['https://example.test/schema.json', 'https://example.test/id.json'])
  })

  it.each(['3.0.0', '3.1.0'])('preserves literal data when initially loading AsyncAPI %s', async (asyncapi) => {
    const fetched: string[] = []
    const reads: string[] = []
    const store = createWorkspaceStore({
      fetch: (input) => {
        fetched.push(String(input))
        return Promise.resolve(new Response('{"type":"integer"}'))
      },
      fileLoader: {
        type: 'loader',
        validate: () => true,
        exec: (path) => {
          reads.push(path)
          return Promise.resolve({ ok: true, data: { type: 'integer' }, raw: '{"type":"integer"}' })
        },
      },
    })
    const source = {
      ...structuredClone(document),
      asyncapi,
      components: {
        ...structuredClone(document.components),
        schemas: { Id: { $ref: 'https://example.test/id.json' } },
      },
    }
    await store.addDocument({ name: 'events', document: source, documentSource: '/documents/events.json' })
    const loaded = store.workspace.documents.events
    const raw = getRaw(loaded)
    for (const path of literalPaths) {
      expect(getValueAtPath(raw, path), path.join('/')).toStrictEqual(getValueAtPath(source, path))
    }
    expect(fetched).toStrictEqual(['https://example.test/id.json'])
    expect(reads).toStrictEqual([])
    expect(getRaw(getResolvedRef(getValueAtPath(loaded, ['components', 'schemas', 'Id'])))).toStrictEqual({
      type: 'integer',
    })
    expect(getRaw(getResolvedRef(getValueAtPath(loaded, ['channels', 'events', 'messages', 'event'])))).toStrictEqual(
      getValueAtPath(raw, messagePath),
    )
  })

  it.each([
    { asyncapi: '3.0.0', chunked: false },
    { asyncapi: '3.1.0', chunked: false },
    { asyncapi: '3.0.0', chunked: true },
    { asyncapi: '3.1.0', chunked: true },
  ])('preserves literal data after server handoff ($asyncapi, chunked: $chunked)', async ({ asyncapi, chunked }) => {
    const server = await createServerWorkspaceStore({
      mode: 'ssr',
      baseUrl: 'https://example.test',
      documents: [{ name: 'events', document: { ...structuredClone(document), asyncapi } }],
    })
    const fetched: string[] = []
    const reads: string[] = []
    const store = createWorkspaceStore({
      fetch: (input) => {
        fetched.push(String(input))
        return Promise.resolve(new Response(JSON.stringify(server.get(String(input)) ?? {})))
      },
      fileLoader: {
        type: 'loader',
        validate: () => true,
        exec: (path) => {
          reads.push(path)
          return Promise.resolve({ ok: false })
        },
      },
    })
    const handoff = chunked ? server.getWorkspace().documents.events : server.getResolvedDocument('events')
    assert(handoff)
    await store.addDocument({
      name: 'events',
      document: getRaw(handoff),
      overrides: { info: { title: 'Overridden events' } },
    })
    expect(fetched).toStrictEqual([])
    const loaded = store.workspace.documents.events
    const statuses: unknown[] = []
    const stop = watchEffect(() => statuses.push(getValueAtPath(loaded, [...messagePath, '$status'])), {
      flush: 'sync',
    })
    try {
      await store.resolve(messagePath)
      const message = getRaw(getResolvedRef(getValueAtPath(loaded, messagePath)))
      for (const path of literalPaths.filter((path) => path[0] === 'components')) {
        expect(getValueAtPath(message, path.slice(3)), path.join('/')).toStrictEqual(getValueAtPath(document, path))
      }
      expect(getRaw(getResolvedRef(getValueAtPath(loaded, ['components', 'schemas', 'Id'])))).toStrictEqual({
        type: 'integer',
      })
      const firstRequests = [...fetched]
      await store.resolve(messagePath)
      if (!chunked) {
        await store.resolve(['channels', 'events', 'messages', 'event'])
        expect(
          getRaw(getResolvedRef(getValueAtPath(loaded, ['channels', 'events', 'messages', 'event']))),
        ).toStrictEqual(message)
      }
      expect(fetched).toStrictEqual(firstRequests)
      expect(fetched).toStrictEqual(
        chunked
          ? [
              'https://example.test/events/asyncapi/components-messages/group-0',
              'https://example.test/events/asyncapi/components-schemas/group-0',
            ]
          : [],
      )
      expect(reads).toStrictEqual([])
      expect(getValueAtPath(loaded, ['info', 'title'])).toBe('Overridden events')
      expect(statuses).toStrictEqual(chunked ? [undefined, 'loading', undefined] : [undefined])
    } finally {
      stop()
    }
  })

  it.each(['3.0.0', '3.1.0'])('reads only genuine references when loading AsyncAPI %s from disk', async (asyncapi) => {
    const directory = await fs.mkdtemp(join(tmpdir(), 'scalar-asyncapi-literals-'))
    try {
      const mainPath = join(directory, 'events.json')
      const schemaPath = join(directory, 'id.json')
      const source = {
        ...structuredClone(document),
        asyncapi,
        components: { ...structuredClone(document.components), schemas: { Id: { $ref: './id.json' } } },
      }
      await Promise.all([
        fs.writeFile(mainPath, JSON.stringify(source)),
        fs.writeFile(schemaPath, '{"type":"integer"}'),
        fs.writeFile(join(directory, 'literal.json'), '{"unexpected":true}'),
      ])
      const reads: string[] = []
      const fetched: string[] = []
      const reader = readFiles({ basePath: directory })
      const store = createWorkspaceStore({
        fileLoader: {
          ...reader,
          exec: (path) => {
            reads.push(path)
            return reader.exec(path)
          },
        },
        fetch: (input) => {
          fetched.push(String(input))
          return Promise.resolve(new Response('{}'))
        },
      })
      await store.addDocument({ name: 'events', path: mainPath })
      const loaded = store.workspace.documents.events
      for (const path of literalPaths) {
        expect(getValueAtPath(getRaw(loaded), path), path.join('/')).toStrictEqual(getValueAtPath(source, path))
      }
      expect(reads).toStrictEqual([mainPath, schemaPath])
      expect(fetched).toStrictEqual([])
      expect(getRaw(getResolvedRef(getValueAtPath(loaded, ['components', 'schemas', 'Id'])))).toStrictEqual({
        type: 'integer',
      })
    } finally {
      await fs.rm(directory, { recursive: true, force: true })
    }
  })
})
