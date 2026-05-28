import type { AsyncApiChannelObject } from '@scalar/types/asyncapi/3.1'
import { describe, expect, it } from 'vitest'

import { getChannelParameters } from '@/channel-example/get-channel-parameters'

describe('getChannelParameters', () => {
  it('collects unique path parameter names from the channel address', () => {
    const channel = {
      address: 'chat/{roomId}/users/{userId}/{roomId}',
      parameters: {
        roomId: { location: '$message.payload#/roomId' },
        userId: { location: '$message.payload#/userId', default: 'guest' },
      },
    } as AsyncApiChannelObject

    const { path } = getChannelParameters(channel)

    expect(Object.keys(path).sort()).toEqual(['roomId', 'userId'])
    expect(path.userId).toBe('guest')
  })

  it('ignores an unclosed brace in the address', () => {
    const channel = {
      address: 'chat/{roomId}/broken/{',
      parameters: {
        roomId: { location: '$message.payload#/roomId', default: 'lobby' },
      },
    } as AsyncApiChannelObject

    const { path } = getChannelParameters(channel)

    expect(path).toEqual({ roomId: 'lobby' })
  })
})
