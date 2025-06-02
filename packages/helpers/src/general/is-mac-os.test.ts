import { describe, expect, it } from 'vitest'

import { isMacOS } from './is-mac-os'

describe('isMacOS', () => {
  it('returns true when userAgentData indicates macOS', () => {
    // Mock modern userAgentData API
    Object.defineProperty(global, 'navigator', {
      value: {
        userAgentData: {
          platform: 'macOS',
        },
      },
      writable: true,
    })

    expect(isMacOS()).toBe(true)
  })

  it('returns true when userAgentData indicates MacIntel', () => {
    // Mock modern userAgentData API with MacIntel
    Object.defineProperty(global, 'navigator', {
      value: {
        userAgentData: {
          platform: 'MacIntel',
        },
      },
      writable: true,
    })

    expect(isMacOS()).toBe(true)
  })

  it('returns false when userAgentData indicates Windows', () => {
    // Mock modern userAgentData API with Windows
    Object.defineProperty(global, 'navigator', {
      value: {
        userAgentData: {
          platform: 'Windows',
        },
      },
      writable: true,
    })

    expect(isMacOS()).toBe(false)
  })

  it('falls back to userAgent when userAgentData is not available', () => {
    // Mock only userAgent
    Object.defineProperty(global, 'navigator', {
      value: {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      writable: true,
    })

    expect(isMacOS()).toBe(true)
  })

  it('returns false when userAgent indicates Windows', () => {
    // Mock only userAgent with Windows
    Object.defineProperty(global, 'navigator', {
      value: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      writable: true,
    })

    expect(isMacOS()).toBe(false)
  })

  it('returns false when navigator is undefined', () => {
    // Mock navigator as undefined
    Object.defineProperty(global, 'navigator', {
      value: undefined,
      writable: true,
    })

    expect(isMacOS()).toBe(false)
  })
})
