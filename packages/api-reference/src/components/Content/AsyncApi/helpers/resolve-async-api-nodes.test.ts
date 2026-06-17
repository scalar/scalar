import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
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
})
