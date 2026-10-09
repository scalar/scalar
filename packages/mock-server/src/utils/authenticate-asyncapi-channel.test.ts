import { once } from 'node:events'

import { serve } from '@hono/node-server'
import { describe, expect, it, vi } from 'vitest'
import { WebSocket } from 'ws'

import { createAsyncApiMockServer } from '../create-asyncapi-mock-server'

const document = (security: unknown[], protocol = 'sse'): Record<string, unknown> => ({
  asyncapi: '3.0.0',
  info: { title: 'Secured events', version: '1' },
  servers: { events: { host: 'localhost', protocol, security } },
  channels: {
    events: {
      address: '/events',
      messages: {
        private: { name: 'event', payload: { type: 'string', const: 'private' } },
        public: { name: 'event', payload: { type: 'string', const: 'public' } },
      },
    },
  },
})

const operation = (message: string, security: unknown[], action = 'receive'): Record<string, unknown> => ({
  action,
  channel: { $ref: '#/channels/events' },
  messages: [{ $ref: `#/channels/events/messages/${message}` }],
  security,
})

describe('authenticate-asyncapi-channel', () => {
  it('does not use an unsecured SSE server to bypass WebSocket security', async () => {
    const { app, websocket } = await createAsyncApiMockServer({
      document: {
        ...document([], 'ws'),
        servers: {
          socket: { host: 'localhost', protocol: 'ws', security: [{ type: 'http', scheme: 'bearer' }] },
          stream: { host: 'localhost', protocol: 'sse' },
        },
      },
    })
    try {
      expect((await app.request('/events')).status).toBe(401)
    } finally {
      websocket.server.close()
    }
  })

  it('keeps custom transports closed unless every operation is authorized', async () => {
    const { app, websocket } = await createAsyncApiMockServer({
      document: {
        ...document([], 'custom'),
        operations: {
          public: operation('public', []),
          private: operation('private', [{ type: 'http', scheme: 'bearer' }]),
        },
      },
      transports: [
        {
          name: 'custom',
          supports: () => true,
          register: (channel, { app }) => {
            app.get(channel.route, (c) => c.text('custom transport'))
          },
        },
      ],
    })
    try {
      expect((await app.request('/events')).status).toBe(401)
      expect((await app.request('/events', { headers: { Authorization: 'Bearer token' } })).status).toBe(200)
    } finally {
      websocket.server.close()
    }
  })

  it('does not fall back to all messages when SSE has only send operations', async () => {
    const { app, websocket } = await createAsyncApiMockServer({
      document: {
        ...document([]),
        operations: { send: operation('private', [], 'send') },
      },
    })
    try {
      expect(await (await app.request('/events')).text()).toBe('')
    } finally {
      websocket.server.close()
    }
  })

  it.each([
    [{ type: 'http', scheme: 'basic' }, { Authorization: 'basic dXNlcjpwYXNz' }, '/events'],
    [{ type: 'http', scheme: 'bearer' }, { Authorization: 'bearer token' }, '/events'],
    [{ type: 'httpApiKey', in: 'header', name: 'X-Key' }, { 'X-Key': 'key' }, '/events'],
    [{ type: 'httpApiKey', in: 'cookie', name: 'key' }, { Cookie: 'key=secret' }, '/events'],
    [{ type: 'httpApiKey', in: 'query', name: 'key' }, {}, '/events?key=secret'],
    [{ type: 'oauth2', flows: {} }, { Authorization: 'Bearer token' }, '/events'],
    [{ type: 'openIdConnect' }, { Authorization: 'Bearer token' }, '/events'],
  ] as const)('enforces %j before opening SSE', async (scheme, headers, path) => {
    const { app, websocket } = await createAsyncApiMockServer({ document: document([scheme]) })
    try {
      expect((await app.request('/events')).status).toBe(401)
      const response = await app.request(path, { headers })
      expect(response.status).toBe(200)
      expect(await response.text()).toContain('data: private')
    } finally {
      websocket.server.close()
    }
  })

  it('filters protected operations without exposing their messages', async () => {
    const { app, websocket } = await createAsyncApiMockServer({
      document: {
        ...document([]),
        operations: {
          public: operation('public', []),
          private: {
            ...operation('private', []),
            security: undefined,
            traits: [{ security: [{ $ref: '#/components/securitySchemes/key' }] }],
          },
        },
        components: { securitySchemes: { key: { type: 'httpApiKey', in: 'query', name: 'key' } } },
      },
    })
    try {
      expect(await (await app.request('/events')).text()).toBe('event: event\ndata: public\n\n')
      expect(await (await app.request('/events?key=secret')).text()).toBe(
        'event: event\ndata: public\n\nevent: event\ndata: private\n\n',
      )
    } finally {
      websocket.server.close()
    }
  })

  it('does not emit channel messages for an operation with no resolved messages', async () => {
    const { app, websocket } = await createAsyncApiMockServer({
      document: {
        ...document([]),
        operations: {
          public: { ...operation('public', []), messages: [] },
          private: operation('private', [{ type: 'http', scheme: 'bearer' }]),
        },
      },
    })
    try {
      expect(await (await app.request('/events')).text()).toBe('')
    } finally {
      websocket.server.close()
    }
  })

  it('requires server and operation security while allowing scheme alternatives', async () => {
    const { app, websocket } = await createAsyncApiMockServer({
      document: {
        ...document([
          { type: 'http', scheme: 'basic' },
          { type: 'http', scheme: 'bearer' },
        ]),
        operations: { private: operation('private', [{ type: 'httpApiKey', in: 'query', name: 'key' }]) },
      },
    })
    try {
      expect((await app.request('/events?key=secret')).status).toBe(401)
      expect((await app.request('/events', { headers: { Authorization: 'Bearer token' } })).status).toBe(401)
      expect((await app.request('/events?key=secret', { headers: { Authorization: 'Bearer token' } })).status).toBe(200)
    } finally {
      websocket.server.close()
    }
  })

  it.each([
    'scramSha256',
    'scramSha512',
    'gssapi',
    'userPassword',
    'plain',
    'symmetricEncryption',
    'asymmetricEncryption',
    'apiKey',
  ])('reports unsupported %s and never silently authenticates it', async (type) => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const { app, websocket } = await createAsyncApiMockServer({ document: document([{ type }]) })
    try {
      expect(warning).toHaveBeenCalledWith(expect.stringContaining(`unsupported security: ${type}`))
      expect((await app.request('/events', { headers: { Authorization: 'Basic dXNlcjpwYXNz' } })).status).toBe(401)
    } finally {
      websocket.server.close()
      warning.mockRestore()
    }
  })

  it('rejects unresolved security references', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const { app, websocket } = await createAsyncApiMockServer({ document: document([{ $ref: '#/missing' }]) })
    try {
      expect((await app.request('/events')).status).toBe(401)
    } finally {
      websocket.server.close()
      warning.mockRestore()
    }
  })

  it('checks WebSocket upgrades and prevents unauthorized sends', async () => {
    const onMessage = vi.fn()
    const key = { type: 'httpApiKey', in: 'query', name: 'key' }
    const { app, websocket } = await createAsyncApiMockServer({
      onMessage,
      document: {
        ...document([{ type: 'http', scheme: 'bearer' }], 'ws'),
        operations: { receive: operation('public', []), send: operation('private', [key], 'send') },
      },
    })
    const server = serve({ fetch: app.fetch, hostname: '127.0.0.1', port: 0, websocket })
    const clients: WebSocket[] = []
    try {
      if (!server.listening) await once(server, 'listening')
      const address = server.address()
      if (!address || typeof address === 'string') throw new Error('Expected TCP address')
      const rejected = new WebSocket(`ws://127.0.0.1:${address.port}/events`)
      clients.push(rejected)
      const status = await new Promise<number>((resolve, reject) => {
        rejected.on('unexpected-response', (_request, response) => {
          response.resume()
          resolve(response.statusCode ?? 0)
          rejected.terminate()
        })
        rejected.on('error', reject)
      })
      expect(status).toBe(401)
      const client = new WebSocket(`ws://127.0.0.1:${address.port}/events`, {
        headers: { Authorization: 'Bearer token' },
      })
      clients.push(client)
      const messages: string[] = []
      client.on('message', (data) => messages.push(data.toString()))
      await once(client, 'open')
      await vi.waitFor(() => expect(messages).toStrictEqual(['public']))
      const closed = once(client, 'close')
      client.send('forbidden')
      expect((await closed)[0]).toBe(1008)
      expect(onMessage.mock.calls).toStrictEqual([[{ channel: 'events', direction: 'out', payload: 'public' }]])
      const writer = new WebSocket(`ws://127.0.0.1:${address.port}/events?key=secret`, {
        headers: { Authorization: 'Bearer token' },
      })
      clients.push(writer)
      const replies: string[] = []
      writer.on('message', (data) => replies.push(data.toString()))
      await once(writer, 'open')
      writer.send('allowed')
      await vi.waitFor(() => expect(replies).toStrictEqual(['public', 'private']))
    } finally {
      clients.forEach((client) => client.terminate())
      await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
    }
  })
})
