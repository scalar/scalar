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
})
