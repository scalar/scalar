import fs from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { getValueAtPath } from '@scalar/helpers/object/get-value-at-path'
import { assert, describe, expect, it } from 'vitest'

import { createWorkspaceStore } from '@/client'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import type { TraversedDocument } from '@/schemas/navigation'
import { isAsyncApiDocument } from '@/schemas/type-guards'
import { createServerWorkspaceStore } from '@/server'

const fixture = () => ({
  asyncapi: '3.0.0',
  info: { title: 'Events', version: '1' },
  servers: { production: { host: 'broker.example.com', protocol: 'kafka' } },
  channels: {
    selected: { address: 'selected', messages: { event: { $ref: '#/components/messages/Event' } } },
    unrelated: { address: 'unrelated', messages: { other: { $ref: '#/components/messages/Other' } } },
  },
  operations: {
    send: { action: 'send', channel: { $ref: '#/channels/selected' } },
    receive: { action: 'receive', channel: { $ref: '#/channels/selected' } },
    unrelated: { action: 'receive', channel: { $ref: '#/channels/unrelated' } },
  },
  components: {
    messages: {
      Event: { title: 'Shared event', payload: { $ref: '#/components/schemas/Node' } },
      Other: { title: 'Other event', payload: { type: 'string' } },
    },
    schemas: { Node: { type: 'object', properties: { next: { $ref: '#/components/schemas/Node' } } } },
    securitySchemes: { token: { type: 'userPassword' } },
  },
})

