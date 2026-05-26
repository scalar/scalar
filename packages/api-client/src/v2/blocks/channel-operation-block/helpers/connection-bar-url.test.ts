import { describe, expect, it } from 'vitest'

import { mergeConnectionUrl, splitConnectionUrl } from './connection-bar-url'

describe('splitConnectionUrl', () => {
  it('returns an empty path when the connection URL equals the server base', () => {
    expect(splitConnectionUrl('wss://echo.websocket.org', 'wss://echo.websocket.org')).toEqual({
      base: 'wss://echo.websocket.org',
      path: '',
    })
  })

  it('returns the channel address as the path suffix', () => {
    expect(splitConnectionUrl('wss://galaxy.scalar.com/planets/mars/events', 'wss://galaxy.scalar.com')).toEqual({
      base: 'wss://galaxy.scalar.com',
      path: '/planets/mars/events',
    })
  })
})

describe('mergeConnectionUrl', () => {
  it('rebuilds the full URL from base and path', () => {
    expect(mergeConnectionUrl('wss://echo.websocket.org', '/chat')).toBe('wss://echo.websocket.org/chat')
  })

  it('returns only the base when the path is empty', () => {
    expect(mergeConnectionUrl('wss://echo.websocket.org', '')).toBe('wss://echo.websocket.org')
  })
})
