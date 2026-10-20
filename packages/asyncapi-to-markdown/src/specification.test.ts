import { describe, expect, it } from 'vitest'

import { createMarkdownFromAsyncApi } from './index'

const base = { asyncapi: '3.1.0', info: { title: 'Application', version: '1' } }

describe('specification', () => {
  it('preserves application identity and default payload encoding in the introduction', async () => {
    const result = await createMarkdownFromAsyncApi(
      { ...base, id: 'urn:example:application', defaultContentType: 'text/plain' },
      { introduction: true },
    )
    expect(result).toContain('**id:** `urn:example:application`')
    expect(result).toContain('**defaultContentType:** `text/plain`')
  })

  it('documents unknown addresses and does not invent reply messages', async () => {
    const result = await createMarkdownFromAsyncApi(
      {
        ...base,
        channels: { requests: { messages: { request: { title: 'Request message', payload: { type: 'string' } } } } },
        operations: {
          send: {
            action: 'send',
            channel: { $ref: '#/channels/requests' },
            reply: { address: { location: '$message.header#/replyTo' } },
          },
        },
      },
      { operation: 'send' },
    )
    expect(result).toContain('**Address:** Unknown.')
    expect(result.split('## Request message').length - 1).toBe(1)
    expect(result.split('## Reply')[1]).not.toContain('Request message')
    expect(result).toContain('$message.header#/replyTo')
  })

  it('explains security alternatives and independent server and operation requirements', async () => {
    const result = await createMarkdownFromAsyncApi(
      {
        ...base,
        servers: {
          broker: { host: 'example.com', protocol: 'mqtt', security: [{ type: 'userPassword' }, { type: 'X509' }] },
        },
        channels: { events: { address: 'events' } },
        operations: {
          receive: {
            action: 'receive',
            channel: { $ref: '#/channels/events' },
            security: [
              {
                type: 'oauth2',
                scopes: ['events:read'],
                flows: {
                  clientCredentials: {
                    tokenUrl: 'https://example.com/token',
                    availableScopes: { 'events:read': 'Read events' },
                  },
                },
              },
            ],
          },
        },
      },
      { operation: 'receive' },
    )
    expect(result.split('Satisfy one of the following security schemes.').length - 1).toBe(2)
    expect(result).toContain('Applicable server security must also be satisfied.')
    expect(result).toContain('events:read')
    expect(result).toContain('Read events')
  })

  it('preserves schema documentation and content annotations, including linked usages', async () => {
    const document = {
      ...base,
      components: {
        schemas: {
          Data: {
            type: 'string',
            title: 'Encoded data',
            contentEncoding: 'base64',
            contentMediaType: 'image/png',
            externalDocs: { url: 'https://example.com/schema', description: 'Schema guide' },
          },
          Parent: { type: 'object', properties: { data: { $ref: '#/components/schemas/Data' } } },
        },
      },
    }
    const result = await createMarkdownFromAsyncApi(document, { model: 'Data' })
    expect(result).toContain('contentEncoding: `base64`')
    expect(result).toContain('contentMediaType: `image/png`')
    expect(result).toContain('[Schema guide](https://example.com/schema)')
    const linked = await createMarkdownFromAsyncApi(document, {
      model: 'Parent',
      schemaReferences: { mode: 'linked', inlinePrimitives: false },
    })
    expect(linked).toContain('[Schema guide](https://example.com/schema)')
  })

  it('renders tag documentation and resolves reusable maps with data-like keys', async () => {
    const result = await createMarkdownFromAsyncApi(
      {
        ...base,
        channels: { events: { address: 'events', tags: [{ $ref: '#/components/tags/examples' }] } },
        components: {
          tags: {
            examples: { $ref: '#/components/tags/event' },
            event: {
              name: 'Events',
              description: 'Event guidance',
              externalDocs: { $ref: '#/components/externalDocs/default' },
            },
          },
          externalDocs: {
            default: { $ref: '#/components/externalDocs/guide' },
            guide: { url: 'https://example.com/events', description: 'Event guide' },
          },
        },
      },
      { channel: 'events' },
    )
    expect(result).toContain('Event guidance')
    expect(result).toContain('[Event guide](https://example.com/events)')
  })

  it.each([
    'application/schema+json;version=draft-07',
    'application/schema+yaml;version=draft-07',
    'application/vnd.aai.asyncapi;version=3.1.0',
    'application/vnd.aai.asyncapi+json;version=3.1.0',
    'application/vnd.aai.asyncapi+yaml;version=3.1.0',
  ])('renders the mandatory schema format %s for headers and payload', async (schemaFormat) => {
    const schema = { schemaFormat, schema: { type: 'object', properties: { value: { type: 'string' } } } }
    const result = await createMarkdownFromAsyncApi(
      { ...base, components: { messages: { Event: { headers: schema, payload: schema } } } },
      { message: 'Event' },
    )
    expect(result).toContain('## Headers')
    expect(result).toContain('## Payload')
    expect(result.split('**`value`**: `string`').length - 1).toBe(2)
  })
})
