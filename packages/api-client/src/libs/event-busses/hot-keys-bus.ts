import type {
  HotkeyEventName,
  KeydownKey,
} from '@scalar/oas-utils/entities/hotkeys'
import type {
  HotKeyConfig,
  HotKeyModifiers,
} from '@scalar/oas-utils/entities/workspace'
import { isMacOS } from '@scalar/use-tooltip'
import { type EventBusKey, useEventBus } from '@vueuse/core'

export type HotKeyEvents = Partial<Record<HotkeyEventName, KeyboardEvent>>
const hotKeyBusKey: EventBusKey<HotKeyEvents> = Symbol()

/** Event bus for hot keys */
export const hotKeyBus = useEventBus(hotKeyBusKey)

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
 * TODO need a way to switch between web + electron
 *
 * The modifier can be set by the user but defaults to ctrl for windows/linux and meta for macos
 *
 * For the modifier key:
 * - if you leave it blank it can be true or false
 * - if you explicitly set it, the event must match ex: modifier false will not trigger if the modifier was pressed
 */
export const DEFAULT_HOTKEYS: HotKeyConfig = {
  Escape: { event: 'closeModal' },
  b: { event: 'toggleSidebar', modifiers: ['default'] },
  k: { event: 'openCommandPalette', modifiers: ['default'] },
  ArrowUp: { event: 'navigateSearchResultsUp' },
  ArrowDown: { event: 'navigateSearchResultsDown' },
  Enter: { event: 'selectSearchResult' },
  t: { event: 'addTopNav', modifiers: ['default'] },
  w: { event: 'closeTopNav', modifiers: ['default'] },
  ArrowLeft: { event: 'navigateTopNavLeft', modifiers: ['default', 'Alt'] },
  ArrowRight: { event: 'navigateTopNavRight', modifiers: ['default', 'Alt'] },
  l: { event: 'focusAddressBar', modifiers: ['default'] },
  1: { event: 'jumpToTab', modifiers: ['default'] },
  2: { event: 'jumpToTab', modifiers: ['default'] },
  3: { event: 'jumpToTab', modifiers: ['default'] },
  4: { event: 'jumpToTab', modifiers: ['default'] },
  5: { event: 'jumpToTab', modifiers: ['default'] },
  6: { event: 'jumpToTab', modifiers: ['default'] },
  7: { event: 'jumpToTab', modifiers: ['default'] },
  8: { event: 'jumpToTab', modifiers: ['default'] },
  9: { event: 'jumpToLastTab', modifiers: ['default'] },
  f: { event: 'focusRequestSearch', modifiers: ['default'] },
}

/** Checks if we are in an "input" */
const isInput = (ev: KeyboardEvent) => {
  if (!(ev.target instanceof HTMLElement)) return false
  const target = ev.target

  // For actual inputs we would like to allow certain hotkeys to go through even without modifiers
  if (target.tagName === 'INPUT') return !inputHotkeys.includes(ev.key)
  if (target.tagName === 'TEXTAREA') return true
  if (target.getAttribute('contenteditable')) return true

  return false
}

const MODIFIER_DICT = {
  Alt: 'altKey',
  Control: 'ctrlKey',
  Shift: 'shiftKey',
  Meta: 'metaKey',
} as const

/** Converts our modifier config to the eventKey */
export const getModifiers = (modifiers: HotKeyModifiers) => {
  return modifiers.map((modifier) =>
    modifier === 'default'
      ? isMacOS()
        ? 'metaKey'
        : 'ctrlKey'
      : MODIFIER_DICT[modifier],
  )
}

/**
 * Global keydown handler for hotkeys
 *
 * This is the brain of the operation, we turn keybindings -> events
 */
export const handleHotKeyDown = (
  ev: KeyboardEvent,
  {
    hotKeys = DEFAULT_HOTKEYS,
    modifiers = ['default'] as HotKeyModifiers,
  } = {},
) => {
  const key = ev.key === ' ' ? 'Space' : (ev.key as KeydownKey)
  const hotKeyEvent = hotKeys[key]

  // Match the event with possible hotkeys
  if (hotKeyEvent) {
    // For escape we always send it
    if (key === 'Escape') {
      hotKeyBus.emit({ [hotKeyEvent.event]: ev })
    } else {
      const _modifiers = getModifiers(hotKeyEvent.modifiers || modifiers)
      const areModifiersPressed = _modifiers.every((mod) => ev[mod] === true)

      // Check for modifiers as defined
      if (areModifiersPressed && !isInput(ev)) {
        hotKeyBus.emit({ [hotKeyEvent.event]: ev })
      } else if (!isInput(ev) && hotKeyEvent.modifiers === undefined) {
        // Check if we are in an input as modifier === 'undefined'
        hotKeyBus.emit({ [hotKeyEvent.event]: ev })
      }
    }
  }
}
