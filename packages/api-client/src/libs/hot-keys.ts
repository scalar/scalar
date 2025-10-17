import type { EventBus } from '@/libs'
import type { HotkeyEventName, KeydownKey } from '@scalar/oas-utils/entities/hotkeys'
import type { HotKeyConfig, HotKeyModifiers } from '@scalar/oas-utils/entities/workspace'
import { isMacOS } from '@scalar/helpers/general/is-mac-os'

export type HotKeyEvent = Partial<Record<HotkeyEventName, KeyboardEvent>>

/**
 * These are unrelated to an input so they will still fire if we are in one,
 * this is not for a textarea in which you should be able to use arrow keys, enter etc
 */
const inputHotkeys = [
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
]

/**
 * Default set of keybindings
 *
 * Passing an empty object for hotkeys will disable them
 *
 * TODO we can add a merge or overwrite option
 *
 * The modifier can be set by the user but defaults to ctrl for windows/linux and meta for macos
 *
 * For the modifier key:
 * - if you leave it blank it can be true or false
 * - if you explicitly set it, the event must match ex: modifier false will not trigger if the modifier was pressed
 */
export const DEFAULT_HOTKEYS: HotKeyConfig = {
  Escape: { event: 'closeModal' },
  Enter: { event: 'executeRequest', modifiers: ['default'] },
  b: { event: 'toggleSidebar', modifiers: ['default'] },
  k: { event: 'openCommandPalette', modifiers: ['default'] },
  l: { event: 'focusAddressBar', modifiers: ['default'] },
}

/** Checks if we are in an "input" */
export const isInput = (ev: KeyboardEvent) => {
  if (!(ev.target instanceof HTMLElement)) {
    return false
  }
  const target = ev.target

  // For actual inputs we would like to allow certain hotkeys to go through even without modifiers
  if (target.tagName === 'INPUT') {
    return !inputHotkeys.includes(ev.key)
  }
  if (target.tagName === 'TEXTAREA') {
    return true
  }
  if (target.getAttribute('contenteditable')) {
    return true
  }
  if (target.contentEditable === 'true') {
    return true
  }

  return false
}

const MODIFIER_DICT = {
  Alt: 'altKey',
  Control: 'ctrlKey',
  Shift: 'shiftKey',
  Meta: 'metaKey',
} as const

/** Converts our modifier config to the eventKey */
export const getModifiers = (modifiers: HotKeyModifiers) =>
  modifiers.map((modifier) => (modifier === 'default' ? (isMacOS() ? 'metaKey' : 'ctrlKey') : MODIFIER_DICT[modifier]))

/**
 * Global keydown handler for hotkeys
 *
 * This is the brain of the operation, we turn keybindings -> events
 */
export const handleHotKeyDown = (
  ev: KeyboardEvent,
  eventBus: EventBus<HotKeyEvent>,
  { hotKeys = DEFAULT_HOTKEYS, modifiers = ['default'] as HotKeyModifiers } = {},
) => {
  const key = ev.key === ' ' ? 'Space' : (ev.key as KeydownKey)
  const hotKeyEvent = hotKeys[key]

  // Match the event with possible hotkeys
  if (hotKeyEvent) {
    // For escape we always send it
    if (key === 'Escape') {
      eventBus.emit({ [hotKeyEvent.event]: ev })
    } else {
      const _modifiers = getModifiers(hotKeyEvent.modifiers || modifiers)
      const areModifiersPressed = _modifiers.every((mod) => ev[mod] === true)

      // We send even in inputs if there is a modifier
      if (areModifiersPressed) {
        eventBus.emit({ [hotKeyEvent.event]: ev })
      }
      // Check if we are in an input as modifier === 'undefined'
      else if (!isInput(ev) && hotKeyEvent.modifiers === undefined) {
        eventBus.emit({ [hotKeyEvent.event]: ev })
      }
    }
  }
}
