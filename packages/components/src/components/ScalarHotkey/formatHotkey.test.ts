import { describe, it, expect, vi } from 'vitest'

// Mock the platform helper before importing the module under test
vi.mock('@scalar/helpers/general/is-mac-os', () => ({
  isMacOS: vi.fn(),
}))

import { getModifierKeySymbol, formatHotkeySymbols, getModifierKeyLabel, formatScreenReaderLabel } from './formatHotkey'
import { isMacOS } from '@scalar/helpers/general/is-mac-os'

const mockIsMacOS = vi.mocked(isMacOS)

describe('formatHotkey', () => {
  describe('getModifierKeySymbol', () => {
    it('returns Command symbol on macOS for Meta modifier', () => {
      mockIsMacOS.mockReturnValue(true)
      expect(getModifierKeySymbol('Meta')).toBe('⌘')
    })

    it('returns Control symbol on non-macOS for Meta modifier', () => {
      mockIsMacOS.mockReturnValue(false)
      expect(getModifierKeySymbol('Meta')).toBe('^')
    })

    it('returns Command symbol on macOS for default modifier', () => {
      mockIsMacOS.mockReturnValue(true)
      expect(getModifierKeySymbol('default')).toBe('⌘')
    })

    it('returns Control symbol on non-macOS for default modifier', () => {
      mockIsMacOS.mockReturnValue(false)
      expect(getModifierKeySymbol('default')).toBe('^')
    })
  })

  describe('formatHotkeySymbols', () => {
    it('formats single modifier with hotkey', () => {
      mockIsMacOS.mockReturnValue(false)
      const result = formatHotkeySymbols('K', ['Meta'])
      expect(result).toBe('^ K')
    })

    it('formats multiple modifiers with hotkey', () => {
      mockIsMacOS.mockReturnValue(false)
      const result = formatHotkeySymbols('K', ['Meta', 'Shift'])
      expect(result).toBe('^+⇧ K')
    })

    it('formats hotkey without modifiers', () => {
      const result = formatHotkeySymbols('K', [])
      expect(result).toBe('K')
    })

    it('handles special keys with modifiers', () => {
      mockIsMacOS.mockReturnValue(true)
      const result = formatHotkeySymbols('↵', ['Meta'])
      expect(result).toBe('⌘ ↵')
    })

    it('formats complex modifier combination on macOS', () => {
      mockIsMacOS.mockReturnValue(true)
      const result = formatHotkeySymbols('K', ['Meta', 'Shift', 'Alt'])
      expect(result).toBe('⌘+⇧+⌥ K')
    })
  })

  describe('getModifierKeyLabel', () => {
    it('returns Command for Meta modifier on macOS', () => {
      mockIsMacOS.mockReturnValue(true)
      expect(getModifierKeyLabel('Meta')).toBe('Command')
    })

    it('returns Control for Meta modifier on non-macOS', () => {
      mockIsMacOS.mockReturnValue(false)
      expect(getModifierKeyLabel('Meta')).toBe('Control')
    })

    it('returns Command for default modifier on macOS', () => {
      mockIsMacOS.mockReturnValue(true)
      expect(getModifierKeyLabel('default')).toBe('Command')
    })

    it('returns Control for default modifier on non-macOS', () => {
      mockIsMacOS.mockReturnValue(false)
      expect(getModifierKeyLabel('default')).toBe('Control')
    })

    it('returns correct label for other modifiers', () => {
      expect(getModifierKeyLabel('Shift')).toBe('Shift')
      expect(getModifierKeyLabel('Alt')).toBe('Alt')
      expect(getModifierKeyLabel('Control')).toBe('Control')
    })
  })

  describe('formatScreenReaderLabel', () => {
    it('formats single modifier with hotkey for screen readers', () => {
      mockIsMacOS.mockReturnValue(false)
      const result = formatScreenReaderLabel('K', ['Meta'])
      expect(result).toBe('Control K')
    })

    it('formats multiple modifiers with hotkey for screen readers', () => {
      mockIsMacOS.mockReturnValue(false)
      const result = formatScreenReaderLabel('K', ['Meta', 'Shift'])
      expect(result).toBe('Control+Shift K')
    })

    it('formats hotkey without modifiers for screen readers', () => {
      const result = formatScreenReaderLabel('K', [])
      expect(result).toBe('K')
    })

    it('converts special symbols to readable labels', () => {
      mockIsMacOS.mockReturnValue(false)
      const result = formatScreenReaderLabel('↵', ['Meta'])
      expect(result).toBe('Control Enter')
    })

    it('handles complex combinations on macOS', () => {
      mockIsMacOS.mockReturnValue(true)
      const result = formatScreenReaderLabel('↵', ['Meta', 'Shift', 'Alt'])
      expect(result).toBe('Command+Shift+Alt Enter')
    })

    it('handles arrow keys correctly', () => {
      mockIsMacOS.mockReturnValue(true)
      expect(formatScreenReaderLabel('←', ['Meta'])).toBe('Command Left Arrow')
      expect(formatScreenReaderLabel('→', ['Meta'])).toBe('Command Right Arrow')
      expect(formatScreenReaderLabel('↑', ['Meta'])).toBe('Command Up Arrow')
      expect(formatScreenReaderLabel('↓', ['Meta'])).toBe('Command Down Arrow')
    })

    it('handles unknown symbols gracefully', () => {
      mockIsMacOS.mockReturnValue(false)
      const result = formatScreenReaderLabel('$', ['Meta'])
      expect(result).toBe('Control $')
    })
  })
})
