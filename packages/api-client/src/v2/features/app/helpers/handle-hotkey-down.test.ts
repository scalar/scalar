import { isMacOS } from '@scalar/helpers/general/is-mac-os'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { handleHotkeyDown } from './handle-hotkey-down'

// Mock the isMacOS function
vi.mock('@scalar/helpers/general/is-mac-os', () => ({
  isMacOS: vi.fn(),
}))

describe('handle-hotkey-down', () => {
  let mockEventBus: WorkspaceEventBus

  /**
   * Creates a keyboard event with the specified properties.
   */
  const createKeyboardEvent = (
    key: string,
    modifiers: {
      metaKey?: boolean
      ctrlKey?: boolean
      altKey?: boolean
      shiftKey?: boolean
    } = {},
    target?: HTMLElement,
  ): KeyboardEvent => {
    const event = new KeyboardEvent('keydown', {
      key,
      metaKey: modifiers.metaKey ?? false,
      ctrlKey: modifiers.ctrlKey ?? false,
      altKey: modifiers.altKey ?? false,
      shiftKey: modifiers.shiftKey ?? false,
    })

    if (target) {
      Object.defineProperty(event, 'target', {
        value: target,
        writable: false,
      })
    }

    return event
  }

  /**
   * Creates an HTML element for testing.
   */
  const createElement = (tagName: string, attributes: Record<string, string> = {}): HTMLElement => {
    const element = document.createElement(tagName)
    for (const [key, value] of Object.entries(attributes)) {
      if (key === 'contentEditable') {
        element.contentEditable = value
      } else {
        element.setAttribute(key, value)
      }
    }
    return element
  }

  beforeEach(() => {
    mockEventBus = {
      emit: vi.fn(),
    } as unknown as WorkspaceEventBus
    vi.clearAllMocks()
  })

  it('fires hotkey when correct default modifier is pressed on macOS', () => {
    vi.mocked(isMacOS).mockReturnValue(true)

    const event = createKeyboardEvent('l', { metaKey: true })
    handleHotkeyDown(event, mockEventBus, 'web')

    expect(mockEventBus.emit).toHaveBeenCalledWith('ui:focus:address-bar', undefined)
    expect(mockEventBus.emit).toHaveBeenCalledTimes(1)
  })

  it('fires hotkey when correct default modifier is pressed on Windows/Linux', () => {
    vi.mocked(isMacOS).mockReturnValue(false)

    const event = createKeyboardEvent('l', { ctrlKey: true })
    handleHotkeyDown(event, mockEventBus, 'web')

    expect(mockEventBus.emit).toHaveBeenCalledWith('ui:focus:address-bar', undefined)
    expect(mockEventBus.emit).toHaveBeenCalledTimes(1)
  })

  it('fires hotkey without correct modifiers when not in editable element', () => {
    vi.mocked(isMacOS).mockReturnValue(true)

    // Pressing l without Meta on macOS - still fires when not in editable element
    const event = createKeyboardEvent('l', {})
    handleHotkeyDown(event, mockEventBus, 'web')

    // Hotkeys work without modifiers outside editable elements
    expect(mockEventBus.emit).toHaveBeenCalledWith('ui:focus:address-bar', undefined)
  })

  it('does not fire hotkey for unmapped keys', () => {
    vi.mocked(isMacOS).mockReturnValue(true)

    const event = createKeyboardEvent('x', { metaKey: true })
    handleHotkeyDown(event, mockEventBus, 'web')

    expect(mockEventBus.emit).not.toHaveBeenCalled()
  })

  it('blocks hotkeys in textarea elements without modifiers', () => {
    vi.mocked(isMacOS).mockReturnValue(true)

    const textarea = createElement('textarea')
    const event = createKeyboardEvent('b', {}, textarea)
    handleHotkeyDown(event, mockEventBus, 'web')

    expect(mockEventBus.emit).not.toHaveBeenCalled()
  })

  it('blocks hotkeys in contenteditable elements without modifiers', () => {
    vi.mocked(isMacOS).mockReturnValue(true)

    const contentEditable = createElement('div', { contentEditable: 'true' })
    const event = createKeyboardEvent('b', {}, contentEditable)
    handleHotkeyDown(event, mockEventBus, 'web')

    expect(mockEventBus.emit).not.toHaveBeenCalled()
  })

  it('blocks hotkeys in input elements for regular keys without modifiers', () => {
    vi.mocked(isMacOS).mockReturnValue(true)

    const input = createElement('input')
    const event = createKeyboardEvent('b', {}, input)
    handleHotkeyDown(event, mockEventBus, 'web')

    expect(mockEventBus.emit).not.toHaveBeenCalled()
  })

  it('allows arrow keys in input elements with desktop layout', () => {
    vi.mocked(isMacOS).mockReturnValue(true)

    const input = createElement('input')
    const event = createKeyboardEvent('ArrowDown', {}, input)
    handleHotkeyDown(event, mockEventBus, 'desktop')

    expect(mockEventBus.emit).not.toHaveBeenCalled()
  })

  it('fires hotkey in editable elements when modifier is pressed', () => {
    vi.mocked(isMacOS).mockReturnValue(true)

    const textarea = createElement('textarea')
    const event = createKeyboardEvent('l', { metaKey: true }, textarea)
    handleHotkeyDown(event, mockEventBus, 'web')

    expect(mockEventBus.emit).toHaveBeenCalledWith('ui:focus:address-bar', undefined)
  })

  it('correctly passes payload to event bus for tab navigation', () => {
    vi.mocked(isMacOS).mockReturnValue(true)

    const event = createKeyboardEvent('3', { metaKey: true })
    handleHotkeyDown(event, mockEventBus, 'desktop')

    expect(mockEventBus.emit).toHaveBeenCalledWith('tabs:focus:tab', { index: 2 })
  })

  it('handles multiple modifiers correctly with Alt+Cmd', () => {
    vi.mocked(isMacOS).mockReturnValue(true)

    const event = createKeyboardEvent('ArrowLeft', { metaKey: true, altKey: true })
    handleHotkeyDown(event, mockEventBus, 'desktop')

    expect(mockEventBus.emit).toHaveBeenCalledWith('tabs:navigate:previous', undefined)
  })

  it('fires hotkey with partial modifiers when not in editable element', () => {
    vi.mocked(isMacOS).mockReturnValue(true)

    // ArrowLeft requires both Meta and Alt, but only Meta is pressed
    // Still fires when not in editable element
    const event = createKeyboardEvent('ArrowLeft', { metaKey: true })
    handleHotkeyDown(event, mockEventBus, 'desktop')

    // Hotkeys work without exact modifiers outside editable elements
    expect(mockEventBus.emit).toHaveBeenCalledWith('tabs:navigate:previous', undefined)
  })

  it('handles contenteditable attribute with string value', () => {
    vi.mocked(isMacOS).mockReturnValue(true)

    const div = createElement('div')
    div.setAttribute('contenteditable', 'true')
    const event = createKeyboardEvent('b', {}, div)
    handleHotkeyDown(event, mockEventBus, 'web')

    expect(mockEventBus.emit).not.toHaveBeenCalled()
  })

  it('handles events with non-HTMLElement targets gracefully', () => {
    vi.mocked(isMacOS).mockReturnValue(true)

    const event = createKeyboardEvent('b', { metaKey: true })
    // Override target to be a non-HTMLElement
    Object.defineProperty(event, 'target', {
      value: null,
      writable: false,
    })

    handleHotkeyDown(event, mockEventBus, 'web')

    // Should still fire because modifiers are pressed
    expect(mockEventBus.emit).toHaveBeenCalledWith('ui:toggle:sidebar', undefined)
  })

  it('fires Enter hotkey to send requests with default modifier', () => {
    vi.mocked(isMacOS).mockReturnValue(true)

    const event = createKeyboardEvent('Enter', { metaKey: true })
    handleHotkeyDown(event, mockEventBus, 'web')

    expect(mockEventBus.emit).toHaveBeenCalledWith('operation:send:request', undefined)
  })

  it('opens command palette with correct payload for addOperation', () => {
    vi.mocked(isMacOS).mockReturnValue(false)

    const event = createKeyboardEvent('k', { ctrlKey: true })
    handleHotkeyDown(event, mockEventBus, 'web')

    expect(mockEventBus.emit).toHaveBeenCalledWith('ui:open:command-palette', 'addOperation')
  })

  it('uses desktop-specific hotkeys in desktop layout', () => {
    vi.mocked(isMacOS).mockReturnValue(true)

    const event = createKeyboardEvent('f', { metaKey: true })
    handleHotkeyDown(event, mockEventBus, 'desktop')

    expect(mockEventBus.emit).toHaveBeenCalledWith('ui:focus:search', undefined)
  })

  it('uses web-specific hotkeys in web layout', () => {
    vi.mocked(isMacOS).mockReturnValue(true)

    const event = createKeyboardEvent('l', { metaKey: true })
    handleHotkeyDown(event, mockEventBus, 'web')

    expect(mockEventBus.emit).toHaveBeenCalledWith('ui:focus:address-bar', undefined)
  })

  it('opens new tab with desktop layout', () => {
    vi.mocked(isMacOS).mockReturnValue(true)

    const event = createKeyboardEvent('t', { metaKey: true })
    handleHotkeyDown(event, mockEventBus, 'desktop')

    expect(mockEventBus.emit).toHaveBeenCalledWith('tabs:add:tab', undefined)
  })

  it('closes tab with desktop layout', () => {
    vi.mocked(isMacOS).mockReturnValue(true)

    const event = createKeyboardEvent('w', { metaKey: true })
    handleHotkeyDown(event, mockEventBus, 'desktop')

    expect(mockEventBus.emit).toHaveBeenCalledWith('tabs:close:tab', undefined)
  })

  it('focuses last tab with desktop layout', () => {
    vi.mocked(isMacOS).mockReturnValue(true)

    const event = createKeyboardEvent('9', { metaKey: true })
    handleHotkeyDown(event, mockEventBus, 'desktop')

    expect(mockEventBus.emit).toHaveBeenCalledWith('tabs:focus:tab-last', undefined)
  })
})
