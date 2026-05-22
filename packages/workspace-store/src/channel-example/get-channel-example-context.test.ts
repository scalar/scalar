import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { describe, expect, it } from 'vitest'

import { getChannelExampleContext } from '@/channel-example/get-channel-example-context'
import { createWorkspaceStore } from '@/client'

const galaxyAsyncApiDocument = {
  asyncapi: '3.0.0',
  info: { title: 'Scalar Galaxy Events', version: '1.0.0' },
  servers: {
    production: {
      host: 'galaxy.scalar.com',
      protocol: 'wss',
      description: 'Production WebSocket server',
      security: [{ $ref: '#/components/securitySchemes/bearerAuth' }],
    },
    development: {
      host: 'localhost:8080',
      protocol: 'ws',
      security: [],
    },
  },
  channels: {
    planetEvents: {
      address: 'planets/{planetId}/events',
      parameters: {
        planetId: {
          description: 'The ID of the planet',
          default: 'earth',
        },
      },
      bindings: {
        ws: {
          method: 'GET',
          query: {
            type: 'object',
            properties: {
              includeHistory: { type: 'boolean', default: false },
            },
          },
        },
      },
      messages: {
        planetCreated: {
          name: 'planetCreated',
          title: 'Planet Created',
          payload: { type: 'object', properties: { eventType: { type: 'string' } } },
        },
        planetUpdated: {
          name: 'planetUpdated',
          title: 'Planet Updated',
          payload: { type: 'object', properties: { eventType: { type: 'string' } } },
        },
      },
    },
  },
  operations: {
    subscribeToPlanetEvents: {
      action: 'receive',
      channel: { $ref: '#/channels/planetEvents' },
      title: 'Subscribe to Planet Events',
      traits: [
        {
          security: [{ $ref: '#/components/securitySchemes/bearerAuth' }],
        },
      ],
      bindings: {
        ws: {
          bindingVersion: '0.1.0',
          method: 'GET',
        },
      },
    },
    subscribeToSystemEvents: {
      action: 'receive',
      channel: {
        address: 'system/events',
        messages: {
          systemMaintenance: {
            name: 'systemMaintenance',
            payload: { type: 'object' },
          },
        },
      },
      messages: [],
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      httpApiKey: {
        type: 'httpApiKey',
        in: 'query',
        name: 'api_key',
      },
    },
  },
} as unknown as AsyncApiDocument

const chatAsyncApiDocument = {
  asyncapi: '3.0.0',
  info: { title: 'Simple Chat WebSocket API', version: '1.0.0' },
  servers: {
    production: {
      host: 'api.example.com',
      protocol: 'wss',
    },
  },
  channels: {
    chat: {
      address: '/chat',
      messages: {
        sendMessage: {
          name: 'SendMessage',
          payload: {
            type: 'object',
            properties: {
              message: { type: 'string', example: 'Hello' },
            },
          },
        },
        receiveMessage: {
          name: 'ReceiveMessage',
          payload: {
            type: 'object',
            properties: {
              message: { type: 'string', example: 'Hi' },
            },
          },
        },
      },
    },
  },
  operations: {
    sendChatMessage: {
      action: 'send',
      channel: { $ref: '#/channels/chat' },
      messages: [{ $ref: '#/channels/chat/messages/sendMessage' }],
    },
    receiveChatMessage: {
      action: 'receive',
      channel: { $ref: '#/channels/chat' },
      messages: [{ $ref: '#/channels/chat/messages/receiveMessage' }],
    },
  },
} as unknown as AsyncApiDocument

