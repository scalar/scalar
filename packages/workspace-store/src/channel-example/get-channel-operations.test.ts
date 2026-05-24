import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { describe, expect, it } from 'vitest'

import { getChannelOperations } from '@/channel-example/get-channel-operations'

const documentWithSiblingOperationRef = {
  asyncapi: '3.0.0',
  info: { title: 'Sibling ref', version: '1.0.0' },
  channels: {
    echo: { address: '', messages: {} },
    other: { address: '', messages: {} },
  },
  operations: {
    sendEcho: {
      $ref: '#/components/operations/BaseSend',
      '$ref-value': {
        action: 'send',
        channel: { $ref: '#/channels/other' },
      },
      channel: { $ref: '#/channels/echo' },
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
  it('merges sibling properties on operation $ref when matching channels', () => {
    const operations = getChannelOperations(documentWithSiblingOperationRef, 'echo')

    expect(operations.map(({ operationName, action }) => ({ operationName, action }))).toStrictEqual([
      { operationName: 'sendEcho', action: 'send' },
    ])
    expect(operations[0]?.operation.channel).toStrictEqual({ $ref: '#/channels/echo' })
  })
})
