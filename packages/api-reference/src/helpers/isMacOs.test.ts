import { describe, expect, it } from 'vitest'

import { isMacOs } from './isMacOs'

describe('isMacOs', () => {
  it('returns true on macOS', () => {
    // Mock navigator.platform
    Object.defineProperty(global, 'navigator', {
      value: {
        platform: 'MacIntel',
      },
      writable: true,
    })

    expect(isMacOs()).toBe(true)
  })

  it('returns false on Windows', () => {
    // Mock navigator.platform
    Object.defineProperty(global, 'navigator', {
      value: {
        platform: 'Win32',
      },
      writable: true,
    })

    expect(isMacOs()).toBe(false)
  })

  it('returns false when navigator is undefined', () => {
    // Mock navigator as undefined
    Object.defineProperty(global, 'navigator', {
      value: undefined,
      writable: true,
    })

    expect(isMacOs()).toBe(false)
  })
})
