import { describe, expect, it } from 'vitest'

import { upgradeFromThreeToThreeOne } from './upgrade-from-three-to-three-one'

describe('upgradeFromThreeToThreeOne', () => {
  it('bumps an AsyncAPI 3.0 document to 3.1.0', () => {
    const document = upgradeFromThreeToThreeOne({ asyncapi: '3.0.0', info: {} })

    expect(document.asyncapi).toBe('3.1.0')
  })

  it('leaves non-3.0 documents untouched', () => {
    const document = { asyncapi: '2.6.0', info: {} }

    expect(upgradeFromThreeToThreeOne(document)).toBe(document)
  })

  // Carryover ---------------------------------------------------------------
  //
  // AsyncAPI 3.1 is backward-compatible with 3.0 — everything except the version string and the
  // (technically-already-invalid) component-scope operation message refs should carry over verbatim.

  it('leaves servers untouched', () => {
    const document = upgradeFromThreeToThreeOne({
      asyncapi: '3.0.0',
      servers: {
        production: {
          host: 'broker.example.com',
          protocol: 'mqtt',
          security: [{ $ref: '#/components/securitySchemes/apiKey' }],
        },
      },
    })

    expect(document.servers).toEqual({
      production: {
        host: 'broker.example.com',
        protocol: 'mqtt',
        security: [{ $ref: '#/components/securitySchemes/apiKey' }],
      },
    })
  })

  it('leaves channels untouched', () => {
    const document = upgradeFromThreeToThreeOne({
      asyncapi: '3.0.0',
      channels: {
        userSignedUp: {
          address: 'user/signedup',
          messages: { userSignedUp: { $ref: '#/components/messages/userSignedUp' } },
          parameters: { userId: { $ref: '#/components/parameters/userId' } },
          bindings: { amqp: { is: 'queue' } },
        },
      },
    })

    expect(document.channels).toEqual({
      userSignedUp: {
        address: 'user/signedup',
        messages: { userSignedUp: { $ref: '#/components/messages/userSignedUp' } },
        parameters: { userId: { $ref: '#/components/parameters/userId' } },
        bindings: { amqp: { is: 'queue' } },
      },
    })
  })

  it('leaves components untouched', () => {
    const document = upgradeFromThreeToThreeOne({
      asyncapi: '3.0.0',
      components: {
        messages: { userSignedUp: { payload: { type: 'object' } } },
        schemas: { User: { type: 'object' } },
        securitySchemes: { apiKey: { type: 'apiKey', in: 'user' } },
      },
    })

    expect(document.components).toEqual({
      messages: { userSignedUp: { payload: { type: 'object' } } },
      schemas: { User: { type: 'object' } },
      securitySchemes: { apiKey: { type: 'apiKey', in: 'user' } },
    })
  })

  // Operation message refs --------------------------------------------------
  //
  // 3.0 *required* operation `messages` to ref `#/channels/{id}/messages/{name}`, but the spec's
  // own examples used `#/components/messages/{name}` until 3.1 fixed them. Many real-world 3.0
  // docs took the (incorrect) example form. We canonicalize on upgrade.

  it('leaves operation messages refs alone when they are already channel-scoped', () => {
    const document = upgradeFromThreeToThreeOne({
      asyncapi: '3.0.0',
      channels: {
        userSignedUp: {
          address: 'user/signedup',
          messages: { userSignedUp: { $ref: '#/components/messages/userSignedUp' } },
        },
      },
      operations: {
        onUserSignedUp: {
          action: 'receive',
          channel: { $ref: '#/channels/userSignedUp' },
          messages: [{ $ref: '#/channels/userSignedUp/messages/userSignedUp' }],
        },
      },
    })

    expect((document.operations as { onUserSignedUp: { messages: unknown } }).onUserSignedUp.messages).toEqual([
      { $ref: '#/channels/userSignedUp/messages/userSignedUp' },
    ])
  })

  it('rewrites operation messages refs from components scope to channel scope', () => {
    const document = upgradeFromThreeToThreeOne({
      asyncapi: '3.0.0',
      channels: {
        userSignedUp: {
          address: 'user/signedup',
          messages: { userSignedUp: { $ref: '#/components/messages/userSignedUp' } },
        },
      },
      operations: {
        onUserSignedUp: {
          action: 'receive',
          channel: { $ref: '#/channels/userSignedUp' },
          messages: [{ $ref: '#/components/messages/userSignedUp' }],
        },
      },
    })

    expect((document.operations as { onUserSignedUp: { messages: unknown } }).onUserSignedUp.messages).toEqual([
      { $ref: '#/channels/userSignedUp/messages/userSignedUp' },
    ])
  })

  it('rewrites multiple operation message refs', () => {
    const document = upgradeFromThreeToThreeOne({
      asyncapi: '3.0.0',
      channels: {
        userEvents: {
          address: 'user/events',
          messages: {
            signup: { $ref: '#/components/messages/signup' },
            login: { $ref: '#/components/messages/login' },
          },
        },
      },
      operations: {
        onUserEvent: {
          action: 'receive',
          channel: { $ref: '#/channels/userEvents' },
          messages: [{ $ref: '#/components/messages/signup' }, { $ref: '#/components/messages/login' }],
        },
      },
    })

    expect((document.operations as { onUserEvent: { messages: unknown } }).onUserEvent.messages).toEqual([
      { $ref: '#/channels/userEvents/messages/signup' },
      { $ref: '#/channels/userEvents/messages/login' },
    ])
  })

  it('adds the message to channel.messages when missing during rewrite', () => {
    const document = upgradeFromThreeToThreeOne({
      asyncapi: '3.0.0',
      channels: {
        userSignedUp: {
          address: 'user/signedup',
          messages: {},
        },
      },
      operations: {
        onUserSignedUp: {
          action: 'receive',
          channel: { $ref: '#/channels/userSignedUp' },
          messages: [{ $ref: '#/components/messages/userSignedUp' }],
        },
      },
    })

    expect((document.channels as { userSignedUp: { messages: unknown } }).userSignedUp.messages).toEqual({
      userSignedUp: { $ref: '#/components/messages/userSignedUp' },
    })
    expect((document.operations as { onUserSignedUp: { messages: unknown } }).onUserSignedUp.messages).toEqual([
      { $ref: '#/channels/userSignedUp/messages/userSignedUp' },
    ])
  })

  it('rewrites reply.messages refs the same way', () => {
    const document = upgradeFromThreeToThreeOne({
      asyncapi: '3.0.0',
      channels: {
        userSignup: {
          address: 'user/signup',
          messages: { userSignedUp: { $ref: '#/components/messages/userSignedUp' } },
        },
        userSignupReply: {
          address: 'user/signup/reply',
          messages: { userSignedUpReply: { $ref: '#/components/messages/userSignedUpReply' } },
        },
      },
      operations: {
        sendUserSignUp: {
          action: 'send',
          channel: { $ref: '#/channels/userSignup' },
          messages: [{ $ref: '#/components/messages/userSignedUp' }],
          reply: {
            channel: { $ref: '#/channels/userSignupReply' },
            messages: [{ $ref: '#/components/messages/userSignedUpReply' }],
          },
        },
      },
    })

    expect(
      (document.operations as { sendUserSignUp: { reply: { messages: unknown } } }).sendUserSignUp.reply.messages,
    ).toEqual([{ $ref: '#/channels/userSignupReply/messages/userSignedUpReply' }])
  })

  it('falls back to the operation channel when reply.channel is omitted', () => {
    const document = upgradeFromThreeToThreeOne({
      asyncapi: '3.0.0',
      channels: {
        ping: {
          address: 'ping',
          messages: {
            ping: { $ref: '#/components/messages/ping' },
            pong: { $ref: '#/components/messages/pong' },
          },
        },
      },
      operations: {
        sendPing: {
          action: 'send',
          channel: { $ref: '#/channels/ping' },
          messages: [{ $ref: '#/components/messages/ping' }],
          reply: {
            // No `channel` — reply runs on the parent operation's channel.
            messages: [{ $ref: '#/components/messages/pong' }],
          },
        },
      },
    })

    expect((document.operations as { sendPing: { reply: { messages: unknown } } }).sendPing.reply.messages).toEqual([
      { $ref: '#/channels/ping/messages/pong' },
    ])
  })

  it('dedupes operation messages when both forms point at the same message', () => {
    const document = upgradeFromThreeToThreeOne({
      asyncapi: '3.0.0',
      channels: {
        userSignedUp: {
          address: 'user/signedup',
          messages: { userSignedUp: { $ref: '#/components/messages/userSignedUp' } },
        },
      },
      operations: {
        onUserSignedUp: {
          action: 'receive',
          channel: { $ref: '#/channels/userSignedUp' },
          messages: [
            { $ref: '#/channels/userSignedUp/messages/userSignedUp' },
            { $ref: '#/components/messages/userSignedUp' },
          ],
        },
      },
    })

    expect((document.operations as { onUserSignedUp: { messages: unknown } }).onUserSignedUp.messages).toEqual([
      { $ref: '#/channels/userSignedUp/messages/userSignedUp' },
    ])
  })

  it('leaves message refs alone when the operation has no channel ref', () => {
    const document = upgradeFromThreeToThreeOne({
      asyncapi: '3.0.0',
      operations: {
        orphan: {
          action: 'send',
          messages: [{ $ref: '#/components/messages/something' }],
        },
      },
    })

    expect((document.operations as { orphan: { messages: unknown } }).orphan.messages).toEqual([
      { $ref: '#/components/messages/something' },
    ])
  })
})
