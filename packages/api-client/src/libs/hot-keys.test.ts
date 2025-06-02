import { describe, it, expect, vi, afterEach } from 'vitest'
import { handleHotKeyDown, getModifiers, isInput } from './hot-keys'
import { isMacOS } from '@scalar/helpers/general/is-mac-os'
import type { EventBus } from '@/libs/event-bus'

// Mock isMacOS
vi.mock('@scalar/helpers/general/is-mac-os', () => ({
  isMacOS: vi.fn().mockReturnValue(false),
}))

describe('hot-keys', () => {
  // Helper to create keyboard events
  const createKeyboardEvent = (key: string, options: Partial<KeyboardEvent> = {}) => {
    return new KeyboardEvent('keydown', {
      key,
      ...options,
    })
  }

  const mockEventBus = {
    emit: vi.fn(),
  } as unknown as EventBus<Partial<Record<string, KeyboardEvent>>>

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('handleHotKeyDown', () => {
    describe('isInput', () => {
      it('identifies input elements', () => {
        const input = document.createElement('input')
        const event = new KeyboardEvent('keydown', {})
        Object.defineProperty(event, 'target', { value: input })
        expect(isInput(event)).toBe(true)
      })

      it('identifies textarea elements', () => {
        const textarea = document.createElement('textarea')
        const event = new KeyboardEvent('keydown', {})
        Object.defineProperty(event, 'target', { value: textarea })
        expect(isInput(event)).toBe(true)
      })

      it('identifies contenteditable elements', () => {
        const div = document.createElement('div')
        div.contentEditable = 'true'
        const event = new KeyboardEvent('keydown', {})
        Object.defineProperty(event, 'target', { value: div })
        expect(isInput(event)).toBe(true)
      })

      it('returns false for non-input elements', () => {
        const div = document.createElement('div')
        const event = new KeyboardEvent('keydown', {})
        Object.defineProperty(event, 'target', { value: div })
        expect(isInput(event)).toBe(false)
      })

      it('returns false for null target', () => {
        const event = new KeyboardEvent('keydown', {})
        Object.defineProperty(event, 'target', { value: null })
        expect(isInput(event)).toBe(false)
      })

      it('handles elements with contentEditable="false"', () => {
        const div = document.createElement('div')
        div.contentEditable = 'false'
        const event = new KeyboardEvent('keydown', {})
        Object.defineProperty(event, 'target', { value: div })
        expect(isInput(event)).toBe(false)
      })
    })

    it('handles Escape key without modifiers', () => {
      const event = createKeyboardEvent('Escape')
      handleHotKeyDown(event, mockEventBus)
      expect(mockEventBus.emit).toHaveBeenCalledWith({ closeModal: event })
    })

    it('handles Enter to executeRequest on windows/linux', () => {
      const event = createKeyboardEvent('Enter', { ctrlKey: true })
      handleHotKeyDown(event, mockEventBus)
      expect(mockEventBus.emit).toHaveBeenCalledWith({ executeRequest: event })
    })

    it('handles Enter to executeRequest on macos', () => {
      vi.mocked(isMacOS).mockReturnValue(true)
      const event = createKeyboardEvent('Enter', { metaKey: true })
      handleHotKeyDown(event, mockEventBus)

      expect(mockEventBus.emit).toHaveBeenCalledWith({ executeRequest: event })
    })

    it('ignores hotkeys when in input fields', () => {
      const event = createKeyboardEvent('b')
      Object.defineProperty(event, 'target', {
        value: document.createElement('input'),
      })

      handleHotKeyDown(event, mockEventBus)
      expect(mockEventBus.emit).not.toHaveBeenCalled()
    })

    it('allows hotkeys with modifiers in inputs', () => {
      const event = createKeyboardEvent('b', { ctrlKey: true })
      Object.defineProperty(event, 'target', {
        value: document.createElement('input'),
      })

      handleHotKeyDown(event, mockEventBus)
      expect(mockEventBus.emit).toHaveBeenCalledWith({ toggleSidebar: event })
    })

    it('triggers the command palette windows/linux', () => {
      const event = createKeyboardEvent('k', { ctrlKey: true })
      handleHotKeyDown(event, mockEventBus)
      expect(mockEventBus.emit).toHaveBeenCalledWith({ openCommandPalette: event })
    })

    it('triggers the command palette macos', () => {
      vi.mocked(isMacOS).mockReturnValue(true)
      const eventMacOS = createKeyboardEvent('k', { metaKey: true })
      handleHotKeyDown(eventMacOS, mockEventBus)

      expect(mockEventBus.emit).toHaveBeenCalledWith({ openCommandPalette: eventMacOS })
    })
  })

  describe('getModifiers', () => {
    it('converts default modifier to metaKey on macOS', () => {
      vi.mocked(isMacOS).mockReturnValue(true)
      expect(getModifiers(['default'])).toEqual(['metaKey'])
    })

    it('converts default modifier to ctrlKey on non-macOS', () => {
      vi.mocked(isMacOS).mockReturnValue(false)
      expect(getModifiers(['default'])).toEqual(['ctrlKey'])
    })

    it('handles multiple modifiers correctly', () => {
      expect(getModifiers(['Alt', 'Shift'])).toEqual(['altKey', 'shiftKey'])
    })
  })
})
