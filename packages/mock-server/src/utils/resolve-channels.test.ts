import { describe, expect, it } from 'vitest'

import { processAsyncApiDocument } from './process-asyncapi-document'
import { resolveChannels } from './resolve-channels'

describe('resolveChannels', () => {
  it('derives route, protocols, operations and messages from a document', async () => {
    const document = await processAsyncApiDocument({
      asyncapi: '3.1.0',
      info: { title: 'Chat', version: '1.0.0' },
      servers: {
        production: { host: 'localhost:3000', protocol: 'ws' },
      },
      channels: {
        room: {
          address: 'rooms/{roomId}',
          messages: {
            message: {
              contentType: 'application/json',
              payload: {
                type: 'object',
                properties: { text: { type: 'string' } },
              },
            },
          },
        },
      },
      operations: {
        sendMessage: { action: 'send', channel: { $ref: '#/channels/room' } },
        receiveMessage: { action: 'receive', channel: { $ref: '#/channels/room' } },
      },
    })

    const channels = resolveChannels(document)

    expect(channels).toHaveLength(1)
    const room = channels[0]!
    expect(room.id).toBe('room')
    expect(room.address).toBe('rooms/{roomId}')
    // Address path params become Hono route params.
    expect(room.route).toBe('/rooms/:roomId')
    expect(room.protocols).toEqual(['ws'])
    expect(room.messages.map((message) => message.id)).toEqual(['message'])
    expect(room.operations.map((operation) => operation.action).sort()).toEqual(['receive', 'send'])
  })

  it('resolves $ref messages and operation message subsets', async () => {
    const document = await processAsyncApiDocument({
      asyncapi: '3.1.0',
      info: { title: 'Prices', version: '1.0.0' },
      servers: { production: { host: 'localhost', protocol: 'sse' } },
      channels: {
        prices: {
          address: 'prices',
          messages: {
            priceUpdate: { $ref: '#/components/messages/PriceUpdate' },
            heartbeat: { payload: { type: 'string' } },
          },
        },
      },
      operations: {
        // Operation scoped to a single message of the channel.
        streamPrices: {
          action: 'receive',
          channel: { $ref: '#/channels/prices' },
          messages: [{ $ref: '#/channels/prices/messages/priceUpdate' }],
        },
      },
      components: {
        messages: {
          PriceUpdate: {
            payload: {
              type: 'object',
              properties: { symbol: { type: 'string' }, price: { type: 'number' } },
            },
          },
        },
      },
    })

    const prices = resolveChannels(document)[0]!

    expect(prices.messages.map((message) => message.id)).toEqual(['priceUpdate', 'heartbeat'])
    // The $ref message payload was dereferenced.
    expect(prices.messages[0]!.payload).toMatchObject({ type: 'object' })
    // The operation only carries its subset of messages.
    expect(prices.operations).toHaveLength(1)
    expect(prices.operations[0]!.messages.map((message) => message.id)).toEqual(['priceUpdate'])
  })

  it('matches operation message subsets by channel key even when the message defines a different name', async () => {
    const document = await processAsyncApiDocument({
      asyncapi: '3.1.0',
      info: { title: 'Named', version: '1.0.0' },
      servers: { production: { host: 'localhost', protocol: 'sse' } },
      channels: {
        feed: {
          address: 'feed',
          messages: {
            // The message key (`update`) differs from its declared `name` (`UpdateEvent`).
            update: { name: 'UpdateEvent', payload: { type: 'object', properties: { id: { type: 'string' } } } },
            heartbeat: { payload: { type: 'string' } },
          },
        },
      },
      operations: {
        streamFeed: {
          action: 'receive',
          channel: { $ref: '#/channels/feed' },
          messages: [{ $ref: '#/channels/feed/messages/update' }],
        },
      },
    })

    const feed = resolveChannels(document)[0]!

    // The resolved id reflects the message `name`, while the operation still resolves via the key.
    expect(feed.messages.map((message) => message.id)).toEqual(['UpdateEvent', 'heartbeat'])
    expect(feed.operations[0]!.messages.map((message) => message.id)).toEqual(['UpdateEvent'])
  })

  it('infers the ws protocol from channel bindings when servers are absent', async () => {
    const document = await processAsyncApiDocument({
      asyncapi: '3.1.0',
      info: { title: 'Sockets', version: '1.0.0' },
      channels: {
        live: {
          address: 'live',
          bindings: { ws: { method: 'GET' } },
          messages: { tick: { payload: { type: 'string' } } },
        },
      },
    })

    const live = resolveChannels(document)[0]!
    expect(live.protocols).toEqual(['ws'])
  })
})
