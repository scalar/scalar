import type { AsyncApiChannelObject, AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { describe, expect, it } from 'vitest'

import { getAllChannelMessages, getSendChannelMessages } from '@/channel-example/get-all-channel-messages'
import { getChannelOperations } from '@/channel-example/get-channel-operations'

const channel = {
  address: '/api/rooms/{roomId}/ws',
  messages: {
    sendMessage: { name: 'SendMessage', payload: { type: 'object' } },
    welcome: { name: 'Welcome', payload: { type: 'object' } },
    newMessage: { name: 'NewMessage', payload: { type: 'object' } },
  },
} as unknown as AsyncApiChannelObject

const document = {
  asyncapi: '3.0.0',
  info: { title: 'Room', version: '1.0.0' },
  channels: { room: channel },
  operations: {
    // Described from the server's point of view: it receives what the client sends.
    sendMessage: {
      action: 'receive',
      channel: { $ref: '#/channels/room' },
      messages: [{ $ref: '#/channels/room/messages/sendMessage' }],
    },
    // The server sends these events; the client only receives them.
    receiveEvents: {
      action: 'send',
      channel: { $ref: '#/channels/room' },
      messages: [{ $ref: '#/channels/room/messages/welcome' }, { $ref: '#/channels/room/messages/newMessage' }],
    },
  },
} as unknown as AsyncApiDocument

describe('get-all-channel-messages', () => {
  it('lists every message defined on a channel', () => {
    expect(getAllChannelMessages(document, channel).map(({ name }) => name)).toEqual([
      'sendMessage',
      'welcome',
      'newMessage',
    ])
  })

  it('returns only messages the client can send (operations the server receives)', () => {
    const operations = getChannelOperations(document, 'room')

    expect(getSendChannelMessages(document, 'room', channel, operations).map(({ name }) => name)).toEqual([
      'sendMessage',
    ])
  })

  it('returns nothing when no operation is sendable from the client', () => {
    const receiveOnlyOperations = getChannelOperations(document, 'room').filter(({ action }) => action === 'send')

    expect(getSendChannelMessages(document, 'room', channel, receiveOnlyOperations)).toEqual([])
  })
})
