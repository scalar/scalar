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
  it.each([undefined, []])('keeps channels with no operations and their visible messages with tags %j', (tags) => {
    const document = {
      asyncapi: '3.1.0',
      info: { title: 'Events', version: '1' },
      channels: {
        events: {
          address: 'events',
          tags,
          messages: {
            z: { title: 'Zebra' },
            a: { title: 'Apple' },
            hidden: { title: 'Hidden', 'x-internal': true },
            ignored: { title: 'Ignored', 'x-scalar-ignore': true },
          },
        },
        empty: {},
        hidden: { 'x-internal': true },
        ignored: { 'x-scalar-ignore': true },
      },
    } as unknown as AsyncApiDocument
    const result = traverseAsyncApiDocument('events', document)
    const channels = collectAsyncApiChannels(result.children)
    expect(channels.map((channel) => channel.channelName)).toStrictEqual(['events', 'empty'])
    expect(channels[0]?.children).toStrictEqual([
      {
        type: 'asyncapi-message',
        id: 'events/channel/events/message/a',
        title: 'Apple',
        messageName: 'a',
        channelName: 'events',
      },
      {
        type: 'asyncapi-message',
        id: 'events/channel/events/message/z',
        title: 'Zebra',
        messageName: 'z',
        channelName: 'events',
      },
    ])
    expect(channels[1]?.children).toStrictEqual([])
    expect(collectAsyncApiOperations(result.children)).toStrictEqual([])
    expect((document.channels?.events as { 'x-scalar-order'?: string[] })?.['x-scalar-order']).toStrictEqual(
      channels[0]?.children?.map((entry) => entry.id),
    )
  })

  it('keeps referenced channels and messages under their channel tags without operations', () => {
    const document = {
      asyncapi: '3.1.0',
      info: { title: 'Events', version: '1' },
      channels: {
        events: {
          $ref: '#/components/channels/events',
          '$ref-value': {
            title: 'Events',
            tags: [{ name: 'Updates' }],
            messages: { event: { $ref: '#/components/messages/Event', '$ref-value': { title: 'An event' } } },
          },
        },
      },
    } as unknown as AsyncApiDocument
    const result = traverseAsyncApiDocument('events', document)
    const channels = collectAsyncApiChannels(result.children)
    expect(channels.map((channel) => channel.id)).toStrictEqual(['events/tag/updates/channel/events'])
    expect(collectAsyncApiMessages(result.children)).toStrictEqual([
      {
        type: 'asyncapi-message',
        id: 'events/tag/updates/channel/events/message/event',
        title: 'An event',
        messageName: 'event',
        channelName: 'events',
      },
    ])
  })

  it.each(['x-internal', 'x-scalar-ignore'])('keeps a channel hidden when all its operations are %s', (extension) => {
    const document = {
      asyncapi: '3.1.0',
      info: { title: 'Events', version: '1' },
      channels: { events: { messages: { event: { title: 'An event' } } } },
      operations: { send: { action: 'send', channel: { $ref: '#/channels/events' }, [extension]: true } },
    } as unknown as AsyncApiDocument
    const result = traverseAsyncApiDocument('events', document)
    expect(collectAsyncApiChannels(result.children)).toStrictEqual([])
    expect(collectAsyncApiMessages(result.children)).toStrictEqual([])
  })

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

  it('lists Galaxy messages under their operations without duplicating the channel catalog', () => {
    const result = traverseAsyncApiDocument('galaxy', galaxyAsyncApiDocument, mockOptions)
    const channels = collectAsyncApiChannels(result.children)
    const operations = collectAsyncApiOperations(result.children)
    const messages = collectAsyncApiMessages(result.children)

    expect(channels.map((channel) => channel.channelName)).toStrictEqual([
      'celestialBodyEvents',
      'planetEvents',
      'systemEvents',
      'userEvents',
    ])
    expect(operations.length).toBe(4)
    expect(messages.length).toBe(2)

    const channel = channels.find((entry) => entry.channelName === 'planetEvents')
    expect(channel?.children?.map((entry) => entry.type)).toStrictEqual(['asyncapi-operation'])
    expect(collectAsyncApiMessages(channel?.children).map((entry) => entry.messageName)).toStrictEqual([
      'planetCreated',
      'planetUpdated',
    ])
  })

  it('preserves shared message anchors under each operation', () => {
    const result = traverseAsyncApiDocument('chatapp', chatAsyncApiDocument, mockOptions)
    const channel = collectAsyncApiChannels(result.children)[0]
    const operations = collectAsyncApiOperations(result.children)

    expect(operations.map((operation) => operation.operationName)).toStrictEqual([
      'receiveChatMessage',
      'sendChatMessage',
    ])
    expect(collectAsyncApiMessages(channel?.children).map((message) => message.id)).toStrictEqual([
      'chatapp/channel/chat/operation/receivechatmessage/message/chatmessage',
      'chatapp/channel/chat/operation/sendchatmessage/message/chatmessage',
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
    const channel = collectAsyncApiChannels(result.children)[0]
    expect(
      channel?.children?.filter((entry) => entry.type === 'asyncapi-message').map((entry) => entry.messageName),
    ).toStrictEqual(['eventB'])

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

  it('lists components.schemas under a top-level Models section', () => {
    const document = {
      asyncapi: '3.0.0',
      info: { title: 'Schemas API', version: '1.0.0' },
      'x-scalar-original-document-hash': 'schemas-fixture',
      components: {
        schemas: {
          Planet: { type: 'object', title: 'A Planet' },
          Star: { type: 'object' },
        },
      },
    } as unknown as AsyncApiDocument

    const result = traverseAsyncApiDocument('schemas', document, mockOptions)
    const models = result.children?.find((entry) => entry.type === 'models')

    expect(models).toMatchObject({
      type: 'models',
      title: 'Models',
      children: [
        expect.objectContaining({
          type: 'model',
          name: 'Planet',
          title: 'A Planet',
          ref: '#/components/schemas/Planet',
        }),
        expect.objectContaining({ type: 'model', name: 'Star', title: 'Star', ref: '#/components/schemas/Star' }),
      ],
    })
  })

  it('omits the Models section when hideModels is set', () => {
    const document = {
      asyncapi: '3.0.0',
      info: { title: 'Schemas API', version: '1.0.0' },
      'x-scalar-original-document-hash': 'schemas-fixture',
      components: { schemas: { Planet: { type: 'object' } } },
    } as unknown as AsyncApiDocument

    const result = traverseAsyncApiDocument('schemas', document, { ...mockOptions, hideModels: true })

    expect(result.children?.some((entry) => entry.type === 'models')).toBe(false)
  })

  it('lists models when components is a resolved `$ref` wrapper', () => {
    const document = {
      asyncapi: '3.0.0',
      info: { title: 'Schemas API', version: '1.0.0' },
      'x-scalar-original-document-hash': 'schemas-fixture',
      components: {
        '$ref': '#/components',
        '$ref-value': { schemas: { Planet: { type: 'object', title: 'A Planet' } } },
      },
    } as unknown as AsyncApiDocument

    const result = traverseAsyncApiDocument('schemas', document, mockOptions)
    const models = result.children?.find((entry) => entry.type === 'models')

    expect(models).toMatchObject({
      type: 'models',
      children: [expect.objectContaining({ type: 'model', name: 'Planet', title: 'A Planet' })],
    })
  })

  it.each([
    { messages: undefined, expected: ['eventA', 'eventB'] },
    { messages: [], expected: [] },
    { messages: [{ $ref: '#/channels/events/messages/eventA' }], expected: ['eventA'] },
  ])('shows only unclaimed messages in the channel catalog: $expected', ({ messages, expected }) => {
    const document = {
      asyncapi: '3.1.0',
      info: { title: 'Catalog', version: '1.0.0' },
      'x-scalar-original-document-hash': '',
      channels: { events: { address: '/events', messages: { eventB: { title: 'B' }, eventA: { title: 'A' } } } },
      operations: { listen: { action: 'receive', channel: { $ref: '#/channels/events' }, messages } },
    } satisfies AsyncApiDocument
    const result = traverseAsyncApiDocument('catalog', document)
    const channel = collectAsyncApiChannels(result.children)[0]
    const operation = collectAsyncApiOperations(result.children)[0]
    const catalog = channel?.children?.filter(
      (entry): entry is TraversedAsyncApiMessage => entry.type === 'asyncapi-message',
    )

    expect(catalog?.map((message) => message.messageName)).toStrictEqual(
      ['eventA', 'eventB'].filter((name) => !expected.includes(name)),
    )
    expect(operation?.children?.map((message) => message.title) ?? []).toStrictEqual(
      expected.map((name) => (name === 'eventA' ? 'A' : 'B')),
    )
    expect(new Set(collectAsyncApiMessages(channel?.children).map((message) => message.id)).size).toBe(2)
    expect(
      (document.channels.events as typeof document.channels.events & { 'x-scalar-order'?: string[] })['x-scalar-order'],
    ).toStrictEqual(channel?.children?.map((entry) => entry.id))
  })

  it('excludes messages used by any operation on the channel', () => {
    const document = {
      asyncapi: '3.1.0',
      info: { title: 'Events', version: '1.0.0' },
      'x-scalar-original-document-hash': '',
      channels: {
        events: { address: '/events', messages: { a: { title: 'A' }, b: { title: 'B' }, c: { title: 'C' } } },
      },
      operations: {
        receive: {
          action: 'receive',
          channel: { $ref: '#/channels/events' },
          messages: [{ $ref: '#/channels/events/messages/a' }],
        },
        send: {
          action: 'send',
          channel: { $ref: '#/channels/events' },
          messages: [{ $ref: '#/channels/events/messages/b' }],
        },
      },
    } satisfies AsyncApiDocument
    const result = traverseAsyncApiDocument('events', document)
    const channel = collectAsyncApiChannels(result.children)[0]
    expect(
      channel?.children?.filter((entry) => entry.type === 'asyncapi-message').map((entry) => entry.messageName),
    ).toStrictEqual(['c'])
  })

  it('renders tagged message-only channels, resolves references, sorts titles, and skips hidden entries', () => {
    const document = {
      asyncapi: '3.1.0',
      info: { title: 'Catalog', version: '1.0.0' },
      'x-scalar-original-document-hash': '',
      channels: {
        events: {
          address: '/events',
          tags: [{ name: 'Events' }],
          messages: {
            last: { title: 'Zebra' },
            first: { $ref: '#/components/messages/first', '$ref-value': { title: 'Alpha' } },
            internal: { title: 'Internal', 'x-internal': true },
            ignored: {
              $ref: '#/components/messages/ignored',
              '$ref-value': { title: 'Ignored', 'x-scalar-ignore': true },
            },
          },
        },
        hidden: { address: '/hidden', 'x-internal': true, messages: { hidden: { title: 'Hidden' } } },
        empty: { address: '/empty', messages: { ignored: { 'x-scalar-ignore': true } } },
      },
    } as AsyncApiDocument
    const result = traverseAsyncApiDocument('catalog', document)
    const channels = collectAsyncApiChannels(result.children)

    expect(channels.map((entry) => entry.channelName)).toStrictEqual(['events', 'empty'])
    expect(collectAsyncApiOperations(result.children)).toStrictEqual([])
    expect(
      collectAsyncApiMessages(result.children).map(({ id, title, messageName }) => ({ id, title, messageName })),
    ).toStrictEqual([
      { id: 'catalog/tag/events/channel/events/message/first', title: 'Alpha', messageName: 'first' },
      { id: 'catalog/tag/events/channel/events/message/last', title: 'Zebra', messageName: 'last' },
    ])
  })

  it('hides catalog messages when every operation on the channel is hidden', () => {
    const document = {
      asyncapi: '3.1.0',
      info: { title: 'Catalog', version: '1.0.0' },
      'x-scalar-original-document-hash': '',
      channels: { events: { address: '/events', messages: { event: { title: 'Event' } } } },
      operations: { hidden: { action: 'receive', channel: { $ref: '#/channels/events' }, 'x-scalar-ignore': true } },
    } as AsyncApiDocument
    const result = traverseAsyncApiDocument('catalog', document)

    expect(collectAsyncApiChannels(result.children)).toStrictEqual([])
    expect(collectAsyncApiOperations(result.children)).toStrictEqual([])
    expect(collectAsyncApiMessages(result.children)).toStrictEqual([])
  })
})
