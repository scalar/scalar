import { beforeEach, describe, expect, it, vi } from 'vitest'

import { hasModifier } from './has-modifier'
import { isMacOS } from './is-mac-os'

// Mock the isMacOS function
vi.mock('./is-mac-os', () => ({
  isMacOS: vi.fn(),
}))

const mockIsMacOS = vi.mocked(isMacOS)

describe('hasModifier', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('on macOS', () => {
    beforeEach(() => {
      mockIsMacOS.mockReturnValue(true)
    })

    it('should return true when metaKey is pressed', () => {
      const mockEvent = {
        metaKey: true,
        ctrlKey: false,
      } as KeyboardEvent

      const result = hasModifier(mockEvent)

      expect(result).toBe(true)
    })

    it('should return false when metaKey is not pressed', () => {
      const mockEvent = {
        metaKey: false,
        ctrlKey: true, // ctrlKey is pressed but should be ignored on macOS
      } as KeyboardEvent

      const result = hasModifier(mockEvent)

      expect(result).toBe(false)
    })

    it('should return false when neither key is pressed', () => {
      const mockEvent = {
        metaKey: false,
        ctrlKey: false,
      } as KeyboardEvent

      const result = hasModifier(mockEvent)

      expect(result).toBe(false)
    })
  })

  describe('on non-macOS (Windows/Linux)', () => {
    beforeEach(() => {
      mockIsMacOS.mockReturnValue(false)
    })

    it('should return true when ctrlKey is pressed', () => {
      const mockEvent = {
        metaKey: false,
        ctrlKey: true,
      } as KeyboardEvent

      const result = hasModifier(mockEvent)

      expect(result).toBe(true)
    })

    it('should return false when ctrlKey is not pressed', () => {
      const mockEvent = {
        metaKey: true, // metaKey is pressed but should be ignored on non-macOS
        ctrlKey: false,
      } as KeyboardEvent

      const result = hasModifier(mockEvent)

      expect(result).toBe(false)
    })

    it('should return false when neither key is pressed', () => {
      const mockEvent = {
        metaKey: false,
        ctrlKey: false,
      } as KeyboardEvent

      const result = hasModifier(mockEvent)

      expect(result).toBe(false)
    })
  })
})
