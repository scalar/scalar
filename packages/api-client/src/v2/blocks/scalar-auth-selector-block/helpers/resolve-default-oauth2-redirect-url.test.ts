import { afterEach, describe, expect, it, vi } from 'vitest'

import { resolveDefaultOAuth2RedirectUri } from './resolve-default-oauth2-redirect-url'

describe('resolve-default-oauth2-redirect-url', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the explicit oauth2RedirectUri config value when provided', () => {
    const result = resolveDefaultOAuth2RedirectUri({
      oauth2RedirectUri: 'https://my-app.example.com/oauth/callback',
    })
    expect(result).toBe('https://my-app.example.com/oauth/callback')
  })

  it('returns empty string when window is undefined (non-browser / SSR context)', () => {
    vi.stubGlobal('window', undefined)
    const result = resolveDefaultOAuth2RedirectUri({})
    expect(result).toBe('')
  })

  it('returns empty string for file:// protocol', () => {
    vi.stubGlobal('window', {
      location: { protocol: 'file:', origin: '', pathname: '/index.html' },
    })
    const result = resolveDefaultOAuth2RedirectUri({})
    expect(result).toBe('')
  })

  it('returns origin + pathname in a normal browser context', () => {
    vi.stubGlobal('window', {
      location: {
        protocol: 'https:',
        origin: 'https://app.example.com',
        pathname: '/docs',
      },
    })
    const result = resolveDefaultOAuth2RedirectUri({})
    expect(result).toBe('https://app.example.com/docs')
  })

  it('treats an empty string oauth2RedirectUri as unset and falls through to browser logic', () => {
    vi.stubGlobal('window', {
      location: {
        protocol: 'https:',
        origin: 'https://app.example.com',
        pathname: '/',
      },
    })
    // Empty string is falsy, so the config override is skipped
    const result = resolveDefaultOAuth2RedirectUri({ oauth2RedirectUri: '' })
    expect(result).toBe('https://app.example.com/')
  })
})
