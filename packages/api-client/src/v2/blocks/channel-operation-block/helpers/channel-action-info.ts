/** Visual styling for AsyncAPI channel operation action badges in the connection bar. */
type ChannelActionInfo = {
  short: string
  colorClass: `text-${string}`
  colorVar: `var(--scalar-color-${string})`
}

const CHANNEL_ACTIONS = {
  send: {
    short: 'SEND',
    colorClass: 'text-green',
    colorVar: 'var(--scalar-color-green)',
  },
  receive: {
    short: 'RECV',
    colorClass: 'text-blue',
    colorVar: 'var(--scalar-color-blue)',
  },
} as const satisfies Record<'send' | 'receive', ChannelActionInfo>

export const getChannelActionInfo = (action: 'send' | 'receive'): ChannelActionInfo => CHANNEL_ACTIONS[action]
