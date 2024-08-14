import type {
  HotKeyConfig,
  HotKeyModifiers,
} from '@scalar/oas-utils/entities/workspace'
import type {
  HotkeyEventName,
  KeydownKey,
} from '@scalar/oas-utils/entities/workspace/consts'
import { isMacOS } from '@scalar/use-tooltip'
import { type EventBusKey, useEventBus } from '@vueuse/core'

export type HotKeyEvents = Partial<Record<HotkeyEventName, KeyboardEvent>>
const hotKeyBusKey: EventBusKey<HotKeyEvents> = Symbol()

/** Event bus for hot keys */
export const hotKeyBus = useEventBus(hotKeyBusKey)

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
  ArrowUp: { event: 'commandPaletteUp' },
  ArrowDown: { event: 'commandPaletteDown' },
  Enter: { event: 'commandPaletteSelect' },
  t: { event: 'addTopNav', modifiers: ['default'] },
  w: { event: 'closeTopNav', modifiers: ['default'] },
  ArrowLeft: { event: 'navigateTopNavLeft', modifiers: ['default', 'Alt'] },
  ArrowRight: { event: 'navigateTopNavRight', modifiers: ['default', 'Alt'] },
  l: { event: 'focusAddressBar', modifiers: ['default'] },
}

/** Checks if we are in an "input" */
const isInput = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.getAttribute('contenteditable') ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA')

const MODIFIER_DICT = {
  Alt: 'altKey',
  Control: 'ctrlKey',
  Shift: 'shiftKey',
  Meta: 'metaKey',
} as const

/** Converts our modifier config to the eventKey */
const getModifiers = (modifiers: HotKeyModifiers) => {
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

      /** Check for modifiers as defined */
      if (areModifiersPressed && !isInput(ev.target)) {
        hotKeyBus.emit({ [hotKeyEvent.event]: ev })
      } else if (!isInput(ev.target) && hotKeyEvent.modifiers === undefined) {
        /** Check if we are in an input as modifier === 'undefined' */
        hotKeyBus.emit({ [hotKeyEvent.event]: ev })
      }

      /** Unfocus input for ArrowUp and ArrowDown events */
      if (key === 'ArrowUp' || key === 'ArrowDown') {
        ;(ev.target as HTMLElement)?.blur()
      }
    }
  }
}
