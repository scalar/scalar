import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { bundle } from '@scalar/json-magic/bundle'
import { describe, expect, it } from 'vitest'

import { createWorkspaceStore } from '@/client'
import { getResolvedAsyncApiRef } from '@/helpers/get-resolved-async-api-ref'
import { resolveAsyncApiSchema } from '@/helpers/resolve-async-api-schema'
import { isAsyncApiDocument } from '@/schemas/type-guards'
import { createServerWorkspaceStore } from '@/server'

import { asyncApiSchemaResources } from './async-api-schema-resources'

const format = 'application/vnd.google.protobuf;version=3'
const value = 'syntax="proto3"; import "types/user.proto"; message Root { User user=1; }'
const user = 'syntax="proto3"; message User { string id=1; }'
const schema = (): { schemaFormat: string; schema: string } => ({ schemaFormat: format, schema: value })
const fixture = {
  asyncapi: '3.1.0',
  info: { title: 'Native dependencies', version: '1' },
  channels: { users: { address: 'users', messages: { user: { payload: schema(), headers: schema() } } } },
  components: { schemas: { User: schema() } },
}
const document = (): typeof fixture => structuredClone(fixture)

describe('async-api-schema-resources', () => {
  it('loads payloads, headers and reusable schemas with the configured fetch and reuses files', async () => {
    const requested: string[] = []
    const store = createWorkspaceStore({
      fetch: (input) => {
        requested.push(String(input))
        return Promise.resolve(new Response(user))
      },
    })
    const authored = document()
    await store.addDocument({ name: 'test', document: authored, documentSource: 'https://example.test/api.yaml' })
    const loaded = store.workspace.documents.test
    if (!loaded || !isAsyncApiDocument(loaded)) throw new Error('Missing AsyncAPI document')
    const expected = {
      kind: 'source',
      format,
      value,
      resources: { origin: 'https://example.test/api.yaml', files: { 'https://example.test/types/user.proto': user } },
    }
    expect(
      resolveAsyncApiSchema(
        getResolvedAsyncApiRef(getResolvedAsyncApiRef(loaded.channels?.users)?.messages?.user)?.payload,
      ),
    ).toStrictEqual(expected)
    expect(
      resolveAsyncApiSchema(
        getResolvedAsyncApiRef(getResolvedAsyncApiRef(loaded.channels?.users)?.messages?.user)?.headers,
      ),
    ).toStrictEqual(expected)
    expect(resolveAsyncApiSchema(getResolvedAsyncApiRef(loaded.components)?.schemas?.User)).toStrictEqual(expected)
    expect(requested).toStrictEqual(['https://example.test/types/user.proto'])
    expect(authored).toStrictEqual(document())
  })

  it('uses the containing external AsyncAPI fragment location', async () => {
    const requested: string[] = []
    const store = createWorkspaceStore({
      fetch: (input) => {
        const uri = String(input)
        requested.push(uri)
        return Promise.resolve(
          new Response(uri.endsWith('message.json') ? JSON.stringify({ payload: schema() }) : user),
        )
      },
    })
    const authored = document()
    Object.assign(authored.channels.users.messages, { user: { $ref: './messages/message.json' } })
    await store.addDocument({ name: 'test', document: authored, documentSource: 'https://example.test/api.yaml' })
    expect(requested).toStrictEqual([
      'https://example.test/messages/message.json',
      'https://example.test/messages/types/user.proto',
      'https://example.test/types/user.proto',
    ])
  })

  it('does not load schema-shaped examples, extensions or OpenAPI fields', async () => {
    const requested: string[] = []
    for (const source of [
      {
        asyncapi: '3.1.0',
        info: { title: 'A', version: '1' },
        'x-sample': schema(),
        channels: { users: { messages: { user: { examples: [{ payload: schema() }] } } } },
      },
      { openapi: '3.2.0', info: { title: 'A', version: '1' }, components: { schemas: { Sample: schema() } } },
    ]) {
      await bundle(source, {
        traversal: 'document',
        treeShake: false,
        origin: 'https://example.test/api.yaml',
        plugins: [
          asyncApiSchemaResources(),
          {
            type: 'loader',
            validate: () => true,
            exec: (uri) => {
              requested.push(uri)
              return Promise.resolve({ ok: true, data: user, raw: user })
            },
          },
        ],
      })
    }
    expect(requested).toStrictEqual([])
  })

  it('prepares inline dependencies before server chunking using the source location', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'scalar-native-schemas-'))
    try {
      await fs.mkdir(path.join(directory, 'types'))
      await fs.writeFile(path.join(directory, 'api.json'), JSON.stringify(document()))
      await fs.writeFile(path.join(directory, 'types/user.proto'), user)
      const server = await createServerWorkspaceStore({
        mode: 'ssr',
        baseUrl: 'https://docs.example.test',
        documentLoading: { basePath: directory },
        documents: [{ name: 'test', path: path.join(directory, 'api.json') }],
      })
      const data = server.getResolvedDocument('test')
      expect(JSON.stringify(data)).toContain(JSON.stringify(user))
      expect(JSON.stringify(server.get('/test/asyncapi/models/User'))).toContain(JSON.stringify(user))
      expect(JSON.stringify(data)).toContain(path.join(directory, 'api.json'))
    } finally {
      await fs.rm(directory, { recursive: true, force: true })
    }
  })

  it('accepts a caller-provided file loader for virtual files', async () => {
    const requested: string[] = []
    const client = createWorkspaceStore({
      fileLoader: {
        type: 'loader',
        validate: () => true,
        exec: (uri) => {
          requested.push(uri)
          return Promise.resolve({ ok: true, data: user, raw: user })
        },
      },
    })
    await client.addDocument({ name: 'test', document: document(), documentSource: '/virtual/api.yaml' })
    expect(requested).toStrictEqual(['/virtual/types/user.proto'])
  })

  it.each([false, true])('prepares server-side headers in message traits (reusable: %s)', async (reusable) => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'scalar-native-trait-headers-'))
    const headers = schema()
    const trait = { headers }
    const authored = {
      asyncapi: '3.1.0',
      info: { title: 'Trait headers', version: '1' },
      channels: {
        users: {
          address: 'users',
          messages: { user: { traits: [reusable ? { $ref: '#/components/messageTraits/common' } : trait] } },
        },
      },
      ...(reusable ? { components: { messageTraits: { common: trait } } } : {}),
    }
    const origin = path.join(directory, 'api.json')
    try {
      await fs.mkdir(path.join(directory, 'types'))
      await fs.writeFile(origin, JSON.stringify(authored))
      await fs.writeFile(path.join(directory, 'types/user.proto'), user)
      const server = await createServerWorkspaceStore({
        mode: 'ssr',
        baseUrl: 'https://docs.example.test',
        documentLoading: { basePath: directory },
        documents: [{ name: 'test', path: origin }],
      })
      const loaded = server.getResolvedDocument('test')
      if (!loaded || !isAsyncApiDocument(loaded)) throw new Error('Missing AsyncAPI document')
      const message = getResolvedAsyncApiRef(getResolvedAsyncApiRef(loaded.channels?.users)?.messages?.user)
      const resolvedTrait = getResolvedAsyncApiRef(message?.traits?.[0])
      expect(resolveAsyncApiSchema(resolvedTrait?.headers)).toStrictEqual({
        kind: 'source',
        format,
        value,
        resources: { origin, files: { [path.join(directory, 'types/user.proto')]: user } },
      })
      expect(JSON.stringify(server.get('/test/asyncapi'))).toContain(JSON.stringify(user))
      expect(headers).toStrictEqual(schema())
    } finally {
      await fs.rm(directory, { recursive: true, force: true })
    }
  })
})
