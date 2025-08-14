import { describe, it, expect, vi } from 'vitest'

// Mock the platform helper before importing the module under test
vi.mock('@scalar/helpers/general/is-mac-os', () => ({
  isMacOS: vi.fn(),
}))

import { getModifierKeySymbol, formatHotkeySymbols, getKeyLabel } from './formatHotkey'
import { isMacOS } from '@scalar/helpers/general/is-mac-os'

const mockIsMacOS = vi.mocked(isMacOS)

describe('formatHotkey', () => {
  describe('getModifierKeySymbol', () => {
    it('returns Command symbol on macOS for Meta modifier', () => {
      mockIsMacOS.mockReturnValue(true)
      expect(getModifierKeySymbol('Meta')).toBe('⌘')
    })

    it('returns ctrl on non-macOS for Meta modifier', () => {
      mockIsMacOS.mockReturnValue(false)
      expect(getModifierKeySymbol('Meta')).toBe('ctrl')
    })

    it('returns Command symbol on macOS for default modifier', () => {
      mockIsMacOS.mockReturnValue(true)
      expect(getModifierKeySymbol('default')).toBe('⌘')
    })

    it('returns ctrl on non-macOS for default modifier', () => {
      mockIsMacOS.mockReturnValue(false)
      expect(getModifierKeySymbol('default')).toBe('ctrl')
    })
  })

  describe('formatHotkeySymbols', () => {
    it('formats single modifier with hotkey', () => {
      mockIsMacOS.mockReturnValue(false)
      const result = formatHotkeySymbols('K', ['Meta'])
      expect(result).toStrictEqual(['ctrl', 'K'])
    })

    it('formats multiple modifiers with hotkey', () => {
      mockIsMacOS.mockReturnValue(false)
      const result = formatHotkeySymbols('K', ['Meta', 'Shift'])
      expect(result).toStrictEqual(['ctrl', '⇧', 'K'])
    })

    it('formats hotkey without modifiers', () => {
      const result = formatHotkeySymbols('K', [])
      expect(result).toStrictEqual(['K'])
    })

    it('handles special keys with modifiers', () => {
      mockIsMacOS.mockReturnValue(true)
      const result = formatHotkeySymbols('↵', ['Meta'])
      expect(result).toStrictEqual(['⌘', '↵'])
    })

    it('formats complex modifier combination on macOS', () => {
      mockIsMacOS.mockReturnValue(true)
      const result = formatHotkeySymbols('K', ['Meta', 'Shift', 'Alt'])
      expect(result).toStrictEqual(['⌘', '⇧', '⌥', 'K'])
    })
  })

  describe('getKeyLabel', () => {
    it('returns correct label for modifier keys', () => {
      expect(getKeyLabel('⇧')).toBe('Shift')
      expect(getKeyLabel('⌥')).toBe('Option')
      expect(getKeyLabel('^')).toBe('Control')
    })

    it('returns correct label for other keys', () => {
      expect(getKeyLabel('A')).toBe('A')
      expect(getKeyLabel('1')).toBe('1')
      expect(getKeyLabel(' ')).toBe(' ')
    })
  })
})
