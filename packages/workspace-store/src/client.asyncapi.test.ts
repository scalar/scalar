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

describe('client AsyncAPI literal references', () => {
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