describe('asyncapi-chunks', () => {
  it('loads channel-only navigation and referenced message payloads without fetching operations', async () => {
    const server = await createServerWorkspaceStore({
      mode: 'ssr',
      baseUrl: 'https://example.com',
      documents: [{ name: 'events', document: { ...fixture(), operations: undefined } }],
    })
    const requests: string[] = []
    const client = createWorkspaceStore({
      fetch: async (url) => {
        requests.push(String(url))
        return new Response(JSON.stringify(await server.get(String(url))), {
          headers: { 'Content-Type': 'application/json' },
        })
      },
    })
    await client.addDocument({ name: 'events', document: server.getWorkspace().documents.events! })
    client.update('x-scalar-active-document', 'events')
    await client.resolve(['x-scalar-navigation'])
    const document = client.workspace.activeDocument
    assert(isAsyncApiDocument(document))
    const navigation: TraversedDocument | undefined = document['x-scalar-navigation']
    const channels = navigation?.children?.filter((entry) => entry.type === 'asyncapi-channel')
    expect(channels?.map((entry) => entry.channelName)).toStrictEqual(['selected', 'unrelated'])
    expect(channels?.[0]?.children?.map((entry) => entry.type)).toStrictEqual(['asyncapi-message'])
    await client.resolve(['channels', 'selected'])
    const channel = getResolvedRef(document.channels?.selected)
    expect(getResolvedRef(channel?.messages?.event)?.title).toBe('Shared event')
    expect(getValueAtPath(getResolvedRef(getResolvedRef(document.components)?.schemas?.Node), ['type'])).toBe('object')
    expect(requests.filter((url) => url.includes('/operations/'))).toStrictEqual([])
  })

  it.each(['user:created', 'a/b~c', 'literal%2F?#'])(
    'resolves SSR chunks with reserved characters in %s',
    async (name) => {
      const server = await createServerWorkspaceStore({
        mode: 'ssr',
        baseUrl: 'https://example.com',
        documents: [
          {
            name: 'events',
            document: {
              asyncapi: '3.0.0',
              info: { title: 'Events', version: '1' },
              channels: { [name]: { address: 'selected' } },
              components: { schemas: { [name]: { type: 'object' } } },
            },
          },
        ],
      })
      const sparse = server.getWorkspace().documents.events
      const channelRef = getValueAtPath(sparse, ['channels', name, '$ref'])
      assert(typeof channelRef === 'string')
      expect(server.get(channelRef)).toMatchObject({ address: 'selected' })
      const client = createWorkspaceStore({
        fetch: (url) =>
          Promise.resolve(
            new Response(JSON.stringify(server.get(String(url))), { headers: { 'Content-Type': 'application/json' } }),
          ),
      })
      await client.addDocument({ name: 'events', document: sparse! })
      client.update('x-scalar-active-document', 'events')
      await client.resolve(['channels', name])
      await client.resolve(['components', 'schemas', name])
      const document = client.workspace.activeDocument
      assert(isAsyncApiDocument(document))
      expect(getResolvedRef(document.channels?.[name])?.address).toBe('selected')
      expect(getResolvedRef(getResolvedRef(document.components)?.schemas?.[name])).toMatchObject({ type: 'object' })
    },
  )
  it('loads only selected channel dependencies and retains recursive references', async ({ onTestFinished }) => {
    const directory = await fs.mkdtemp(join(tmpdir(), 'asyncapi-chunks-'))
    onTestFinished(() => fs.rm(directory, { recursive: true, force: true }))
    const server = await createServerWorkspaceStore({
      mode: 'static',
      directory,
      compact: true,
      documents: [{ name: 'events', document: fixture() }],
    })
    await server.generateWorkspaceChunks()
    const sparse = server.getWorkspace().documents.events
    await fs.writeFile(join(directory, 'events.json'), JSON.stringify(sparse))
    const requests: string[] = []
    const client = createWorkspaceStore({
      fetch: async (url) => {
        const path = new URL(String(url)).pathname.slice(1)
        requests.push(path)
        return new Response(await fs.readFile(join(directory, path), 'utf8'), {
          headers: { 'Content-Type': 'application/json' },
        })
      },
    })
    await client.addDocument({ name: 'events', url: 'https://example.com/events.json' })
    client.update('x-scalar-active-document', 'events')
    expect(requests).toEqual(['events.json'])
    const document = client.workspace.activeDocument
    assert(isAsyncApiDocument(document))
    expect(document.servers).toEqual(fixture().servers)
    expect(getResolvedRef(document.components)?.securitySchemes).toEqual(fixture().components.securitySchemes)
    await client.resolve(['x-scalar-navigation'])
    expect(document['x-scalar-navigation']?.children.length).toBeGreaterThan(0)
    await client.resolve(['channels', 'selected'])
    await client.resolve(['operations', 'send'])
    await client.resolve(['operations', 'receive'])
    expect(getResolvedRef(document.channels?.selected)?.address).toBe('selected')
    expect(getResolvedRef(document.operations?.receive)?.action).toBe('receive')
    const message = getResolvedRef(getResolvedRef(document.components)?.messages?.Event)
    expect(message?.title).toBe('Shared event')
    const schema = getResolvedRef(getResolvedRef(document.components)?.schemas?.Node)
    expect(schema).toMatchObject({ type: 'object' })
    expect(getResolvedRef(getValueAtPath(schema, ['properties', 'next']))).toBe(schema)
    expect([...requests].sort()).toEqual(
      [
        'events.json',
        'chunks/events/navigation.json',
        'chunks/events/asyncapi/channels/selected.json',
        'chunks/events/asyncapi/components-messages/group-0.json',
        'chunks/events/asyncapi/components-schemas/group-0.json',
        'chunks/events/asyncapi/operations/send.json',
        'chunks/events/asyncapi/operations/receive.json',
      ].sort(),
    )
    const before = requests.length
    await client.resolve(['channels', 'selected'])
    expect(requests.length).toBe(before)
    expect(server.getResolvedDocument('events')).toMatchObject({ channels: { selected: { address: 'selected' } } })
  })
  it('loads updated shared dependencies after replacing a published document', async () => {
    const source = fixture()
    const first = await createServerWorkspaceStore({
      mode: 'ssr',
      baseUrl: 'https://example.com/v1',
      compact: true,
      documents: [{ name: 'events', document: source }],
    })
    const updated = fixture()
    updated.components.messages.Event.title = 'Updated event'
    const second = await createServerWorkspaceStore({
      mode: 'ssr',
      baseUrl: 'https://example.com/v2',
      compact: true,
      documents: [{ name: 'events', document: updated }],
    })
    const client = createWorkspaceStore({
      fetch: (url) => {
        const path = new URL(String(url)).pathname
        const server = path.startsWith('/v1/') ? first : second
        return Promise.resolve(
          new Response(JSON.stringify(server.get(path.slice(3))), { headers: { 'Content-Type': 'application/json' } }),
        )
      },
    })
    for (const [server, title] of [
      [first, 'Shared event'],
      [second, 'Updated event'],
    ] as const) {
      await client.addDocument({ name: 'events', document: server.getWorkspace().documents.events! })
      client.update('x-scalar-active-document', 'events')
      await client.resolve(['channels', 'selected'])
      const document = client.workspace.activeDocument
      assert(isAsyncApiDocument(document))
      expect(getResolvedRef(getResolvedRef(document.components)?.messages?.Event)?.title).toBe(title)
    }
  })
  it('loads a direct model without the siblings grouped for a channel', async () => {
    const source = fixture()
    const document = {
      ...source,
      components: {
        ...source.components,
        messages: {
          Event: {
            title: 'Shared event',
            payload: { allOf: [{ $ref: '#/components/schemas/Node' }, { $ref: '#/components/schemas/Sibling' }] },
          },
        },
        schemas: { ...source.components.schemas, Sibling: { type: 'string' } },
      },
    }
    const server = await createServerWorkspaceStore({
      mode: 'ssr',
      baseUrl: 'https://example.com',
      compact: true,
      documents: [{ name: 'events', document }],
    })
    const requests: string[] = []
    const client = createWorkspaceStore({
      fetch: (url) => {
        const path = new URL(String(url)).pathname
        requests.push(path)
        return Promise.resolve(
          new Response(JSON.stringify(server.get(path)), { headers: { 'Content-Type': 'application/json' } }),
        )
      },
    })
    await client.addDocument({ name: 'events', document: server.getWorkspace().documents.events! })
    client.update('x-scalar-active-document', 'events')
    await client.resolve(['components', 'schemas', 'Node'])
    expect(requests).toEqual(['/events/asyncapi/models/Node'])
    const active = client.workspace.activeDocument
    assert(isAsyncApiDocument(active))
    expect(getResolvedRef(getResolvedRef(active.components)?.schemas?.Node)).toMatchObject({ type: 'object' })
    expect(getResolvedRef(getResolvedRef(active.components)?.schemas?.Sibling)).toBeUndefined()
  })
})
