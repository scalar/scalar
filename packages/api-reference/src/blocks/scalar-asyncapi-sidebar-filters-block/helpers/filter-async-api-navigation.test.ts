import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import { describe, expect, it } from 'vitest'

import { filterAsyncApiNavigation } from './filter-async-api-navigation'

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
})
