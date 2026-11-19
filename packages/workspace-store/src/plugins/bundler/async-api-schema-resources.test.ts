import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { isObject } from '@scalar/helpers/object/is-object'
import { bundle } from '@scalar/json-magic/bundle'
import { describe, expect, it } from 'vitest'

import { type WorkspaceStore, createWorkspaceStore } from '@/client'
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

/** Exercise the same display boundary as an expanded schema, without changing the document. */
const expand = async (store: WorkspaceStore, input: unknown): Promise<unknown> => {
  const schema = resolveAsyncApiSchema(input)
  return schema?.kind === 'source'
    ? {
        ...schema,
        resources: await store.asyncApiSchemaResources('test')(schema.format, schema.value, schema.resources),
      }
    : schema
}

describe('async-api-schema-resources', () => {
  it('defers payloads, headers and reusable schemas and shares concurrent authenticated downloads', async () => {
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
    expect(requested).toStrictEqual([])
    const expected = {
      kind: 'source',
      format,
      value,
      resources: { origin: 'https://example.test/api.yaml', files: { 'https://example.test/types/user.proto': user } },
    }
    expect(
      await expand(
        store,
        getResolvedAsyncApiRef(getResolvedAsyncApiRef(loaded.channels?.users)?.messages?.user)?.payload,
      ),
    ).toStrictEqual(expected)
    expect(
      await expand(
        store,
        getResolvedAsyncApiRef(getResolvedAsyncApiRef(loaded.channels?.users)?.messages?.user)?.headers,
      ),
    ).toStrictEqual(expected)
    expect(await expand(store, getResolvedAsyncApiRef(loaded.components)?.schemas?.User)).toStrictEqual(expected)
    expect(
      await Promise.all([
        expand(store, getResolvedAsyncApiRef(loaded.components)?.schemas?.User),
        expand(store, getResolvedAsyncApiRef(loaded.components)?.schemas?.User),
      ]),
    ).toStrictEqual([expected, expected])
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
    expect(requested).toStrictEqual(['https://example.test/messages/message.json'])
    const loaded = store.workspace.documents.test
    if (!loaded || !isAsyncApiDocument(loaded)) throw new Error('Missing AsyncAPI document')
    const message = getResolvedAsyncApiRef(getResolvedAsyncApiRef(loaded.channels?.users)?.messages?.user)
    await expand(store, message?.payload)
    expect(requested).toStrictEqual([
      'https://example.test/messages/message.json',
      'https://example.test/messages/types/user.proto',
    ])
  })

  it.each(['file:///private/message.json', 'https://other.test/forged/message.json'])(
    'replaces authored deferred origins with the containing external fragment location (%s)',
    async (origin) => {
      const requested: string[] = []
      const store = createWorkspaceStore({
        fetch: (input) => {
          const uri = String(input)
          requested.push(uri)
          return Promise.resolve(
            new Response(
              uri.endsWith('message.json')
                ? JSON.stringify({
                    payload: { ...schema(), 'x-scalar-schema-resources': { origin, files: {}, deferred: true } },
                  })
                : user,
            ),
          )
        },
      })
      const authored = document()
      Object.assign(authored.channels.users.messages, { user: { $ref: './messages/message.json' } })
      await store.addDocument({ name: 'test', document: authored, documentSource: 'https://example.test/api.yaml' })
      expect(requested).toStrictEqual(['https://example.test/messages/message.json'])
      const loaded = store.workspace.documents.test
      if (!loaded || !isAsyncApiDocument(loaded)) throw new Error('Missing AsyncAPI document')
      const message = getResolvedAsyncApiRef(getResolvedAsyncApiRef(loaded.channels?.users)?.messages?.user)
      expect(await expand(store, message?.payload)).toStrictEqual({
        kind: 'source',
        format,
        value,
        resources: {
          origin: 'https://example.test/messages/message.json',
          files: { 'https://example.test/messages/types/user.proto': user },
        },
      })
      expect(requested).toStrictEqual([
        'https://example.test/messages/message.json',
        'https://example.test/messages/types/user.proto',
      ])
    },
  )

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
    expect(requested).toStrictEqual([])
    const loaded = client.workspace.documents.test
    if (!loaded || !isAsyncApiDocument(loaded)) throw new Error('Missing AsyncAPI document')
    await expand(client, getResolvedAsyncApiRef(loaded.components)?.schemas?.User)
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

  it.each(['channel', 'components', 'schema'])(
    'prepares server-side native schemas through a local %s reference',
    async (target) => {
      const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'scalar-native-local-reference-'))
      const native = schema()
      const message = { payload: native, headers: native }
      const authored = {
        asyncapi: '3.1.0',
        info: { title: 'Local references', version: '1' },
        ...(target === 'channel'
          ? {
              channels: { users: { $ref: '#/components/channels/UserChannel' } },
              components: { channels: { UserChannel: { messages: { user: message } } } },
            }
          : target === 'components'
            ? {
                channels: { users: { messages: { user: { $ref: '#/x-components/messages/User' } } } },
                components: { $ref: '#/x-components' },
                'x-components': { messages: { User: message } },
              }
            : {
                channels: {
                  users: {
                    messages: {
                      user: {
                        payload: { $ref: '#/components/schemas/User' },
                        headers: { $ref: '#/components/schemas/User' },
                      },
                    },
                  },
                },
                components: { schemas: { User: { $ref: '#/x-native' } } },
                'x-native': native,
              }),
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
        const resolvedMessage = getResolvedAsyncApiRef(getResolvedAsyncApiRef(loaded.channels?.users)?.messages?.user)
        const expected = {
          kind: 'source',
          format,
          value,
          resources: { origin, files: { [path.join(directory, 'types/user.proto')]: user } },
        }
        expect(resolveAsyncApiSchema(resolvedMessage?.payload)).toStrictEqual(expected)
        expect(resolveAsyncApiSchema(resolvedMessage?.headers)).toStrictEqual(expected)
        const output = { chunks: server.get('/test/asyncapi'), workspace: server.getWorkspace() }
        expect(JSON.stringify(output)).toContain(JSON.stringify(user))
      } finally {
        await fs.rm(directory, { recursive: true, force: true })
      }
    },
  )

  it('reloads changed imports from editable documents while retaining snapshot resources and literal examples', async () => {
    const requested: string[] = []
    const store = createWorkspaceStore({
      fetch: (input) => {
        requested.push(String(input))
        return Promise.resolve(new Response(user))
      },
    })
    const authored = document()
    const literal = { ...schema(), 'x-scalar-schema-resources': { origin: 'authored', files: {} } }
    Object.assign(authored.channels.users.messages.user, { examples: [{ payload: literal }] })
    await store.addDocument({ name: 'test', document: authored, documentSource: 'https://example.test/api.yaml' })
    const initial = store.workspace.documents.test
    if (!initial || !isAsyncApiDocument(initial)) throw new Error('Missing AsyncAPI document')
    await expand(store, getResolvedAsyncApiRef(initial.components)?.schemas?.User)
    expect(requested).toStrictEqual(['https://example.test/types/user.proto'])
    const editable = await store.getEditableDocument('test')
    if (!editable || !isAsyncApiDocument(editable)) throw new Error('Missing AsyncAPI document')
    const message = getResolvedAsyncApiRef(getResolvedAsyncApiRef(editable.channels?.users)?.messages?.user)
    expect(message?.payload).toStrictEqual(schema())
    expect(message?.examples).toStrictEqual([{ payload: literal }])
    if (!message) throw new Error('Missing message')
    message.payload = { schemaFormat: format, schema: value.replace('types/user.proto', 'types/new.proto') }
    await store.replaceDocument('test', editable)
    expect(requested).toStrictEqual(['https://example.test/types/user.proto'])
    const replaced = store.workspace.documents.test
    if (!replaced || !isAsyncApiDocument(replaced)) throw new Error('Missing AsyncAPI document')
    const payload = getResolvedAsyncApiRef(getResolvedAsyncApiRef(replaced.channels?.users)?.messages?.user)?.payload
    expect(await expand(store, payload)).toStrictEqual({
      kind: 'source',
      format,
      value: value.replace('types/user.proto', 'types/new.proto'),
      resources: {
        origin: 'https://example.test/api.yaml',
        files: { 'https://example.test/types/new.proto': user },
      },
    })
    expect(requested).toStrictEqual(['https://example.test/types/user.proto', 'https://example.test/types/new.proto'])
  })

  it.each([false, true])(
    'defers AsyncAPI 2.x native payloads before upgrading (inherited format: %s)',
    async (inherited) => {
      const authored = {
        asyncapi: '2.6.0',
        info: { title: 'Legacy native schemas', version: '1' },
        channels: { users: { publish: { message: { $ref: '#/components/messages/User' } } } },
        components: {
          messages: {
            User: {
              payload: value,
              headers: { type: 'object', properties: { trace: { type: 'string' } } },
              ...(inherited ? { traits: [{ $ref: '#/components/messageTraits/Native' }] } : { schemaFormat: format }),
            },
          },
          messageTraits: { Native: { schemaFormat: format } },
        },
      }
      const requested: string[] = []
      const client = createWorkspaceStore({
        fetch: (input) => {
          requested.push(String(input))
          return Promise.resolve(new Response(user))
        },
      })
      await client.addDocument({ name: 'test', document: authored, documentSource: 'https://example.test/api.yaml' })
      const loaded = client.workspace.documents.test
      if (!loaded || !isAsyncApiDocument(loaded)) throw new Error('Missing AsyncAPI document')
      const message = getResolvedAsyncApiRef(getResolvedAsyncApiRef(loaded.channels?.users)?.messages?.User)
      expect(requested).toStrictEqual([])
      expect(await expand(client, message?.payload)).toStrictEqual({
        kind: 'source',
        format,
        value,
        resources: {
          origin: 'https://example.test/api.yaml',
          files: { 'https://example.test/types/user.proto': user },
        },
      })
      expect(resolveAsyncApiSchema(message?.headers)).toStrictEqual({
        kind: 'schema',
        schema: { type: 'object', properties: { trace: { type: 'string' } } },
      })
      expect(requested).toStrictEqual(['https://example.test/types/user.proto'])
      expect(authored.components.messages.User.payload).toBe(value)

      const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'scalar-legacy-native-'))
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
        const resolved = server.getResolvedDocument('test')
        if (!resolved || !isAsyncApiDocument(resolved)) throw new Error('Missing AsyncAPI document')
        const serverMessage = getResolvedAsyncApiRef(getResolvedAsyncApiRef(resolved.channels?.users)?.messages?.User)
        expect(resolveAsyncApiSchema(serverMessage?.payload)).toStrictEqual({
          kind: 'source',
          format,
          value,
          resources: { origin, files: { [path.join(directory, 'types/user.proto')]: user } },
        })
        expect(resolved['x-original-aas-version']).toBe('2.6.0')
      } finally {
        await fs.rm(directory, { recursive: true, force: true })
      }
    },
  )
  it.each([true, false])(
    'invalidates downloaded files after an in-place schema edit (reactive: %s)',
    async (reactive) => {
      const requested: string[] = []
      let dependency = user
      const store = createWorkspaceStore({
        reactive,
        fetch: (input) => {
          requested.push(String(input))
          return Promise.resolve(new Response(dependency))
        },
      })
      await store.addDocument({ name: 'test', document: document(), documentSource: 'https://example.test/api.yaml' })
      const loaded = store.workspace.documents.test
      if (!loaded || !isAsyncApiDocument(loaded)) throw new Error('Missing AsyncAPI document')
      const model = getResolvedAsyncApiRef(getResolvedAsyncApiRef(loaded.components)?.schemas?.User)
      const first = await expand(store, model)
      expect(first).toStrictEqual({
        kind: 'source',
        format,
        value,
        resources: {
          origin: 'https://example.test/api.yaml',
          files: { 'https://example.test/types/user.proto': user },
        },
      })
      if (!isObject(model) || !('schema' in model)) throw new Error('Missing native schema')
      dependency = 'syntax="proto3"; message User { string updated=1; }'
      model.schema = value + '\n// Edited'
      expect(await expand(store, model)).toStrictEqual({
        kind: 'source',
        format,
        value: value + '\n// Edited',
        resources: {
          origin: 'https://example.test/api.yaml',
          files: { 'https://example.test/types/user.proto': dependency },
        },
      })
      expect(requested).toStrictEqual([
        'https://example.test/types/user.proto',
        'https://example.test/types/user.proto',
      ])
    },
  )
  it('retains shared downloads when lazy resolution metadata arrives', async () => {
    const requested: string[] = []
    const store = createWorkspaceStore({
      fetch: (input) => {
        requested.push(String(input))
        return Promise.resolve(new Response(user))
      },
    })
    await store.addDocument({ name: 'test', document: document(), documentSource: 'https://example.test/api.yaml' })
    const loaded = store.workspace.documents.test
    if (!loaded || !isAsyncApiDocument(loaded)) throw new Error('Missing AsyncAPI document')
    const model = getResolvedAsyncApiRef(getResolvedAsyncApiRef(loaded.components)?.schemas?.User)
    const resolver = store.asyncApiSchemaResources('test')
    await expand(store, model)
    Object.assign(model ?? {}, { '$ref-value': { type: 'object' }, $status: 'loading' })
    loaded['x-scalar-is-dirty'] = true
    expect(store.asyncApiSchemaResources('test')).toBe(resolver)
    await expand(store, model)
    expect(requested).toStrictEqual(['https://example.test/types/user.proto'])
  })

  it('uses the document-specific authenticated transport on expansion', async () => {
    const requested: string[] = []
    const store = createWorkspaceStore({ fetch: () => Promise.reject(new Error('Wrong transport')) })
    await store.addDocument({
      name: 'test',
      document: document(),
      documentSource: 'https://example.test/api.yaml',
      fetch: (input) => {
        requested.push(String(input))
        return Promise.resolve(new Response(user))
      },
    })
    expect(requested).toStrictEqual([])
    const loaded = store.workspace.documents.test
    if (!loaded || !isAsyncApiDocument(loaded)) throw new Error('Missing AsyncAPI document')
    await expand(store, getResolvedAsyncApiRef(loaded.components)?.schemas?.User)
    expect(requested).toStrictEqual(['https://example.test/types/user.proto'])
  })
  it.each([true, false])('retains portable native graphs across actual SSR chunks (reactive: %s)', async (reactive) => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'scalar-lazy-native-chunks-'))
    const origin = path.join(directory, 'api.json')
    try {
      await fs.mkdir(path.join(directory, 'types'))
      await fs.writeFile(origin, JSON.stringify(document()))
      await fs.writeFile(path.join(directory, 'types/user.proto'), user)
      const server = await createServerWorkspaceStore({
        mode: 'ssr',
        baseUrl: 'https://docs.example.test',
        documentLoading: { basePath: directory },
        documents: [{ name: 'test', path: origin }],
      })
      const requested: string[] = []
      const store = createWorkspaceStore({
        reactive,
        fetch: (input) => {
          requested.push(String(input))
          return Promise.resolve(new Response(JSON.stringify(server.get(String(input)))))
        },
      })
      await store.addDocument({ name: 'test', document: server.getWorkspace().documents.test! })
      store.update('x-scalar-active-document', 'test')
      const resolver = store.asyncApiSchemaResources('test')
      await store.resolve(['components', 'schemas', 'User'])
      const loaded = store.workspace.documents.test
      if (!loaded || !isAsyncApiDocument(loaded)) throw new Error('Missing AsyncAPI document')
      expect(store.asyncApiSchemaResources('test')).toBe(resolver)
      expect(await expand(store, getResolvedAsyncApiRef(loaded.components)?.schemas?.User)).toStrictEqual({
        kind: 'source',
        format,
        value,
        resources: { origin, files: { [path.join(directory, 'types/user.proto')]: user } },
      })
      await store.resolve(['channels', 'users'])
      expect(store.asyncApiSchemaResources('test')).toBe(resolver)
      expect(requested).toStrictEqual([
        'https://docs.example.test/test/asyncapi/models/User',
        'https://docs.example.test/test/asyncapi/channels/users',
      ])
      const model = getResolvedAsyncApiRef(getResolvedAsyncApiRef(loaded.components)?.schemas?.User)
      if (!isObject(model) || !('schema' in model)) throw new Error('Missing native schema')
      model.schema += '\n// Edited inside an external chunk'
      expect(store.asyncApiSchemaResources('test')).not.toBe(resolver)
    } finally {
      await fs.rm(directory, { recursive: true, force: true })
    }
  })
  it.each(['ingestion', 'hydration', 'chunk'] as const)(
    'invalidates a nonreactive prepared graph edited before first expansion (%s)',
    async (mode) => {
      const dependency = 'syntax="proto3"; message User { string current_id=1; }'
      const authored = document()
      const origin = 'https://example.test/api.yaml'
      Object.assign(authored.components.schemas.User, {
        'x-scalar-schema-resources': { origin, files: { 'https://example.test/types/user.proto': user } },
      })
      const requested: string[] = []
      const store = createWorkspaceStore({
        reactive: false,
        fetch: (input) => {
          requested.push(String(input))
          return Promise.resolve(
            new Response(
              String(input) === 'https://example.test/model.json'
                ? JSON.stringify(authored.components.schemas.User)
                : dependency,
            ),
          )
        },
      })
      if (mode === 'hydration') {
        const source = createWorkspaceStore({ reactive: false })
        await source.addDocument({ name: 'test', document: authored, documentSource: origin })
        store.loadWorkspace(source.exportWorkspace())
      } else {
        const input =
          mode === 'chunk'
            ? {
                ...authored,
                components: { schemas: { User: { $ref: 'https://example.test/model.json' } } },
                'x-scalar-navigation': { id: 'test', type: 'document', name: 'Native dependencies', children: [] },
              }
            : authored
        await store.addDocument({ name: 'test', document: input, documentSource: origin })
        if (mode === 'chunk') await store.resolve(['components', 'schemas', 'User'])
      }
      const loaded = store.workspace.documents.test
      if (!loaded || !isAsyncApiDocument(loaded)) throw new Error('Missing AsyncAPI document')
      const model = getResolvedAsyncApiRef(getResolvedAsyncApiRef(loaded.components)?.schemas?.User)
      if (!isObject(model) || !('schema' in model)) throw new Error('Missing native schema')
      model.schema = value + '\n// Edited before expansion'
      expect(await expand(store, model)).toStrictEqual({
        kind: 'source',
        format,
        value: value + '\n// Edited before expansion',
        resources: { origin, files: { 'https://example.test/types/user.proto': dependency } },
      })
      expect(requested).toStrictEqual([
        ...(mode === 'chunk' ? ['https://example.test/model.json'] : []),
        'https://example.test/types/user.proto',
      ])
    },
  )
  it.each([false, true])(
    'invalidates nonreactive legacy payloads after edits (inherited format: %s)',
    async (inherited) => {
      const requested: string[] = []
      let dependency = user
      const store = createWorkspaceStore({
        reactive: false,
        fetch: (input) => {
          requested.push(String(input))
          return Promise.resolve(new Response(dependency))
        },
      })
      await store.addDocument({
        name: 'test',
        documentSource: 'https://example.test/api.yaml',
        document: {
          asyncapi: '2.6.0',
          info: { title: 'Legacy native payload', version: '1' },
          channels: {
            users: {
              publish: {
                message: {
                  name: 'User',
                  payload: value,
                  ...(inherited ? { traits: [{ schemaFormat: format }] } : { schemaFormat: format }),
                },
              },
            },
          },
        },
      })
      const loaded = store.workspace.documents.test
      if (!loaded || !isAsyncApiDocument(loaded)) throw new Error('Missing AsyncAPI document')
      const message = getResolvedAsyncApiRef(getResolvedAsyncApiRef(loaded.channels?.users)?.messages?.User)
      const payload = getResolvedAsyncApiRef(message?.payload)
      if (!isObject(payload) || !('schema' in payload)) throw new Error('Missing native payload')
      await expand(store, payload)
      const resolver = store.asyncApiSchemaResources('test')
      dependency = 'syntax="proto3"; message User { string current_id=1; }'
      payload.schema = value + '\n// Edited legacy payload'
      expect(await expand(store, payload)).toStrictEqual({
        kind: 'source',
        format,
        value: value + '\n// Edited legacy payload',
        resources: {
          origin: 'https://example.test/api.yaml',
          files: { 'https://example.test/types/user.proto': dependency },
        },
      })
      expect(store.asyncApiSchemaResources('test')).not.toBe(resolver)
      expect(requested).toStrictEqual([
        'https://example.test/types/user.proto',
        'https://example.test/types/user.proto',
      ])
    },
  )
  it.each([true, false])(
    'preserves portable graphs after unrelated document edits (reactive: %s)',
    async (reactive) => {
      const requested: string[] = []
      const authored = document()
      const resources = { origin: '/private/api.yaml', files: { '/private/types/user.proto': user } }
      Object.assign(authored.components.schemas.User, { 'x-scalar-schema-resources': resources })
      const store = createWorkspaceStore({
        reactive,
        fetch: (input) => {
          requested.push(String(input))
          return Promise.reject(new Error('Must retain portable resources'))
        },
      })
      await store.addDocument({ name: 'test', document: authored })
      const loaded = store.workspace.documents.test
      if (!loaded || !isAsyncApiDocument(loaded)) throw new Error('Missing AsyncAPI document')
      const model = getResolvedAsyncApiRef(loaded.components)?.schemas?.User
      const resolver = store.asyncApiSchemaResources('test')
      const expected = { kind: 'source', format, value, resources }
      expect(await expand(store, model)).toStrictEqual(expected)
      loaded.info.title = 'Edited title'
      loaded.info.description = 'Edited description'
      expect(await expand(store, model)).toStrictEqual(expected)
      expect(store.asyncApiSchemaResources('test')).toBe(resolver)
      expect(requested).toStrictEqual([])
    },
  )
  it.each([true, false])(
    'tracks native edits under extension-like component names (reactive: %s)',
    async (reactive) => {
      let dependency = user
      const requested: string[] = []
      const store = createWorkspaceStore({
        reactive,
        fetch: (input) => {
          requested.push(String(input))
          return Promise.resolve(new Response(dependency))
        },
      })
      const authored = document()
      Object.assign(authored.components.schemas, { 'x-scalar-user': schema() })
      await store.addDocument({ name: 'test', document: authored, documentSource: 'https://example.test/api.yaml' })
      const loaded = store.workspace.documents.test
      if (!loaded || !isAsyncApiDocument(loaded)) throw new Error('Missing AsyncAPI document')
      const model = getResolvedAsyncApiRef(getResolvedAsyncApiRef(loaded.components)?.schemas?.['x-scalar-user'])
      if (!isObject(model) || !('schema' in model)) throw new Error('Missing native schema')
      await expand(store, model)
      dependency = 'syntax="proto3"; message User { string current_id=1; }'
      model.schema = value + '\n// Edited named schema'
      expect(await expand(store, model)).toStrictEqual({
        kind: 'source',
        format,
        value: value + '\n// Edited named schema',
        resources: {
          origin: 'https://example.test/api.yaml',
          files: { 'https://example.test/types/user.proto': dependency },
        },
      })
      expect(requested).toStrictEqual([
        'https://example.test/types/user.proto',
        'https://example.test/types/user.proto',
      ])
    },
  )

  it.each([true, false])('ignores schema-shaped literal extension edits (reactive: %s)', async (reactive) => {
    const authored = { ...document(), 'x-example': { schemaFormat: format, schema: 'sample' } }
    const resources = { origin: '/private/api.yaml', files: { '/private/types/user.proto': user } }
    Object.assign(authored.components.schemas.User, { 'x-scalar-schema-resources': resources })
    const requested: string[] = []
    const store = createWorkspaceStore({
      reactive,
      fetch: (input) => {
        requested.push(String(input))
        return Promise.reject(new Error('Must retain portable resources'))
      },
    })
    await store.addDocument({ name: 'test', document: authored })
    const loaded = store.workspace.documents.test
    if (!loaded || !isAsyncApiDocument(loaded)) throw new Error('Missing AsyncAPI document')
    const model = getResolvedAsyncApiRef(loaded.components)?.schemas?.User
    const resolver = store.asyncApiSchemaResources('test')
    const expected = { kind: 'source', format, value, resources }
    expect(await expand(store, model)).toStrictEqual(expected)
    if (!('x-example' in loaded)) throw new Error('Missing extension')
    const extension = loaded['x-example']
    if (!isObject(extension)) throw new Error('Missing extension')
    extension.schema = 'edited sample'
    expect(await expand(store, model)).toStrictEqual(expected)
    expect(store.asyncApiSchemaResources('test')).toBe(resolver)
    expect(requested).toStrictEqual([])
  })
  it.each([true, false])('invalidates overridden native sources after edits (reactive: %s)', async (reactive) => {
    let dependency = user
    const requested: string[] = []
    const overrides = { components: { schemas: { User: { description: 'Overridden native schema' } } } }
    Object.assign(overrides.components.schemas.User, { schema: value })
    const store = createWorkspaceStore({
      reactive,
      fetch: (input) => {
        requested.push(String(input))
        return Promise.resolve(new Response(dependency))
      },
    })
    await store.addDocument({
      name: 'test',
      document: document(),
      overrides,
      documentSource: 'https://example.test/api.yaml',
    })
    const loaded = store.workspace.documents.test
    if (!loaded || !isAsyncApiDocument(loaded)) throw new Error('Missing AsyncAPI document')
    const model = getResolvedAsyncApiRef(getResolvedAsyncApiRef(loaded.components)?.schemas?.User)
    if (!isObject(model) || !('schema' in model)) throw new Error('Missing native schema')
    await expand(store, model)
    dependency = 'syntax="proto3"; message User { string current_id=1; }'
    model.schema = value + '\n// Edited override'
    expect(await expand(store, model)).toStrictEqual({
      kind: 'source',
      format,
      value: value + '\n// Edited override',
      resources: {
        origin: 'https://example.test/api.yaml',
        files: { 'https://example.test/types/user.proto': dependency },
      },
    })
    expect(requested).toStrictEqual(['https://example.test/types/user.proto', 'https://example.test/types/user.proto'])
  })

  it.each([true, false])(
    'invalidates prepared graphs for initial source overrides (reactive: %s)',
    async (reactive) => {
      const authored = document()
      const origin = 'https://example.test/api.yaml'
      Object.assign(authored.components.schemas.User, {
        'x-scalar-schema-resources': { origin, files: { 'https://example.test/types/user.proto': user } },
      })
      const source = value.replace('types/user.proto', 'types/new.proto')
      const overrides = { components: { schemas: { User: { description: 'Overridden native schema' } } } }
      Object.assign(overrides.components.schemas.User, { schema: source })
      const requested: string[] = []
      const store = createWorkspaceStore({
        reactive,
        fetch: (input) => {
          requested.push(String(input))
          return Promise.resolve(new Response(user))
        },
      })
      await store.addDocument({ name: 'test', document: authored, overrides, documentSource: origin })
      const loaded = store.workspace.documents.test
      if (!loaded || !isAsyncApiDocument(loaded)) throw new Error('Missing AsyncAPI document')
      expect(await expand(store, getResolvedAsyncApiRef(loaded.components)?.schemas?.User)).toStrictEqual({
        kind: 'source',
        format,
        value: source,
        resources: { origin, files: { 'https://example.test/types/new.proto': user } },
      })
      expect(requested).toStrictEqual(['https://example.test/types/new.proto'])
    },
  )
  it.each([true, false])(
    'preserves portable graphs after metadata-only wrapper replacement (reactive: %s)',
    async (reactive) => {
      const authored = document()
      const resources = { origin: '/private/api.yaml', files: { '/private/types/user.proto': user } }
      Object.assign(authored.components.schemas.User, { 'x-scalar-schema-resources': resources })
      const requested: string[] = []
      const store = createWorkspaceStore({
        reactive,
        fetch: (input) => {
          requested.push(String(input))
          return Promise.reject(new Error('Must retain portable resources'))
        },
      })
      await store.addDocument({ name: 'test', document: authored })
      const loaded = store.workspace.documents.test
      if (!loaded || !isAsyncApiDocument(loaded)) throw new Error('Missing AsyncAPI document')
      const schemas = getResolvedAsyncApiRef(loaded.components)?.schemas
      if (!schemas) throw new Error('Missing schemas')
      const resolver = store.asyncApiSchemaResources('test')
      const expected = { kind: 'source', format, value, resources }
      expect(await expand(store, schemas.User)).toStrictEqual(expected)
      const original = getResolvedAsyncApiRef(schemas.User)
      if (!isObject(original)) throw new Error('Missing native schema')
      schemas.User = { ...original, description: 'Updated metadata' }
      expect(await expand(store, schemas.User)).toStrictEqual(expected)
      expect(store.asyncApiSchemaResources('test')).toBe(resolver)
      expect(requested).toStrictEqual([])
    },
  )
  it.each([true, false])(
    'invalidates prepared chunks with initial effective overrides (reactive: %s)',
    async (reactive) => {
      const origin = 'https://example.test/api.yaml'
      const source = value.replace('types/user.proto', 'types/new.proto')
      const chunk = {
        ...schema(),
        'x-scalar-schema-resources': { origin, files: { 'https://example.test/types/user.proto': user } },
      }
      const requested: string[] = []
      const overrides = { components: { schemas: { User: { description: 'Overridden chunk' } } } }
      Object.assign(overrides.components.schemas.User, { '$ref-value': { schema: source } })
      const store = createWorkspaceStore({
        reactive,
        fetch: (input) => {
          requested.push(String(input))
          return Promise.resolve(new Response(String(input).endsWith('model.json') ? JSON.stringify(chunk) : user))
        },
      })
      await store.addDocument({
        name: 'test',
        documentSource: origin,
        overrides,
        document: {
          asyncapi: '3.1.0',
          info: { title: 'Overridden chunk', version: '1' },
          components: { schemas: { User: { $ref: 'https://example.test/model.json' } } },
          'x-scalar-navigation': { id: 'test', type: 'document', name: 'Overridden chunk', children: [] },
        },
      })
      await store.resolve(['components', 'schemas', 'User'])
      const loaded = store.workspace.documents.test
      if (!loaded || !isAsyncApiDocument(loaded)) throw new Error('Missing AsyncAPI document')
      expect(await expand(store, getResolvedAsyncApiRef(loaded.components)?.schemas?.User)).toStrictEqual({
        kind: 'source',
        format,
        value: source,
        resources: { origin, files: { 'https://example.test/types/new.proto': user } },
      })
      expect(requested).toStrictEqual(['https://example.test/model.json', 'https://example.test/types/new.proto'])
    },
  )
})
