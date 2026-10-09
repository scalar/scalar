import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { describe, expect, it } from 'vitest'

import { getChannelConnectionContext } from '@/channel-example/get-channel-connection-context'
import { createWorkspaceStore } from '@/client'

const echoChannelDocument = {
  asyncapi: '3.0.0',
  info: { title: 'Echo', version: '1.0.0' },
  servers: {
    echo: {
      host: 'echo.websocket.org',
      protocol: 'wss',
    },
  },
  channels: {
    echo: {
      address: '',
      messages: {
        echoPayload: {
          name: 'echoPayload',
          payload: { type: 'object', properties: { message: { type: 'string' } } },
        },
      },
    },
  },
  operations: {
    sendEchoMessage: {
      action: 'send',
      channel: { $ref: '#/channels/echo' },
      messages: [{ $ref: '#/channels/echo/messages/echoPayload' }],
    },
    listenOnEcho: {
      action: 'receive',
      channel: { $ref: '#/channels/echo' },
    },
  },
} as unknown as AsyncApiDocument

describe('getChannelConnectionContext', () => {
  it('resolves channel messages and connection URL without an operation', async () => {
    const store = createWorkspaceStore()
    const slug = 'echo-doc'

    await store.addDocument({ name: slug, document: echoChannelDocument })

    const result = getChannelConnectionContext(store, slug, { channelName: 'echo' })

    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }

    expect(result.data.channelName).toBe('echo')
    expect(result.data.connectionUrl).toBe('wss://echo.websocket.org')
    expect(result.data.messages.map(({ name }) => name)).toEqual(['echoPayload'])
    expect(result.data.operations.map(({ operationName }) => operationName).sort()).toEqual([
      'listenOnEcho',
      'sendEchoMessage',
    ])
  })

  it('uses inline server authentication without merging operation credentials into the connection', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'inline',
      document: {
        ...echoChannelDocument,
        servers: { echo: { host: 'example.com', protocol: 'wss', security: [{ type: 'http', scheme: 'bearer' }] } },
        operations: {
          send: {
            action: 'send',
            channel: { $ref: '#/channels/echo' },
            security: [{ type: 'oauth2', flows: {}, scopes: ['send'] }],
          },
        },
      },
    })
    const result = getChannelConnectionContext(store, 'inline', { channelName: 'echo' })
    expect(result.ok).toBe(true)
    if (!result.ok) {
      throw new Error(result.error)
    }
    expect(result.data.security.requirements).toStrictEqual([{ 'Server echo · http 1': [] }])
    expect(Object.keys(result.data.security.schemes)).toStrictEqual(['Server echo · http 1'])
    expect(result.data.security.selected.selectedSchemes).toStrictEqual([{ 'Server echo · http 1': [] }])
  })

  it('returns an error when the channel is missing', async () => {
    const store = createWorkspaceStore()
    const slug = 'echo-doc'

    await store.addDocument({ name: slug, document: echoChannelDocument })

    const result = getChannelConnectionContext(store, slug, { channelName: 'missing' })

    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }

    expect(result.error).toContain('Channel missing not found')
  })

  it('ignores a selected server outside the channel server list', async () => {
    const store = createWorkspaceStore()
    const slug = 'restricted-doc'
    const document = {
      asyncapi: '3.0.0',
      info: { title: 'Restricted channel', version: '1.0.0' },
      'x-scalar-selected-server': 'production',
      servers: {
        production: {
          host: 'api.example.com',
          protocol: 'wss',
        },
        sandbox: {
          host: 'sandbox.example.com',
          protocol: 'wss',
        },
      },
      channels: {
        notifications: {
          address: '/notifications',
          servers: [{ $ref: '#/servers/sandbox' }],
        },
      },
    } as unknown as AsyncApiDocument

    await store.addDocument({ name: slug, document })

    const result = getChannelConnectionContext(store, slug, { channelName: 'notifications' })

    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }

    expect(result.data.servers.list.map(({ name }) => name)).toStrictEqual(['sandbox'])
    expect(result.data.servers.selected?.name).toBe('sandbox')
    expect(result.data.connectionUrl).toBe('wss://sandbox.example.com/notifications')
  })
})
