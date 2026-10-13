import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import { describe, expect, it } from 'vitest'

import { filterAsyncApiNavigation } from './filter-async-api-navigation'
import { getAsyncApiTagOptions } from './get-async-api-tag-options'

const document: AsyncApiDocument = {
  asyncapi: '3.0.0',
  info: { title: 'Mixed Protocol API', version: '1.0.0' },
  servers: {
    websocket: { host: 'api.example.com', protocol: 'wss' },
    mqtt: { host: 'mqtt.example.com', protocol: 'mqtt' },
  },
  channels: {
    mqttEvents: { address: 'sensors/{id}', servers: [{ $ref: '#/servers/mqtt' }] },
    wsChat: { address: '/chat', servers: [{ $ref: '#/servers/websocket' }] },
  },
  operations: {
    receiveSensor: { action: 'receive', channel: { $ref: '#/channels/mqttEvents' } },
    sendChat: { action: 'send', channel: { $ref: '#/channels/wsChat' } },
  },
} as unknown as AsyncApiDocument

/** Minimal sidebar tree: one channel per operation. */
const entries: TraversedEntry[] = [
  {
    type: 'asyncapi-channel',
    id: 'mqttEvents',
    title: 'mqttEvents',
    channelName: 'mqttEvents',
    channelAddress: 'sensors/{id}',
    children: [
      {
        type: 'asyncapi-operation',
        id: 'op-receiveSensor',
        title: 'receiveSensor',
        operationName: 'receiveSensor',
        action: 'receive',
        channelName: 'mqttEvents',
        channelAddress: 'sensors/{id}',
      },
    ],
  },
  {
    type: 'asyncapi-channel',
    id: 'wsChat',
    title: 'wsChat',
    channelName: 'wsChat',
    channelAddress: '/chat',
    children: [
      {
        type: 'asyncapi-operation',
        id: 'op-sendChat',
        title: 'sendChat',
        operationName: 'sendChat',
        action: 'send',
        channelName: 'wsChat',
        channelAddress: '/chat',
      },
    ],
  },
] as TraversedEntry[]

const channelIds = (result: TraversedEntry[]) => result.map((entry) => entry.id)

const taggedDocument = {
  'x-scalar-original-document-hash': 'tag-fixture',
  asyncapi: '3.1.0',
  info: { title: 'Commerce', version: '1', tags: [{ name: 'Application' }] },
  servers: {
    production: { host: 'prod.example.com', protocol: 'wss', tags: [{ name: 'Production' }] },
    development: { host: 'dev.example.com', protocol: 'mqtt', tags: [{ name: 'Development' }] },
  },
  channels: {
    events: {
      address: 'events',
      tags: [{ name: 'Channel' }],
      messages: {
        invoice: { tags: [{ name: 'Billing' }] },
        audit: { traits: [{ tags: [{ $ref: '#/components/tags/audit', '$ref-value': { name: 'Audit' } }] }] },
        hidden: { tags: [{ name: 'Hidden' }] },
      },
    },
    empty: { address: 'empty', tags: [{ name: 'Empty' }] },
  },
  operations: {
    publish: { action: 'send', channel: { $ref: '#/channels/events' }, traits: [{ tags: [{ name: 'Operation' }] }] },
    hidden: { action: 'receive', channel: { $ref: '#/channels/events' }, tags: [{ name: 'Hidden' }] },
  },
} satisfies AsyncApiDocument

const taggedEntries = [
  {
    type: 'asyncapi-channel',
    id: 'events',
    title: 'Events',
    channelName: 'events',
    channelAddress: 'events',
    children: [
      {
        type: 'asyncapi-operation',
        id: 'publish',
        title: 'Publish',
        operationName: 'publish',
        action: 'send',
        channelName: 'events',
        channelAddress: 'events',
        children: [
          { type: 'asyncapi-message', id: 'invoice', title: 'Invoice', channelName: 'events', messageName: 'invoice' },
          { type: 'asyncapi-message', id: 'audit', title: 'Audit', channelName: 'events', messageName: 'audit' },
        ],
      },
    ],
  },
  {
    type: 'asyncapi-channel',
    id: 'empty',
    title: 'Empty',
    channelName: 'empty',
    channelAddress: 'empty',
    children: [],
  },
] satisfies TraversedEntry[]

const tagIds = (tree: TraversedEntry[]): string[] =>
  tree.flatMap((entry) => [entry.id, ...('children' in entry ? tagIds(entry.children ?? []) : [])])

