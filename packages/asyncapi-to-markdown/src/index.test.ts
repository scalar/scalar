import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { createMagicProxy } from '@scalar/json-magic/magic-proxy'
import { describe, expect, it } from 'vitest'

import { createMarkdownFromAsyncApi as browserMarkdown } from './browser'
import document from './fixtures/events.json'
import { createAsyncApiMarkdownRenderer, createMarkdownFromAsyncApi } from './index'

const minimal = { asyncapi: '3.1.0', info: { title: 'Events', version: '1' } }

describe('index', () => {
  it('renders a minimal introduction exactly', async () => {
    expect(await createMarkdownFromAsyncApi(minimal)).toBe('# Events\n\n- **version:** `1`\n- **asyncapi:** `3.1.0`\n')
  })

  it('produces the same output from objects, JSON and YAML', async () => {
    const expected = await createMarkdownFromAsyncApi(minimal)
    expect(await createMarkdownFromAsyncApi(JSON.stringify(minimal))).toBe(expected)
    expect(await createMarkdownFromAsyncApi('asyncapi: 3.1.0\ninfo:\n  title: Events\n  version: "1"')).toBe(expected)
  })

  it('renders a complete document including unused channel messages and models', async () => {
    const result = await createMarkdownFromAsyncApi(document)
    expect(result).toContain('# Event API')
    expect(result).toContain('Order deleted')
    expect(result).toContain('Schema: Unrelated')
    expect(result).toContain('[Order](#scalar-model-order)')
    expect(result).toContain('orders.{tenant}')
    expect(result).toContain('broker.example.com')
    expect(result).toContain('bearer')
    expect(result).toContain('"bindingVersion": "0.5.0"')
  })

  it('renders operation context and only its selected messages and schema dependencies', async () => {
    const result = await createMarkdownFromAsyncApi(document, { operation: 'onOrder' })
    expect(result).toContain('# Receive an order')
    expect(result).toContain('receive')
    expect(result).toContain('Order created')
    expect(result).toContain('order_1')
    expect(result).toContain('The order ID.')
    expect(result).toContain('application/json')
    expect(result).not.toContain('Order deleted')
    expect(result).not.toContain('unrelated')
    expect(result).not.toContain('Unrelated model')
    expect(result).not.toContain('# Event API')
  })

  it('selects escaped channel keys and channel messages by pointer', async () => {
    expect(await createMarkdownFromAsyncApi(document, { channel: 'orders/~events' })).toBe(
      await createMarkdownFromAsyncApi(document, { channel: { pointer: '#/channels/orders~1~0events' } }),
    )
    expect(await createMarkdownFromAsyncApi(document, { message: 'OrderCreated' })).toBe(
      await createMarkdownFromAsyncApi(document, {
        message: { pointer: '#/channels/orders~1~0events/messages/created' },
      }),
    )
  })

  it('renders introduction and model pages without unrelated reference content', async () => {
    const intro = await createMarkdownFromAsyncApi(document, { introduction: true })
    expect(intro).toContain('Events for **orders**.')
    expect(intro).not.toContain('Order created')
    const model = await createMarkdownFromAsyncApi(document, { model: 'Order' })
    expect(model).toContain('# Order')
    expect(model).toContain('[Order](#scalar-model-order)')
    expect(model).not.toContain('broker.example.com')
  })

  it('rejects invalid and combined selectors and recovers for subsequent renders', async () => {
    const renderer = await createAsyncApiMarkdownRenderer(document)
    await expect(renderer.render({ operation: 'missing' })).rejects.toThrow('Unknown operation')
    // @ts-expect-error Combined selectors are also rejected for JavaScript callers.
    await expect(renderer.render({ operation: 'onOrder', introduction: true })).rejects.toThrow('Choose exactly one')
    await expect(renderer.render({ model: { pointer: '#/info' } })).rejects.toThrow('Invalid model')
    await expect(renderer.render({ channel: 'orders.{tenant}' })).rejects.toThrow('Unknown channel')
    expect(await renderer.render({ introduction: true })).toContain('# Event API')
  })

  it('retains a snapshot without mutating input and isolates concurrent renders', async () => {
    const input = structuredClone(document)
    const before = structuredClone(input)
    const renderer = await createAsyncApiMarkdownRenderer(input)
    expect(input).toStrictEqual(before)
    input.info.title = 'Changed'
    const first = await renderer.render({ operation: 'onOrder' })
    const results = await Promise.all([renderer.render({ model: 'Order' }), renderer.render({ operation: 'onOrder' })])
    expect(results[1]).toBe(first)
    expect(await renderer.render({ introduction: true })).toContain('# Event API')
  })

  it('uses all messages when omitted and no messages for an empty operation list', async () => {
    const input = structuredClone(document)
    input.operations.onOrder.messages = []
    expect(await createMarkdownFromAsyncApi(input, { operation: 'onOrder' })).not.toContain('Order created')
    const { messages: _messages, ...operation } = input.operations.onOrder
    const result = await createMarkdownFromAsyncApi(
      { ...input, operations: { onOrder: operation } },
      { operation: 'onOrder' },
    )
    expect(result).toContain('Order created')
    expect(result).toContain('Order deleted')
  })

  it('keeps all servers when a channel declares an empty server list', async () => {
    const input = {
      ...minimal,
      servers: document.servers,
      components: document.components,
      channels: { orders: { servers: [] } },
    }
    expect(await createMarkdownFromAsyncApi(input, { channel: 'orders' })).toContain('broker.example.com')
  })

  it('merges message and operation traits without overriding authored fields', async () => {
    const input = {
      ...minimal,
      channels: {
        events: {
          address: 'events',
          messages: {
            event: {
              traits: [
                {
                  description: 'Inherited message',
                  headers: { type: 'object', properties: { trace: { type: 'string' } } },
                },
              ],
              description: 'Authored message',
              payload: { type: 'boolean' },
            },
          },
        },
      },
      operations: {
        consume: {
          action: 'receive',
          channel: { $ref: '#/channels/events' },
          traits: [{ description: 'Inherited operation' }],
        },
      },
    }
    const result = await createMarkdownFromAsyncApi(input, { operation: 'consume' })
    expect(result).toContain('Authored message')
    expect(result).not.toContain('Inherited message')
    expect(result).toContain('Inherited operation')
    expect(result).toContain('`trace`')
  })

  it('renders reply messages and dynamic reply addresses', async () => {
    const result = await createMarkdownFromAsyncApi(
      {
        ...document,
        operations: {
          request: {
            ...document.operations.onOrder,
            reply: {
              channel: { $ref: '#/channels/orders~1~0events' },
              address: { location: '$message.header#/replyTo' },
              messages: [{ $ref: '#/channels/orders~1~0events/messages/deleted' }],
            },
          },
        },
      },
      { operation: 'request' },
    )
    expect(result).toContain('## Reply')
    expect(result).toContain('$message.header#/replyTo')
    expect(result).toContain('Order deleted')
  })

  it('upgrades legacy publish and subscribe with the correct application direction', async () => {
    const input = {
      asyncapi: '2.6.0',
      info: minimal.info,
      channels: {
        events: {
          publish: { operationId: 'consume', message: { payload: { type: 'string' } } },
          subscribe: { operationId: 'produce', message: { payload: { type: 'number' } } },
        },
      },
    }
    expect(await createMarkdownFromAsyncApi(input, { operation: 'consume' })).toContain('receive')
    expect(await createMarkdownFromAsyncApi(input, { operation: 'produce' })).toContain('send')
  })

  it('loads relative external references only when creating the renderer', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'asyncapi-markdown-'))
    try {
      const path = join(directory, 'api.json')
      await writeFile(path, JSON.stringify({ ...minimal, components: { schemas: { User: { $ref: './user.json' } } } }))
      await writeFile(join(directory, 'user.json'), JSON.stringify({ type: 'string', description: 'External user' }))
      const renderer = await createAsyncApiMarkdownRenderer(path)
      await rm(join(directory, 'user.json'))
      expect(await renderer.render({ model: 'User' })).toContain('External user')
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it('loads URL documents and relative references and rejects HTTP failures', async () => {
    const server = createServer((request, response) => {
      if (request.url === '/api.json') {
        response.end(JSON.stringify({ ...minimal, components: { schemas: { User: { $ref: './user.json' } } } }))
      } else if (request.url === '/user.json') {
        response.end(JSON.stringify({ type: 'string', description: 'Remote user' }))
      } else {
        response.writeHead(404).end()
      }
    })
    await new Promise<void>((done) => server.listen(0, '127.0.0.1', done))
    try {
      const address = server.address()
      if (!address || typeof address === 'string') {
        throw new Error('Expected a TCP address')
      }
      const origin = `http://127.0.0.1:${address.port}`
      expect(await createMarkdownFromAsyncApi(`${origin}/api.json`, { model: 'User' })).toContain('Remote user')
      await expect(createMarkdownFromAsyncApi(`${origin}/missing`)).rejects.toThrow('HTTP 404')
    } finally {
      await new Promise<void>((done, reject) => server.close((error) => (error ? reject(error) : done())))
    }
  })

  it('rejects wrong document types, unsupported versions and unresolved references', async () => {
    await expect(createMarkdownFromAsyncApi({ openapi: '3.1.0' })).rejects.toThrow('Expected an AsyncAPI')
    await expect(createMarkdownFromAsyncApi({ ...minimal, asyncapi: '4.0.0' })).rejects.toThrow('Unsupported AsyncAPI')
    await expect(
      createMarkdownFromAsyncApi({ ...minimal, components: { schemas: { Missing: { $ref: '#/missing' } } } }),
    ).rejects.toThrow()
  })

  it('renders workspace-resolved browser documents with matching output', async () => {
    const resolved = createMagicProxy(document)
    expect(await browserMarkdown(resolved, { operation: 'onOrder' })).toBe(
      await createMarkdownFromAsyncApi(document, { operation: 'onOrder' }),
    )
  })

  it('resolves externally defined protocol bindings', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'asyncapi-bindings-'))
    try {
      const path = join(directory, 'api.json')
      await writeFile(
        path,
        JSON.stringify({
          ...minimal,
          channels: { events: { address: 'events', bindings: { kafka: { $ref: './binding.json' } } } },
        }),
      )
      await writeFile(join(directory, 'binding.json'), JSON.stringify({ topic: 'orders', bindingVersion: '0.5.0' }))
      expect(await createMarkdownFromAsyncApi(path)).toContain('"topic": "orders"')
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it('protects authored examples in externally referenced schemas', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'asyncapi-examples-'))
    try {
      const path = join(directory, 'api.json')
      await writeFile(path, JSON.stringify({ ...minimal, components: { schemas: { User: { $ref: './user.json' } } } }))
      await writeFile(
        join(directory, 'user.json'),
        JSON.stringify({ type: 'object', examples: [{ $ref: './literal.json' }] }),
      )
      expect(await createMarkdownFromAsyncApi(path, { model: 'User' })).toContain('"$ref": "./literal.json"')
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it('upgrades externally referenced legacy channels and servers before rendering', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'asyncapi-legacy-'))
    try {
      const path = join(directory, 'api.json')
      await writeFile(
        path,
        JSON.stringify({
          asyncapi: '2.6.0',
          info: minimal.info,
          channels: { events: { $ref: './channel.json' } },
          servers: { production: { $ref: './server.json' } },
        }),
      )
      await writeFile(
        join(directory, 'channel.json'),
        JSON.stringify({ publish: { operationId: 'consume', message: { payload: { type: 'string' } } } }),
      )
      await writeFile(
        join(directory, 'server.json'),
        JSON.stringify({ url: 'kafka://broker.example.com:9092', protocol: 'kafka' }),
      )
      const result = await createMarkdownFromAsyncApi(path, { operation: 'consume' })
      expect(result).toContain('**action:** `receive`')
      expect(result).toContain('broker.example.com:9092')
      expect(result).toContain('## Message 1\n\n<a id="scalar-section-payload"></a>\n\n### Payload\n\n`string`')
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it('includes schemas needed to connect through protocol bindings', async () => {
    const result = await createMarkdownFromAsyncApi(
      {
        ...minimal,
        channels: {
          events: {
            address: '/events',
            bindings: { ws: { method: 'GET', query: { $ref: '#/components/schemas/Auth' } } },
          },
        },
        components: {
          schemas: {
            Auth: {
              type: 'object',
              required: ['token'],
              properties: { token: { type: 'string', description: 'Connection token' } },
            },
          },
        },
      },
      { channel: 'events' },
    )
    expect(result).toContain('**Referenced schema:** `#/components/schemas/Auth`')
    expect(result).toContain('**`token`**: `string` (required)')
    expect(result).toContain('Connection token')
  })

  it('preserves array-based servers from AsyncAPI 1.x', async () => {
    const result = await createMarkdownFromAsyncApi({
      asyncapi: '1.2.0',
      info: minimal.info,
      servers: [{ url: 'mqtt://broker.example.com', scheme: 'mqtt' }],
    })
    expect(result).toContain('broker.example.com')
    expect(result).toContain('mqtt')
  })

  it('preserves legacy message schema formats', async () => {
    const result = await createMarkdownFromAsyncApi(
      {
        asyncapi: '2.6.0',
        info: minimal.info,
        channels: {
          events: {
            publish: {
              operationId: 'consume',
              message: {
                schemaFormat: 'application/vnd.apache.avro+json;version=1.9.0',
                payload: { type: 'record', name: 'Event', fields: [{ name: 'id', type: 'string' }] },
              },
            },
          },
        },
      },
      { operation: 'consume' },
    )
    expect(result).toContain('application/vnd.apache.avro+json;version=1.9.0')
    expect(result).toContain('"name": "Event"')
  })
})
