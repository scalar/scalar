import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { describe, expect, it } from 'vitest'

import type { NavigationOptions } from '@/navigation/get-navigation-options'
import type { TraversedAsyncApiOperation, TraversedEntry } from '@/schemas/navigation'

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

const collectAsyncApiOperations = (children: TraversedEntry[] | undefined): TraversedAsyncApiOperation[] => {
  if (!children) {
    return []
  }

  return children.flatMap((entry) => {
    if (entry.type === 'asyncapi-operation') {
      return [entry]
    }

    if (entry.type === 'tag' && entry.children) {
      return collectAsyncApiOperations(entry.children)
    }

    return []
  })
}

describe('traverseAsyncApiDocument', () => {
  it('returns an empty document when there are no operations', () => {
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
      children: [],
    })
  })

  it('lists Galaxy subscribe operations with channel metadata', () => {
    const result = traverseAsyncApiDocument('galaxy', galaxyAsyncApiDocument, mockOptions)
    const operations = collectAsyncApiOperations(result.children)

    expect(operations).toHaveLength(4)
    expect(operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'asyncapi-operation',
          operationName: 'subscribeToPlanetEvents',
          action: 'receive',
          channelName: 'planetEvents',
          channelAddress: 'planets/{planetId}/events',
          title: 'Subscribe to Planet Events',
        }),
        expect.objectContaining({
          operationName: 'subscribeToCelestialBodyEvents',
          channelAddress: 'celestial-bodies/{bodyId}/events',
        }),
      ]),
    )
  })

  it('lists chat send and receive operations', () => {
    const result = traverseAsyncApiDocument('chatapp', chatAsyncApiDocument, mockOptions)
    const operations = collectAsyncApiOperations(result.children)

    expect(operations).toEqual([
      expect.objectContaining({
        type: 'asyncapi-operation',
        operationName: 'receiveChatMessage',
        action: 'receive',
        channelName: 'chat',
        channelAddress: '/chat',
        title: 'Receive a chat message',
      }),
      expect.objectContaining({
        operationName: 'sendChatMessage',
        action: 'send',
        title: 'Send a chat message',
      }),
    ])
  })

  it('groups operations under tags when present', () => {
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
      expect.objectContaining({
        type: 'tag',
        name: 'Realtime',
        children: [
          expect.objectContaining({
            type: 'asyncapi-operation',
            operationName: 'listen',
            id: 'tagged/tag/realtime/asyncapi-operation/listen',
          }),
        ],
      }),
    ])
  })
})