describe('filterAsyncApiNavigation', () => {
  it.each<{ children: TraversedEntry[] }>([
    { children: [] },
    {
      children: [
        { type: 'asyncapi-message', id: 'message', title: 'Event', channelName: 'mqttEvents', messageName: 'event' },
      ],
    },
  ])('filters channels without operations by server and protocol with children %j', ({ children }) => {
    const channels = entries.map((entry) => ({
      ...entry,
      children: children.map((child) =>
        child.type === 'asyncapi-message' && entry.type === 'asyncapi-channel'
          ? { ...child, channelName: entry.channelName }
          : child,
      ),
    }))
    expect(channelIds(filterAsyncApiNavigation(channels, document, { protocol: 'mqtt' }))).toStrictEqual(['mqttEvents'])
    expect(channelIds(filterAsyncApiNavigation(channels, document, { server: 'websocket' }))).toStrictEqual(['wsChat'])
    expect(filterAsyncApiNavigation(channels, document, { protocol: 'mqtt', server: 'websocket' })).toStrictEqual([])
    expect(filterAsyncApiNavigation(channels, document, {})).toBe(channels)
  })

  it.each([undefined, []])('keeps operationless channels available on all servers with server list %j', (servers) => {
    const channels = entries.map((entry) => ({ ...entry, children: [] }))
    const allServers = {
      ...document,
      channels: { mqttEvents: { servers }, wsChat: { servers } },
    } satisfies AsyncApiDocument
    expect(
      channelIds(filterAsyncApiNavigation(channels, allServers, { server: 'websocket', protocol: 'wss' })),
    ).toStrictEqual(['mqttEvents', 'wsChat'])
  })

  it('drops a tag when none of its operationless channels match', () => {
    const tag: TraversedEntry = {
      type: 'tag',
      id: 'tag',
      title: 'Events',
      name: 'Events',
      isGroup: false,
      isWebhooks: false,
      children: [{ ...entries[0], children: [] } as TraversedEntry],
    }
    expect(filterAsyncApiNavigation([tag], document, { server: 'websocket' })).toStrictEqual([])
  })

  it('returns the original tree when no filter is selected', () => {
    expect(filterAsyncApiNavigation(entries, document, {})).toBe(entries)
    expect(filterAsyncApiNavigation(entries, document, { protocol: 'all', server: 'all' })).toBe(entries)
  })

  it('drops channels whose only operation does not match the protocol', () => {
    const result = filterAsyncApiNavigation(entries, document, { protocol: 'mqtt' })
    expect(channelIds(result)).toEqual(['mqttEvents'])
  })

  it('drops channels whose only operation is not reachable through the server', () => {
    const result = filterAsyncApiNavigation(entries, document, { server: 'websocket' })
    expect(channelIds(result)).toEqual(['wsChat'])
  })

  it('applies protocol and server filters together', () => {
    const result = filterAsyncApiNavigation(entries, document, { protocol: 'mqtt', server: 'mqtt' })
    expect(channelIds(result)).toEqual(['mqttEvents'])
  })

  it.each([
    { filter: { protocol: 'mqtt' }, expected: ['mqttEvents'] },
    { filter: { server: 'websocket' }, expected: ['wsChat'] },
    { filter: { protocol: 'mqtt', server: 'websocket' }, expected: [] },
  ])('filters message-only catalogs through their channel servers: $filter', ({ filter, expected }) => {
    const catalogEntries: TraversedEntry[] = entries.map((entry) => {
      if (entry.type !== 'asyncapi-channel') {
        throw new Error('Expected a channel fixture')
      }
      return {
        ...entry,
        children: [
          {
            type: 'asyncapi-message',
            id: `${entry.id}/message/event`,
            title: 'Event',
            channelName: entry.channelName,
            messageName: 'event',
          },
        ],
      }
    })
    const result = filterAsyncApiNavigation(catalogEntries, { ...document, operations: undefined }, filter)
    expect(channelIds(result)).toStrictEqual(expected)
    expect(result).toStrictEqual(catalogEntries.filter((entry) => expected.some((id) => id === entry.id)))
  })

  it('does not let catalog messages retain a channel whose operations are filtered out', () => {
    const catalogEntries: TraversedEntry[] = entries.map((entry) => {
      if (entry.type !== 'asyncapi-channel') {
        throw new Error('Expected a channel fixture')
      }
      return {
        ...entry,
        children: [
          ...(entry.children ?? []),
          {
            type: 'asyncapi-message',
            id: `${entry.id}/message/event`,
            title: 'Event',
            channelName: entry.channelName,
            messageName: 'event',
          },
        ],
      }
    })
    expect(filterAsyncApiNavigation(catalogEntries, document, { protocol: 'mqtt' })).toStrictEqual([catalogEntries[0]])
  })

  it('keeps unpinned channel catalogs reachable on every server and removes empty tag groups', () => {
    const unpinned = { ...document, channels: { wsChat: { address: '/chat' } }, operations: undefined }
    const sourceChannel = entries[1]
    if (sourceChannel?.type !== 'asyncapi-channel') {
      throw new Error('Expected a channel fixture')
    }
    const channel = {
      ...sourceChannel,
      children: [
        { type: 'asyncapi-message', id: 'event', title: 'Event', channelName: 'wsChat', messageName: 'event' },
      ],
    } satisfies TraversedEntry
    const tag = {
      type: 'tag',
      isGroup: false,
      id: 'tag',
      title: 'Events',
      name: 'Events',
      children: [channel],
    } satisfies TraversedEntry
    expect(filterAsyncApiNavigation([tag], unpinned, { protocol: 'mqtt', server: 'mqtt' })).toStrictEqual([tag])
    expect(filterAsyncApiNavigation([tag], document, { protocol: 'mqtt' })).toStrictEqual([])
  })

  it('keeps the operation and channel around a matching inherited message tag', () => {
    expect(tagIds(filterAsyncApiNavigation(taggedEntries, taggedDocument, { tag: 'Audit' }))).toStrictEqual([
      'events',
      'publish',
      'audit',
    ])
    expect(tagIds(taggedEntries)).toStrictEqual(['events', 'publish', 'invoice', 'audit', 'empty'])
  })

  it.each(['Operation', 'Channel'])('keeps a matching %s and all its messages', (tag) => {
    expect(tagIds(filterAsyncApiNavigation(taggedEntries, taggedDocument, { tag }))).toStrictEqual([
      'events',
      'publish',
      'invoice',
      'audit',
    ])
  })

  it.each(['Application', 'Production'])('keeps the taggedDocument content for a matching %s tag', (tag) => {
    expect(tagIds(filterAsyncApiNavigation(taggedEntries, taggedDocument, { tag }))).toStrictEqual(
      tagIds(taggedEntries),
    )
  })

  it('filters empty channels by their own tags', () => {
    expect(tagIds(filterAsyncApiNavigation(taggedEntries, taggedDocument, { tag: 'Empty' }))).toStrictEqual(['empty'])
  })

  it('combines server tags with the selected server and protocol', () => {
    expect(
      filterAsyncApiNavigation(taggedEntries, taggedDocument, { tag: 'Production', server: 'development' }),
    ).toStrictEqual([])
    expect(
      filterAsyncApiNavigation(taggedEntries, taggedDocument, { tag: 'Production', protocol: 'mqtt' }),
    ).toStrictEqual([])
    expect(
      tagIds(
        filterAsyncApiNavigation(taggedEntries, taggedDocument, {
          tag: 'Production',
          server: 'production',
          protocol: 'wss',
        }),
      ),
    ).toStrictEqual(tagIds(taggedEntries))
  })

  it('does not match tags on servers outside a channel’s reachability', () => {
    const restricted = {
      ...taggedDocument,
      channels: { events: { ...taggedDocument.channels.events, servers: [{ $ref: '#/servers/development' }] } },
    } satisfies AsyncApiDocument
    expect(tagIds(filterAsyncApiNavigation([taggedEntries[0]!], restricted, { tag: 'Production' }))).toStrictEqual([])
  })

  it('uses explicit operation tags instead of inherited tags', () => {
    const overridden = {
      ...taggedDocument,
      operations: { publish: { ...taggedDocument.operations.publish, tags: [] } },
    } satisfies AsyncApiDocument
    expect(filterAsyncApiNavigation(taggedEntries, overridden, { tag: 'Operation' })).toStrictEqual([])
  })

  it('filters messages directly under a channel', () => {
    const catalog = [
      { ...taggedEntries[0]!, children: taggedEntries[0]!.children[0]!.children },
    ] satisfies TraversedEntry[]
    expect(tagIds(filterAsyncApiNavigation(catalog, taggedDocument, { tag: 'Audit' }))).toStrictEqual([
      'events',
      'audit',
    ])
  })

  it('offers inherited tags without leaking tags from taggedEntries absent from navigation', () => {
    expect(getAsyncApiTagOptions(taggedDocument, taggedEntries).map((option) => option.id)).toStrictEqual([
      '',
      'Application',
      'Audit',
      'Billing',
      'Channel',
      'Development',
      'Empty',
      'Operation',
      'Production',
    ])
  })

  it('preserves the original tree when cleared and removes unmatched channels', () => {
    expect(filterAsyncApiNavigation(taggedEntries, taggedDocument, { tag: '' })).toBe(taggedEntries)
    expect(filterAsyncApiNavigation(taggedEntries, taggedDocument, { tag: 'Unknown' })).toStrictEqual([])
  })
})
