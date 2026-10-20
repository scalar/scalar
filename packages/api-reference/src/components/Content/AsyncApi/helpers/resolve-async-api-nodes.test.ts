import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { describe, expect, it } from 'vitest'

import { resolveAsyncApiChannel, resolveAsyncApiMessage, resolveAsyncApiOperation } from './resolve-async-api-nodes'

const document = {
  channels: {
    userSignedup: {
      address: 'user/signedup',
      title: 'User signed up',
      messages: {
        UserMessage: { title: 'User', payload: { type: 'object' } },
      },
    },
  },
  operations: {
    sendUserSignedUp: {
      action: 'send',
      title: 'Send user signed up',
      channel: { $ref: '#/channels/userSignedup' },
    },
  },
} as unknown as AsyncApiDocument

describe('resolveAsyncApiChannel', () => {
  it('ignores channel, message, operation, and trait siblings through reference chains', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'events',
      document: {
        asyncapi: '3.1.0',
        info: { title: 'Events', version: '1' },
        channels: { events: { $ref: '#/components/channels/Events', title: 'Wrong channel', messages: {} } },
        operations: { send: { $ref: '#/components/operations/Send', title: 'Wrong operation' } },
        components: {
          channels: {
            Events: {
              title: 'Events',
              address: 'events',
              messages: { event: { $ref: '#/components/messages/Alias', title: 'Wrong message' } },
            },
          },
          messages: {
            Alias: { $ref: '#/components/messages/Event', title: 'Wrong alias' },
            Event: {
              title: 'Event',
              traits: [{ $ref: '#/components/messageTraits/Description', description: 'Wrong trait' }],
            },
          },
          operations: { Send: { action: 'send', channel: { $ref: '#/channels/events' }, title: 'Send' } },
          messageTraits: { Description: { description: 'Target trait' } },
        },
      },
    })
    const source = store.workspace.documents.events as AsyncApiDocument
    expect(resolveAsyncApiChannel(source, 'events')?.title).toBe('Events')
    const message = resolveAsyncApiMessage(source, 'events', 'event')
    expect([message?.title, message?.description]).toStrictEqual(['Event', 'Target trait'])
    expect(resolveAsyncApiOperation(source, 'send')?.title).toBe('Send')
  })

  it('does not use sibling content when message or operation targets are missing', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'events',
      document: {
        asyncapi: '3.1.0',
        info: { title: 'Events', version: '1' },
        channels: { events: { messages: { event: { $ref: '#/missing', title: 'Wrong message' } } } },
        operations: { send: { $ref: '#/missing', title: 'Wrong operation' } },
      },
    })
    const source = store.workspace.documents.events as AsyncApiDocument
    expect(resolveAsyncApiMessage(source, 'events', 'event')).toBeUndefined()
    expect(resolveAsyncApiOperation(source, 'send')).toBeUndefined()
  })

  it('resolves a channel by its map key', () => {
    expect(resolveAsyncApiChannel(document, 'userSignedup')?.title).toBe('User signed up')
  })

  it('returns undefined for an unknown channel', () => {
    expect(resolveAsyncApiChannel(document, 'missing')).toBeUndefined()
  })
})

describe('resolveAsyncApiMessage', () => {
  it('resolves a message from its channel', () => {
    expect(resolveAsyncApiMessage(document, 'userSignedup', 'UserMessage')?.title).toBe('User')
  })

  it('returns undefined for an unknown message', () => {
    expect(resolveAsyncApiMessage(document, 'userSignedup', 'missing')).toBeUndefined()
  })
})

describe('resolveAsyncApiOperation', () => {
  it('resolves an operation by its map key', () => {
    expect(resolveAsyncApiOperation(document, 'sendUserSignedUp')?.title).toBe('Send user signed up')
  })

  it('returns undefined for an unknown operation', () => {
    expect(resolveAsyncApiOperation(document, 'missing')).toBeUndefined()
  })

  it('applies later traits and operation overrides without changing the source', () => {
    const operation = {
      action: 'receive',
      channel: { $ref: '#/channels/events' },
      summary: 'Own summary',
      traits: [
        { title: 'Initial title', summary: 'Trait summary', description: 'Initial description' },
        { $ref: '#/traits/later', '$ref-value': { title: 'Later title', description: 'Later description' } },
      ],
    }
    const source = { operations: { watch: operation } } as unknown as AsyncApiDocument
    const resolved = resolveAsyncApiOperation(source, 'watch')
    expect([resolved?.title, resolved?.summary, resolved?.description]).toStrictEqual([
      'Later title',
      'Own summary',
      'Later description',
    ])
    expect(Object.hasOwn(operation, 'title')).toBe(false)
    expect(Object.hasOwn(operation, 'description')).toBe(false)
  })
})