describe('getChannelExampleContext', () => {
  it('returns an error when the document is missing', () => {
    const store = createWorkspaceStore()

    const result = getChannelExampleContext(store, 'missing', { operationName: 'subscribeToPlanetEvents' })

    expect(result).toEqual({
      ok: false,
      error: 'Document missing not found',
    })
  })

  it('returns an error when the document is not AsyncAPI', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'openapi',
      document: {
        openapi: '3.1.0',
        info: { title: 'REST', version: '1.0.0' },
        paths: {},
      },
    })

    const result = getChannelExampleContext(store, 'openapi', { operationName: 'get' })

    expect(result).toEqual({
      ok: false,
      error: 'Document openapi is not an AsyncAPI document',
    })
  })

  it('returns an error when the operation does not exist', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({ name: 'galaxy', document: galaxyAsyncApiDocument })

    const result = getChannelExampleContext(store, 'galaxy', { operationName: 'missingOperation' })

    expect(result).toEqual({
      ok: false,
      error: 'Operation missingOperation not found',
    })
  })

  it('builds Galaxy planet events context with channel, messages, servers, security, and connection URL', () => {
    const store = createWorkspaceStore()
    store.workspace.documents.galaxy = galaxyAsyncApiDocument

    const result = getChannelExampleContext(
      store,
      'galaxy',
      { operationName: 'subscribeToPlanetEvents' },
      {
        fallbackDocument: galaxyAsyncApiDocument,
        pathParameters: { planetId: 'mars-42' },
      },
    )

    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }

    expect(result.data.operation.action).toBe('receive')
    expect(result.data.operation.title).toBe('Subscribe to Planet Events')
    expect(result.data.channelName).toBe('planetEvents')
    expect(result.data.channelAddress).toBe('planets/{planetId}/events')
    expect(result.data.messages.map(({ name }) => name)).toEqual(['planetCreated', 'planetUpdated'])
    expect(result.data.selectedMessage?.name).toBe('planetCreated')
    expect(result.data.parameters.path).toEqual({ planetId: 'mars-42' })
    expect(result.data.parameters.query).toEqual({ includeHistory: 'false' })
    expect(result.data.servers.list).toHaveLength(2)
    expect(result.data.servers.selected?.name).toBe('production')
    expect(result.data.connectionUrl).toBe('wss://galaxy.scalar.com/planets/mars-42/events?includeHistory=false')
    expect(result.data.security.requirements).toStrictEqual([{ bearerAuth: [] }])
    const bearerScheme = result.data.security.schemes.bearerAuth
    expect(bearerScheme != null && 'scheme' in bearerScheme && bearerScheme.scheme).toBe('bearer')
    expect(result.data.environment.name).toBe(null)
  })

  it('uses fallbackDocument when the workspace entry is not available yet', () => {
    const store = createWorkspaceStore()

    const result = getChannelExampleContext(
      store,
      'galaxy',
      { operationName: 'subscribeToPlanetEvents' },
      {
        fallbackDocument: galaxyAsyncApiDocument,
        pathParameters: { planetId: 'moon-1' },
      },
    )

    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }

    expect(result.data.connectionUrl).toBe('wss://galaxy.scalar.com/planets/moon-1/events?includeHistory=false')
  })

  it('resolves explicit operation messages for the chat send operation', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({ name: 'chatapp', document: chatAsyncApiDocument })

    const result = getChannelExampleContext(store, 'chatapp', { operationName: 'sendChatMessage' })

    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }

    const chatChannel = chatAsyncApiDocument.channels?.chat
    const sendMessage = chatChannel != null && !('$ref' in chatChannel) ? chatChannel.messages?.sendMessage : undefined

    expect(result.data.messages).toStrictEqual([
      {
        name: 'sendMessage',
        message: sendMessage,
      },
    ])
    expect(result.data.selectedMessage?.name).toBe('sendMessage')
    expect(result.data.connectionUrl).toBe('wss://api.example.com/chat')
    expect(result.data.security.requirements).toEqual([])
  })

  it('returns no messages when the operation explicitly lists none', () => {
    const store = createWorkspaceStore()
    store.workspace.documents.galaxy = galaxyAsyncApiDocument

    const result = getChannelExampleContext(
      store,
      'galaxy',
      { operationName: 'subscribeToSystemEvents' },
      {
        fallbackDocument: galaxyAsyncApiDocument,
      },
    )

    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }

    expect(result.data.messages).toEqual([])
    expect(result.data.selectedMessage).toBe(null)
  })
})
