import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { describe, expect, it } from 'vitest'

import { getChannelOperations } from '@/channel-example/get-channel-operations'

const documentWithOperationRef = {
  asyncapi: '3.0.0',
  info: { title: 'Operation ref', version: '1.0.0' },
  channels: {
    echo: { address: '', messages: {} },
    other: { address: '', messages: {} },
  },
  operations: {
    sendEcho: {
      $ref: '#/components/operations/BaseSend',
      '$ref-value': {
        action: 'send',
        channel: { $ref: '#/channels/echo' },
      },
      channel: { $ref: '#/channels/other' },
      action: 'send',
    },
  },
  components: {
    operations: {
      BaseSend: {
        action: 'send',
        channel: { $ref: '#/channels/other' },
      },
    },
  },
} as unknown as AsyncApiDocument

describe('getChannelOperations', () => {
  it('resolves operation $ref via JSON Reference without merging sibling properties', () => {
    const echoOperations = getChannelOperations(documentWithOperationRef, 'echo')
    const otherOperations = getChannelOperations(documentWithOperationRef, 'other')

    expect(echoOperations.map(({ operationName, action }) => ({ operationName, action }))).toStrictEqual([
      { operationName: 'sendEcho', action: 'send' },
    ])
    expect(echoOperations[0]?.operation.channel).toStrictEqual({ $ref: '#/channels/echo' })
    expect(otherOperations).toStrictEqual([])
  })
})
