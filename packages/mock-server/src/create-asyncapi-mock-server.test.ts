import { once } from 'node:events'
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { serve } from '@hono/node-server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { WebSocket } from 'ws'

import { createAsyncApiMockServer } from './create-asyncapi-mock-server'
import type { MockTransport } from './transports/types'
import { isAsyncApiDocument } from './utils/process-asyncapi-document'

describe('createAsyncApiMockServer', () => {
  // Some tests spy on the global console, so restore it even when an assertion throws first.
  afterEach(() => {
    vi.restoreAllMocks()
  })

  const documentWithReference = (reference: string): Record<string, unknown> => ({
    asyncapi: '3.1.0',
    info: { title: 'References', version: '1.0.0' },
    servers: { local: { host: 'localhost', protocol: 'sse' } },
    channels: { events: { address: 'events', messages: { event: { payload: { $ref: reference } } } } },
    operations: { receive: { action: 'receive', channel: { $ref: '#/channels/events' } } },
  })

  it.each([false, true])('resolves confined file references (preloaded: %s)', async (preloaded) => {
    const directory = await mkdtemp(join(tmpdir(), 'asyncapi-refs-'))
    const file = join(directory, 'asyncapi.json')
    const document = documentWithReference('./payload.json')
    try {
      await writeFile(file, JSON.stringify(document))
      await writeFile(join(directory, 'payload.json'), JSON.stringify({ type: 'string', const: 'allowed' }))
      const { app } = await createAsyncApiMockServer({
        document: preloaded ? document : file,
        ...(preloaded ? { origin: file } : {}),
      })
      expect(await (await app.request('/events')).text()).toBe('event: event\ndata: allowed\n\n')
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it.each(['../secret.json', './link.json'])(
    'refuses file references escaping the source directory: %s',
    async (reference) => {
      const directory = await mkdtemp(join(tmpdir(), 'asyncapi-escape-'))
      const sourceDirectory = join(directory, 'source')
      try {
        await mkdir(sourceDirectory)
        await writeFile(join(directory, 'secret.json'), JSON.stringify({ type: 'string', const: 'secret-content' }))
        await symlink(join(directory, 'secret.json'), join(sourceDirectory, 'link.json'))
        const file = join(sourceDirectory, 'asyncapi.json')
        await writeFile(file, JSON.stringify(documentWithReference(reference)))
        const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        const { app } = await createAsyncApiMockServer({ document: file })
        expect(await (await app.request('/events')).text()).not.toContain('secret-content')
        expect(warning.mock.calls.flat().some((value) => String(value).includes('outside the allowed directory'))).toBe(
          true,
        )
      } finally {
        await rm(directory, { recursive: true, force: true })
      }
    },
  )

  it.each(['127.0.0.1', '10.0.0.1', '169.254.169.254', '[::1]'])(
    'refuses private network references: %s',
    async (host) => {
      const bundlerRequire = createRequire(import.meta.resolve('@scalar/json-magic/bundle'))
      const { Agent } = bundlerRequire('undici') as typeof import('undici')
      const dispatch = vi.spyOn(Agent.prototype, 'dispatch')
      const fetch = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(Response.json({ type: 'string', const: 'private-content' }))
      vi.spyOn(console, 'warn').mockImplementation(() => undefined)
      const { app } = await createAsyncApiMockServer({ document: documentWithReference(`http://${host}/payload.json`) })
      expect(dispatch).not.toHaveBeenCalled()
      expect(fetch).not.toHaveBeenCalled()
      expect(await (await app.request('/events')).text()).not.toContain('private-content')
    },
  )

  it.each([false, true])('resolves public URL references (preloaded: %s)', async (preloaded) => {
    const bundlerRequire = createRequire(import.meta.resolve('@scalar/json-magic/bundle'))
    const { Agent, MockAgent } = bundlerRequire('undici') as typeof import('undici')
    const transport = new MockAgent()
    transport.disableNetConnect()
    const pool = transport.get('https://203.0.113.1')
    const document = documentWithReference('./payload.json')
    if (!preloaded) {
      pool.intercept({ path: '/asyncapi.json', method: 'GET' }).reply(200, document)
    }
    pool.intercept({ path: '/payload.json', method: 'GET' }).reply(200, { type: 'string', const: 'public-content' })
    const dispatch = vi
      .spyOn(Agent.prototype, 'dispatch')
      .mockImplementation((options, handler) => pool.dispatch(options, handler))
    try {
      const { app } = await createAsyncApiMockServer({
        document: preloaded ? document : 'https://203.0.113.1/asyncapi.json',
        ...(preloaded ? { origin: 'https://203.0.113.1/asyncapi.json' } : {}),
      })
      expect(await (await app.request('/events')).text()).toBe('event: event\ndata: public-content\n\n')
      expect(dispatch).toHaveBeenCalledTimes(preloaded ? 1 : 2)
      transport.assertNoPendingInterceptors()
    } finally {
      dispatch.mockRestore()
      await transport.close()
    }
  })

  it('refuses redirects from public references to private addresses', async () => {
    const bundlerRequire = createRequire(import.meta.resolve('@scalar/json-magic/bundle'))
    const { Agent, MockAgent } = bundlerRequire('undici') as typeof import('undici')
    const transport = new MockAgent()
    transport.disableNetConnect()
    const pool = transport.get('https://203.0.113.1')
    pool
      .intercept({ path: '/payload.json', method: 'GET' })
      .reply(302, '', { headers: { location: 'http://127.0.0.1/secret.json' } })
    const dispatch = vi
      .spyOn(Agent.prototype, 'dispatch')
      .mockImplementation((options, handler) => pool.dispatch(options, handler))
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    try {
      await createAsyncApiMockServer({ document: documentWithReference('https://203.0.113.1/payload.json') })
      expect(dispatch).toHaveBeenCalledTimes(1)
      transport.assertNoPendingInterceptors()
    } finally {
      dispatch.mockRestore()
      await transport.close()
    }
  })

  it('pushes and replies to messages over a real WebSocket connection', async () => {
    const onMessage = vi.fn()
    const { app, websocket } = await createAsyncApiMockServer({
      document: {
        asyncapi: '3.1.0',
        info: { title: 'Chat', version: '1.0.0' },
        servers: { local: { host: 'localhost', protocol: 'ws' } },
        channels: {
          messages: {
            address: 'messages',
            messages: {
              message: {
                contentType: 'application/json',
                payload: {
                  type: 'object',
                  properties: { text: { type: 'string', const: 'hello' } },
                  required: ['text'],
                },
              },
            },
          },
        },
        operations: {
          receive: { action: 'receive', channel: { $ref: '#/channels/messages' } },
          send: { action: 'send', channel: { $ref: '#/channels/messages' } },
        },
      },
      onMessage,
    })
    const server = serve({ fetch: app.fetch, hostname: '127.0.0.1', port: 0, websocket })
    const clients: WebSocket[] = []

    try {
      if (!server.listening) {
        await once(server, 'listening')
      }
      const address = server.address()
      if (!address || typeof address === 'string') {
        throw new Error('Expected a TCP address')
      }
      const client = new WebSocket(`ws://127.0.0.1:${address.port}/messages`)
      clients.push(client)
      const messages: string[] = []
      client.on('message', (data) => messages.push(data.toString()))
      await once(client, 'open')

      await vi.waitFor(() => expect(messages).toStrictEqual(['{"text":"hello"}']))
      client.send('hi')
      await vi.waitFor(() => expect(messages).toStrictEqual(['{"text":"hello"}', '{"text":"hello"}']))
      expect(onMessage.mock.calls).toStrictEqual([
        [{ channel: 'messages', direction: 'out', payload: '{"text":"hello"}' }],
        [{ channel: 'messages', direction: 'in', payload: 'hi' }],
        [{ channel: 'messages', direction: 'out', payload: '{"text":"hello"}' }],
      ])

      const closed = once(client, 'close')
      client.close(1000)
      const [code] = await closed
      expect(code).toBe(1000)
      const response = await fetch(`http://127.0.0.1:${address.port}/missing`)
      expect(response.status).toBe(404)
    } finally {
      for (const client of clients) {
        client.terminate()
      }
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
      })
    }
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

  it('serves a generated message for a deprecated payload schema', async () => {
    // `deprecated` marks a payload as discouraged, not as absent, so omitting it sent the channel's
    // declared payload as `data: null` — `encode` falls back to `null` for a generated `undefined`.
    const { app } = await createAsyncApiMockServer({
      document: {
        asyncapi: '3.1.0',
        info: { title: 'Legacy Prices', version: '1.0.0' },
        servers: { production: { host: 'localhost', protocol: 'sse' } },
        channels: {
          prices: {
            address: 'prices',
            messages: {
              priceUpdate: {
                contentType: 'application/json',
                payload: {
                  deprecated: true,
                  type: 'object',
                  required: ['symbol'],
                  properties: { symbol: { type: 'string' } },
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
    expect(await response.text()).toContain('data: {"symbol":"string"}')
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
