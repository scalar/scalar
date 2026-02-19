import { describe, expect, it } from 'vitest'

import { getActiveProxyUrl, getDefaultProxyUrl } from './get-active-proxy-url'

describe('getDefaultProxyUrl', () => {
  it('returns Scalar proxy URL for web layout', () => {
    expect(getDefaultProxyUrl('web')).toBe('https://proxy.scalar.com')
  })

  it('returns null for desktop layout', () => {
    expect(getDefaultProxyUrl('desktop')).toBe(null)
  })

  it('returns null for modal layout', () => {
    expect(getDefaultProxyUrl('modal')).toBe(null)
  })
})

describe('getActiveProxyUrl', () => {
  it('returns the active proxy url if it is set', () => {
    expect(getActiveProxyUrl('https://proxy.scalar.com', 'web')).toBe('https://proxy.scalar.com')
  })

  it('returns the default proxy url if the active proxy url is not set', () => {
    expect(getActiveProxyUrl(undefined, 'web')).toBe('https://proxy.scalar.com')
  })

  it('returns the null if the active proxy url is set to null', () => {
    expect(getActiveProxyUrl(null, 'web')).toBe(null)
  })
})
