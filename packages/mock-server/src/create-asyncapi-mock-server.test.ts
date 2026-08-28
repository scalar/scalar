import { afterEach, describe, expect, it, vi } from 'vitest'

import { createAsyncApiMockServer } from './create-asyncapi-mock-server'
import type { MockTransport } from './transports/types'
import { isAsyncApiDocument } from './utils/process-asyncapi-document'

describe('createAsyncApiMockServer', () => {
  // Some tests spy on the global console, so restore it even when an assertion throws first.
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('serves SSE channels with a generated message', async () => {
    const { app } = await createAsyncApiMockServer({
      document: {
        asyncapi: '3.1.0',
        info: { title: 'Prices', version: '1.0.0' },
        servers: { production: { host: 'localhost', protocol: 'sse' } },
        channels: {
          prices: {
            address: 'prices',
            messages: {
              priceUpdate: {
                contentType: 'application/json',
                payload: {
                  type: 'object',
                  properties: { symbol: { type: 'string' }, price: { type: 'number' } },
                  required: ['symbol', 'price'],
                },
              },
            },
          },
        },
        operations: {
          streamPrices: { action: 'receive', channel: { $ref: '#/channels/prices' } },
        },
      },
    })

    const response = await app.request('/prices')

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/event-stream')

    const body = await response.text()
    expect(body).toContain('event: priceUpdate')
    expect(body).toContain('data:')
    expect(body).toContain('symbol')
  })

  it('lets custom transports claim channels (extension point)', async () => {
    const claimed: string[] = []
    const signalr: MockTransport = {
      name: 'signalr',
      supports: (channel) => channel.protocols.includes('signalr'),
      register: (channel) => {
        claimed.push(channel.id)
      },
    }

    await createAsyncApiMockServer({
      document: {
        asyncapi: '3.1.0',
        info: { title: 'Hub', version: '1.0.0' },
        servers: { production: { host: 'localhost', protocol: 'signalr' } },
        channels: { hub: { address: 'hub', messages: { ping: { payload: { type: 'string' } } } } },
        operations: { onPing: { action: 'receive', channel: { $ref: '#/channels/hub' } } },
      },
      transports: [signalr],
    })

    expect(claimed).toEqual(['hub'])
  })

  it('warns about channels that no transport can serve, even with logging disabled', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    await createAsyncApiMockServer({
      document: {
        asyncapi: '3.1.0',
        info: { title: 'Kafka', version: '1.0.0' },
        servers: { broker: { host: 'localhost:9092', protocol: 'kafka' } },
        channels: { events: { address: 'events', messages: { evt: { payload: { type: 'string' } } } } },
        operations: { onEvent: { action: 'receive', channel: { $ref: '#/channels/events' } } },
      },
      logger: false,
    })

    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('no transport for channel "events"'))
  })

  it('logs transport registration to the console when logger is true', async () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    await createAsyncApiMockServer({
      document: {
        asyncapi: '3.1.0',
        info: { title: 'Prices', version: '1.0.0' },
        servers: { production: { host: 'localhost', protocol: 'sse' } },
        channels: { prices: { address: 'prices', messages: { priceUpdate: { payload: { type: 'string' } } } } },
        operations: { streamPrices: { action: 'receive', channel: { $ref: '#/channels/prices' } } },
      },
      logger: true,
    })

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('channel "prices"'))
  })
})

describe('isAsyncApiDocument', () => {
  it('detects AsyncAPI documents', () => {
    expect(isAsyncApiDocument({ asyncapi: '3.1.0' })).toBe(true)
    expect(isAsyncApiDocument({ openapi: '3.1.0' })).toBe(false)
    expect(isAsyncApiDocument(null)).toBe(false)
    expect(isAsyncApiDocument('asyncapi')).toBe(false)
  })
})
