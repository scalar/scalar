import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { describe, expect, it } from 'vitest'

import type { NavigationOptions } from '@/navigation/get-navigation-options'
import type {
  TraversedAsyncApiChannel,
  TraversedAsyncApiMessage,
  TraversedAsyncApiOperation,
  TraversedEntry,
} from '@/schemas/navigation'

import { traverseAsyncApiDocument } from './traverse-asyncapi-document'

const mockOptions: NavigationOptions = {
  operationsSorter: 'alpha',
  tagsSorter: 'alpha',
}

const galaxyAsyncApiDocument = {
  asyncapi: '3.0.0',
  info: { title: 'Scalar Galaxy Events', version: '1.0.0' },
  'x-scalar-original-document-hash': 'galaxy-fixture',
  channels: {
    planetEvents: {
      address: 'planets/{planetId}/events',
      messages: {
        planetCreated: { title: 'Planet Created' },
        planetUpdated: { title: 'Planet Updated' },
      },
    },
    userEvents: {
      address: 'users/{userId}/events',
    },
    systemEvents: {
      address: 'system/events',
    },
    celestialBodyEvents: {
      address: 'celestial-bodies/{bodyId}/events',
    },
  },
  operations: {
    subscribeToPlanetEvents: {
      action: 'receive',
      channel: { $ref: '#/channels/planetEvents' },
      title: 'Subscribe to Planet Events',
    },
    subscribeToUserEvents: {
      action: 'receive',
      channel: { $ref: '#/channels/userEvents' },
      title: 'Subscribe to User Events',
    },
    subscribeToSystemEvents: {
      action: 'receive',
      channel: { $ref: '#/channels/systemEvents' },
      title: 'Subscribe to System Events',
    },
    subscribeToCelestialBodyEvents: {
      action: 'receive',
      channel: { $ref: '#/channels/celestialBodyEvents' },
      title: 'Subscribe to Celestial Body Events',
    },
  },
} as unknown as AsyncApiDocument

const chatAsyncApiDocument = {
  asyncapi: '3.0.0',
  info: { title: 'Simple Chat WebSocket API', version: '1.0.0' },
  'x-scalar-original-document-hash': 'chat-fixture',
  channels: {
    chat: {
      address: '/chat',
      messages: {
        chatMessage: { title: 'Chat Message' },
      },
    },
  },
  operations: {
    sendChatMessage: {
      action: 'send',
      channel: { $ref: '#/channels/chat' },
      title: 'Send a chat message',
    },
    receiveChatMessage: {
      action: 'receive',
      channel: { $ref: '#/channels/chat' },
      title: 'Receive a chat message',
    },
  },
} as unknown as AsyncApiDocument

const collectEntries = <Entry extends TraversedEntry>(
  children: TraversedEntry[] | undefined,
  type: Entry['type'],
): Entry[] => {
  if (!children) {
    return []
  }

  return children.flatMap((entry) => {
    if (entry.type === type) {
      return [entry as Entry]
    }

    if (entry.type === 'tag' && entry.children) {
      return collectEntries(entry.children, type)
    }

    if (entry.type === 'asyncapi-channel' && entry.children && type !== 'asyncapi-channel') {
      return collectEntries(entry.children, type)
    }

    if (entry.type === 'asyncapi-operation' && entry.children) {
      return collectEntries(entry.children, type)
    }

    return []
  })
}

const collectAsyncApiChannels = (children: TraversedEntry[] | undefined): TraversedAsyncApiChannel[] =>
  collectEntries(children, 'asyncapi-channel')

const collectAsyncApiOperations = (children: TraversedEntry[] | undefined): TraversedAsyncApiOperation[] =>
  collectEntries(children, 'asyncapi-operation')

const collectAsyncApiMessages = (children: TraversedEntry[] | undefined): TraversedAsyncApiMessage[] =>
  collectEntries(children, 'asyncapi-message')

