import type { AsyncApiDocument, AsyncApiOperationObject } from '@scalar/types/asyncapi/3.1'
import { describe, expect, it } from 'vitest'

import { resolveOperationChannel } from '@/channel-example/resolve-operation-channel'

describe('resolveOperationChannel', () => {
  it('decodes JSON Pointer escapes when resolving the channel key from a $ref', () => {
    // Channel name contains both `/` (escaped as `~1`) and `~` (escaped as `~0`).
    const channelName = 'rooms/general~v2'
    const document = {
      asyncapi: '3.0.0',
      info: { title: 'Pointer escapes', version: '1.0.0' },
      channels: {
        [channelName]: { address: '/rooms/general' },
      },
      operations: {
        listen: {
          action: 'receive',
          channel: { $ref: '#/channels/rooms~1general~0v2' },
        },
      },
    } as unknown as AsyncApiDocument

    const operation = document.operations?.listen as AsyncApiOperationObject
    const resolved = resolveOperationChannel(document, operation)

    expect(resolved?.channelName).toBe(channelName)
    expect(resolved?.channelAddress).toBe('/rooms/general')
  })

  it('does not treat extra JSON Pointer segments as part of the channel name', () => {
    // The ref points at a message under the channel, not the channel itself.
    // Without the strict prefix check, the trailing `/messages/foo` segments would
    // leak into the channel name and falsely match `document.channels`.
    const document = {
      asyncapi: '3.0.0',
      info: { title: 'Invalid ref', version: '1.0.0' },
      channels: {
        echo: { address: 'echo' },
        'echo/messages/foo': { address: '/leak' },
      },
      operations: {
        listen: {
          action: 'receive',
          channel: {
            $ref: '#/channels/echo/messages/foo',
            '$ref-value': { address: '/leak' },
          },
        },
      },
    } as unknown as AsyncApiDocument

    const operation = document.operations?.listen as AsyncApiOperationObject
    const resolved = resolveOperationChannel(document, operation)

    expect(resolved?.channelName).not.toBe('echo/messages/foo')
  })
})
