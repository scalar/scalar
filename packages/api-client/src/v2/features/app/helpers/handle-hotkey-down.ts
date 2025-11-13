import { isMacOS } from '@scalar/helpers/general/is-mac-os'
import type { ApiReferenceEvents, WorkspaceEventBus } from '@scalar/workspace-store/events'

import type { ClientLayout } from '@/v2/types/layout'

type HotKeyModifiers = ('Alt' | 'Control' | 'Shift' | 'Meta' | 'default')[]

/** Hotkey configuration type, matches payloads with the event bus */
export type HotKeyConfig<E extends keyof ApiReferenceEvents = keyof ApiReferenceEvents> = Record<
  string | number,
  undefined extends ApiReferenceEvents[E]
    ? { event: E; payload?: ApiReferenceEvents[E]; modifiers: HotKeyModifiers }
    : { event: E; payload: ApiReferenceEvents[E]; modifiers: HotKeyModifiers }
>

/** Default hotkeys available in most contexts */
export const DEFAULT_HOTKEYS: HotKeyConfig = {
  Enter: { event: 'operation:send:request', modifiers: ['default'] },
  b: { event: 'ui:toggle:sidebar', modifiers: ['default'] },
  k: { event: 'ui:open:command-palette', payload: 'addOperation', modifiers: ['default'] },
  l: { event: 'ui:focus:address-bar', modifiers: ['default'] },
}

/** Hotkey map by layout */
export const HOTKEYS: Record<ClientLayout, HotKeyConfig> = {
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
    ArrowLeft: { event: 'tabs:navigate:previous', modifiers: ['default', 'Alt'] },
    ArrowRight: { event: 'tabs:navigate:next', modifiers: ['default', 'Alt'] },
    1: { event: 'tabs:focus:tab', payload: { index: 0 }, modifiers: ['default'] },
    2: { event: 'tabs:focus:tab', payload: { index: 1 }, modifiers: ['default'] },
    3: { event: 'tabs:focus:tab', payload: { index: 2 }, modifiers: ['default'] },
    4: { event: 'tabs:focus:tab', payload: { index: 3 }, modifiers: ['default'] },
    5: { event: 'tabs:focus:tab', payload: { index: 4 }, modifiers: ['default'] },
    6: { event: 'tabs:focus:tab', payload: { index: 5 }, modifiers: ['default'] },
    7: { event: 'tabs:focus:tab', payload: { index: 6 }, modifiers: ['default'] },
    8: { event: 'tabs:focus:tab', payload: { index: 7 }, modifiers: ['default'] },
    9: { event: 'tabs:focus:tab-last', modifiers: ['default'] },
  },
}

/** Keys that should work in input fields when the modifier is pressed */
const INPUT_ALLOWED_KEYS = new Set([
  'Escape',
  'ArrowDown',
  'ArrowUp',
  'Enter',
  'F1',
  'F2',
  'F3',
  'F4',
  'F5',
  'F6',
  'F7',
  'F8',
  'F9',
  'F10',
  'F11',
  'F12',
])

const MODIFIER_MAP = {
  Alt: 'altKey',
  Control: 'ctrlKey',
  Shift: 'shiftKey',
  Meta: 'metaKey',
} as const

/**
 * Checks if all required modifiers are pressed.
 * Resolves 'default' to metaKey (macOS) or ctrlKey (Windows/Linux).
 */
const areModifiersPressed = (event: KeyboardEvent, modifiers: HotKeyModifiers): boolean =>
  modifiers
    .map((modifier) => (modifier === 'default' ? (isMacOS() ? 'metaKey' : 'ctrlKey') : MODIFIER_MAP[modifier]))
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
export const handleHotkeyDown = (event: KeyboardEvent, eventBus: WorkspaceEventBus, layout: ClientLayout): void => {
  /** Special case for space */
  const key = event.key === ' ' ? 'Space' : event.key
  /** The discriminated hotkeys config */
  const hotkeys = HOTKEYS[layout]
  /** Get the hotkey event with payload  */
  const hotkeyEvent = hotkeys[key]

  if (!hotkeyEvent) {
    return
  }

  // Escape always fires, regardless of context
  if (key === 'Escape') {
    eventBus.emit(hotkeyEvent.event, hotkeyEvent.payload)
    event.preventDefault()
    return
  }

  // If modifiers are pressed, fire the hotkey (even in input fields)
  if (areModifiersPressed(event, hotkeyEvent.modifiers)) {
    console.log('fire hotkey', hotkeyEvent.event, hotkeyEvent.payload)
    eventBus.emit(hotkeyEvent.event, hotkeyEvent.payload)
    event.preventDefault()
    return
  }

  // Without modifiers, only fire if not in an editable element
  if (!isEditableElement(event, key)) {
    eventBus.emit(hotkeyEvent.event, hotkeyEvent.payload)
  }
}
