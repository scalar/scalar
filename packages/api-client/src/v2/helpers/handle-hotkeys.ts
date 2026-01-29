import { isMacOS } from '@scalar/helpers/general/is-mac-os'
import type { ApiReferenceEvents, WorkspaceEventBus } from '@scalar/workspace-store/events'

import type { ClientLayout } from '@/v2/types/layout'

type HotKeyModifiers = ('altKey' | 'ctrlKey' | 'shiftKey' | 'metaKey' | 'default')[]

/** Hotkey configuration */
type HotKeyConfig = Record<string | number, { event: keyof ApiReferenceEvents; modifiers: HotKeyModifiers }>

/** Default hotkeys available in most contexts */
const DEFAULT_HOTKEYS: HotKeyConfig = {
  Enter: { event: 'operation:send:request:hotkey', modifiers: ['default'] },
  b: { event: 'ui:toggle:sidebar', modifiers: ['default'] },
  k: { event: 'ui:open:command-palette', modifiers: ['default'] },
  l: { event: 'ui:focus:address-bar', modifiers: ['default'] },
}

/** Hotkey map by layout, we can allow the user to override this later */
const HOTKEYS: Record<ClientLayout, HotKeyConfig> = {
  web: DEFAULT_HOTKEYS,

  modal: {
    ...DEFAULT_HOTKEYS,
    Escape: { event: 'ui:close:client-modal', modifiers: [] },
    l: { event: 'ui:focus:send-button', modifiers: ['default'] },
  },

  desktop: {
    ...DEFAULT_HOTKEYS,
    f: { event: 'ui:focus:search', modifiers: ['default'] },
    n: { event: 'ui:open:command-palette', modifiers: ['default'] },
    t: { event: 'tabs:add:tab', modifiers: ['default'] },
    w: { event: 'tabs:close:tab', modifiers: ['default'] },
    ArrowLeft: { event: 'tabs:navigate:previous', modifiers: ['default', 'altKey'] },
    ArrowRight: { event: 'tabs:navigate:next', modifiers: ['default', 'altKey'] },
    1: { event: 'tabs:focus:tab', modifiers: ['default'] },
    2: { event: 'tabs:focus:tab', modifiers: ['default'] },
    3: { event: 'tabs:focus:tab', modifiers: ['default'] },
    4: { event: 'tabs:focus:tab', modifiers: ['default'] },
    5: { event: 'tabs:focus:tab', modifiers: ['default'] },
    6: { event: 'tabs:focus:tab', modifiers: ['default'] },
    7: { event: 'tabs:focus:tab', modifiers: ['default'] },
    8: { event: 'tabs:focus:tab', modifiers: ['default'] },
    9: { event: 'tabs:focus:tab-last', modifiers: ['default'] },
  },
}

/** Keys that should work in input fields when the modifier is pressed */
const INPUT_ALLOWED_KEYS = new Set(['Escape', 'ArrowDown', 'ArrowUp', 'Enter'])

/**
 * Checks if all required modifiers are pressed.
 * Resolves 'default' to metaKey (macOS) or ctrlKey (Windows/Linux).
 */
const areModifiersPressed = (event: KeyboardEvent, modifiers: HotKeyModifiers): boolean =>
  modifiers
    .map((modifier) => (modifier === 'default' ? (isMacOS() ? 'metaKey' : 'ctrlKey') : modifier))
    .every((key) => event[key] === true)

/**
 * Determines if the event target is an editable element where hotkeys should be blocked.
 * Returns true if we should block the hotkey, false otherwise.
 */
const isEditableElement = (event: KeyboardEvent, key: string): boolean => {
  if (!(event.target instanceof HTMLElement)) {
    return false
  }

  const target = event.target

  // Allow certain functional keys in INPUT fields
  if (target.tagName === 'INPUT') {
    return !INPUT_ALLOWED_KEYS.has(key)
  }

  // Block all hotkeys in textareas and contenteditable elements
  return target.tagName === 'TEXTAREA' || target.contentEditable === 'true' || target.hasAttribute('contenteditable')
}

/**
 * Handles global keyboard shortcuts.
 * Checks modifier keys and input context before emitting events.
 *
 * @param event - the keyboard event
 * @param eventBus - event bus for emitting hotkey actions
 * @param layout - client layout
 */
export const handleHotkeys = (event: KeyboardEvent, eventBus: WorkspaceEventBus, layout: ClientLayout): void => {
  /** Special case for space */
  const key = event.key === ' ' ? 'Space' : event.key
  /** Get the discriminated hotkey event with payload  */
  const hotkeyEvent = HOTKEYS[layout][key]

  if (!hotkeyEvent) {
    return
  }

  // Default to sending the keyboard event as the payload
  const payload = { event }

  // Escape always fires, regardless of context
  if (key === 'Escape') {
    eventBus.emit(hotkeyEvent.event, payload, { skipUnpackProxy: true })
    return
  }

  // If modifiers are pressed, fire the hotkey (even in input fields)
  if (areModifiersPressed(event, hotkeyEvent.modifiers)) {
    eventBus.emit(hotkeyEvent.event, payload, { skipUnpackProxy: true })
    return
  }

  // Without modifiers, only fire if not in an editable element
  if (!isEditableElement(event, key)) {
    eventBus.emit(hotkeyEvent.event, payload, { skipUnpackProxy: true })
  }
}
