import { describe, expect, it } from 'vitest'

import { getDefaultProxyUrl } from './get-active-proxy-url'

describe('get-default-proxy-url', () => {
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
})
