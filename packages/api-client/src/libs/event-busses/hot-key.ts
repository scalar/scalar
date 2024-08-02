import type {
  HotKeyConfig,
  HotKeyModifier,
} from '@scalar/oas-utils/entities/workspace'
import type {
  HotkeyEventName,
  KeydownKey,
} from '@scalar/oas-utils/entities/workspace/consts'
import { isMacOS } from '@scalar/use-tooltip'
import { type EventBusKey, useEventBus } from '@vueuse/core'

type HotKeyEvents = Record<HotkeyEventName, KeyboardEvent>
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
  Escape: { event: 'closeModal', modifier: false },
  // Space: { event: 'closeModal', modifier: false },
}

/** Checks if we are in an "input" */
const isInput = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.getAttribute('contenteditable') || target.tagName === 'INPUT')

const MODIFIER_DICT = {
  Alt: 'altKey',
  Control: 'ctrlKey',
  Shift: 'shiftKey',
  Meta: 'metaKey',
} as const

/** Converts our modifier config to the eventKey */
const getModifier = (modifier: HotKeyModifier) => {
  if (modifier === 'default') {
    if (isMacOS()) return 'metaKey'
    else return 'ctrlKey'
  }
  return MODIFIER_DICT[modifier]
}

/**
 * Global keydown handler for hotkeys
 *
 * This is the brain of the operation, we turn keybindings -> events
 */
export const handleHotKeyDown = (
  ev: KeyboardEvent,
  { hotkeys = DEFAULT_HOTKEYS, modifier = 'default' as HotKeyModifier } = {},
) => {
  const key = ev.key === ' ' ? 'Space' : (ev.key as KeydownKey)
  const hotKeyEvent = hotkeys[key]

  // Match the event with possible hotkeys
  if (hotKeyEvent) {
    // For escape we always send it
    if (key === 'Escape') hotKeyBus.emit({ [hotKeyEvent.event]: ev })
    else {
      const _modifier = getModifier(modifier)

      // Check for modifier as its defined
      if (ev[_modifier] === hotKeyEvent.modifier) {
        // Check if we are in an input if modifier === false
        if (hotKeyEvent.modifier || !isInput(ev.target))
          hotKeyBus.emit({ [hotKeyEvent.event]: ev })
      }
      // Check if we are in an input as modifier === 'undefined'
      else if (!isInput(ev.target)) hotKeyBus.emit({ [hotKeyEvent.event]: ev })
    }
  }
}