describe('traverseAsyncApiDocument', () => {
  it('emits only the default Introduction entry when there are no operations or description', () => {
    const document = {
      asyncapi: '3.0.0',
      info: { title: 'Streetlights API', version: '1.0.0' },
      'x-scalar-original-document-hash': 'streetlights-fixture',
    } as unknown as AsyncApiDocument

    const result = traverseAsyncApiDocument('streetlights', document, mockOptions)

    expect(result).toMatchObject({
      id: 'streetlights',
      type: 'document',
      title: 'Streetlights API',
      name: 'streetlights',
      children: [{ type: 'text', title: 'Introduction' }],
    })
  })

  it('extracts headings from info.description as children of Introduction', () => {
    const document = {
      asyncapi: '3.0.0',
      info: {
        title: 'Streetlights API',
        version: '1.0.0',
        description:
          'Some leading text.\n\n## Event-Driven Features\n\n- bullet a\n- bullet b\n\n## Resources\n\n- link a\n',
      },
      'x-scalar-original-document-hash': 'streetlights-fixture',
    } as unknown as AsyncApiDocument

    const result = traverseAsyncApiDocument('streetlights', document, mockOptions)
    const intro = result.children?.[0]

    expect(intro).toMatchObject({ type: 'text', title: 'Introduction' })
    expect('children' in (intro ?? {}) ? (intro as { children?: unknown }).children : undefined).toEqual([
      { id: expect.any(String), title: 'Event-Driven Features', type: 'text', children: [] },
      { id: expect.any(String), title: 'Resources', type: 'text', children: [] },
    ])
  })

  it('lists Galaxy channels with operations and nests messages under operations', () => {
    const result = traverseAsyncApiDocument('galaxy', galaxyAsyncApiDocument, mockOptions)
    const channels = collectAsyncApiChannels(result.children)
    const operations = collectAsyncApiOperations(result.children)
    const messages = collectAsyncApiMessages(result.children)

    expect(channels).toHaveLength(4)
    expect(operations).toHaveLength(4)
    expect(messages).toHaveLength(2)

    const planetEventsChannel = channels.find((channel) => channel.channelName === 'planetEvents')
    const planetOperation = planetEventsChannel?.children?.find(
      (child): child is TraversedAsyncApiOperation => child.type === 'asyncapi-operation',
    )

    expect(planetEventsChannel).toMatchObject({
      type: 'asyncapi-channel',
      channelName: 'planetEvents',
      channelAddress: 'planets/{planetId}/events',
      children: [
        expect.objectContaining({
          type: 'asyncapi-operation',
          operationName: 'subscribeToPlanetEvents',
          action: 'receive',
          title: 'Subscribe to Planet Events',
        }),
      ],
    })

    expect(planetOperation?.children).toEqual([
      expect.objectContaining({
        type: 'asyncapi-message',
        messageName: 'planetCreated',
        title: 'Planet Created',
      }),
      expect.objectContaining({
        type: 'asyncapi-message',
        messageName: 'planetUpdated',
        title: 'Planet Updated',
      }),
    ])
  })

  it('nests messages under each chat operation on a shared channel', () => {
    const result = traverseAsyncApiDocument('chatapp', chatAsyncApiDocument, mockOptions)
    const channels = collectAsyncApiChannels(result.children)
    const operations = collectAsyncApiOperations(result.children)

    expect(channels).toEqual([
      expect.objectContaining({
        type: 'asyncapi-channel',
        channelName: 'chat',
        channelAddress: '/chat',
        children: [
          expect.objectContaining({
            type: 'asyncapi-operation',
            operationName: 'receiveChatMessage',
            action: 'receive',
            title: 'Receive a chat message',
            children: [
              expect.objectContaining({
                type: 'asyncapi-message',
                messageName: 'chatMessage',
                title: 'Chat Message',
              }),
            ],
          }),
          expect.objectContaining({
            operationName: 'sendChatMessage',
            action: 'send',
            title: 'Send a chat message',
            children: [
              expect.objectContaining({
                type: 'asyncapi-message',
                messageName: 'chatMessage',
              }),
            ],
          }),
        ],
      }),
    ])

    expect(operations).toEqual([
      expect.objectContaining({ operationName: 'receiveChatMessage' }),
      expect.objectContaining({ operationName: 'sendChatMessage' }),
    ])
  })

  it('respects operation.messages when filtering nested messages', () => {
    const document = {
      asyncapi: '3.0.0',
      info: { title: 'Filtered Messages API', version: '1.0.0' },
      'x-scalar-original-document-hash': 'filtered-messages-fixture',
      channels: {
        events: {
          address: '/events',
          messages: {
            eventA: { title: 'Event A' },
            eventB: { title: 'Event B' },
          },
        },
      },
      operations: {
        listen: {
          action: 'receive',
          channel: { $ref: '#/channels/events' },
          title: 'Listen',
          messages: [{ $ref: '#/channels/events/messages/eventA' }],
        },
      },
    } as unknown as AsyncApiDocument

    const result = traverseAsyncApiDocument('filtered', document, mockOptions)
    const operation = collectAsyncApiOperations(result.children)[0]

    expect(operation?.children).toEqual([
      expect.objectContaining({
        type: 'asyncapi-message',
        messageName: 'eventA',
        title: 'Event A',
      }),
    ])
  })

  it('ignores operation-level tags and keeps the channel at the document root', () => {
    const document = {
      asyncapi: '3.0.0',
      info: { title: 'Tagged API', version: '1.0.0' },
      'x-scalar-original-document-hash': 'tagged-fixture',
      channels: {
        events: { address: '/events' },
      },
      operations: {
        listen: {
          action: 'receive',
          channel: { $ref: '#/channels/events' },
          title: 'Listen',
          tags: [{ name: 'Realtime' }],
        },
      },
    } as unknown as AsyncApiDocument

    const result = traverseAsyncApiDocument('tagged', document, mockOptions)

    expect(result.children).toEqual([
      expect.objectContaining({ type: 'text', title: 'Introduction' }),
      expect.objectContaining({
        type: 'asyncapi-channel',
        channelName: 'events',
        channelAddress: '/events',
        children: [
          expect.objectContaining({
            type: 'asyncapi-operation',
            operationName: 'listen',
          }),
        ],
      }),
    ])
  })

  it('groups channels under tags when the channel itself is tagged', () => {
    const document = {
      asyncapi: '3.0.0',
      info: { title: 'Channel Tagged API', version: '1.0.0' },
      'x-scalar-original-document-hash': 'channel-tagged-fixture',
      channels: {
        events: {
          address: '/events',
          tags: [{ name: 'Realtime' }],
        },
      },
      operations: {
        listen: {
          action: 'receive',
          channel: { $ref: '#/channels/events' },
          title: 'Listen',
        },
      },
    } as unknown as AsyncApiDocument

    const result = traverseAsyncApiDocument('tagged', document, mockOptions)

    const tag = result.children?.find((entry) => entry.type === 'tag' && entry.name === 'Realtime')

    expect(tag).toMatchObject({
      type: 'tag',
      name: 'Realtime',
      children: [
        expect.objectContaining({
          type: 'asyncapi-channel',
          channelName: 'events',
          channelAddress: '/events',
          children: [
            expect.objectContaining({
              type: 'asyncapi-operation',
              operationName: 'listen',
            }),
          ],
        }),
      ],
    })
  })
})
