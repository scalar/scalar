import { describe, expect, it } from 'vitest'

import { getChannelActionInfo } from './channel-action-info'

describe('getChannelActionInfo', () => {
  it('uses green text styling for send operations', () => {
    expect(getChannelActionInfo('send')).toEqual({
      short: 'SEND',
      colorClass: 'text-green',
      colorVar: 'var(--scalar-color-green)',
    })
  })

  it('uses blue text styling for receive operations', () => {
    expect(getChannelActionInfo('receive')).toEqual({
      short: 'RECV',
      colorClass: 'text-blue',
      colorVar: 'var(--scalar-color-blue)',
    })
  })
})
