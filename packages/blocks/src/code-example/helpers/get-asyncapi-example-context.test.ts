import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { isAsyncApiDocument } from '@scalar/workspace-store/schemas/type-guards'
import { describe, expect, it } from 'vitest'

import { getAsyncApiExampleContext } from './get-asyncapi-example-context'

describe('get-asyncapi-example-context', () => {
  it('resolves operation traits, message restrictions, and channel server restrictions from a workspace', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'events',
      document: {
        asyncapi: '3.1.0',
        info: { title: 'Events', version: '1' },
        servers: {
          other: { host: 'wrong.example.com', protocol: 'wss' },
          production: {
            host: '{region}.example.com',
            protocol: 'wss',
            pathname: '/api',
            variables: { region: { default: 'eu' } },
          },
        },
        channels: {
          events: {
            address: '/events/{tenant}',
            parameters: { tenant: { examples: ['demo'] } },
            servers: [{ $ref: '#/servers/production' }],
            messages: {
              first: { name: 'First', examples: [{ payload: { id: 1 } }] },
              second: { name: 'Second', examples: [{ payload: false }] },
            },
          },
        },
        operations: {
          send: {
            action: 'send',
            channel: { $ref: '#/channels/events' },
            messages: [{ $ref: '#/channels/events/messages/second' }],
            traits: [{ $ref: '#/components/operationTraits/samples' }],
          },
          receive: { action: 'receive', channel: { $ref: '#/channels/events' } },
          empty: { action: 'send', channel: { $ref: '#/channels/events' }, messages: [] },
        },
        components: {
          operationTraits: { samples: { 'x-codeSamples': [{ lang: 'python', source: 'send_event()', label: 'SDK' }] } },
        },
      },
    })
    const document = store.workspace.activeDocument
    if (!isAsyncApiDocument(document)) throw new Error('Expected AsyncAPI')
    const context = getAsyncApiExampleContext(document, 'send')
    expect(context?.messages.map(({ message }) => message.name)).toEqual(['Second'])
    expect(context?.server?.connectionUrl).toBe('wss://eu.example.com/api/events/demo')
    expect(context?.samples).toEqual([{ lang: 'python', source: 'send_event()', label: 'SDK' }])
    expect(getAsyncApiExampleContext(document, 'receive')?.messages.map(({ message }) => message.name)).toEqual([
      'First',
      'Second',
    ])
    expect(getAsyncApiExampleContext(document, 'empty')?.messages).toEqual([])
    expect(getAsyncApiExampleContext(document, 'missing')).toBeUndefined()
  })
})
