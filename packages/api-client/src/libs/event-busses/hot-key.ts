import type { HotKeyConfig } from '@scalar/oas-utils/entities/workspace'
import type {
  HotkeyEventName,
  KeydownKey,
} from '@scalar/oas-utils/entities/workspace/consts'
import { type EventBusKey, useEventBus } from '@vueuse/core'

type HotKeyEvents = Record<HotkeyEventName, KeyboardEvent>
const hotKeyBusKey: EventBusKey<HotKeyEvents> = Symbol()

/** Event bus for hot keys */
export const hotKeyBus = useEventBus(hotKeyBusKey)

/**
 * Default set of keybindings
 *
 * The modifier can be set by the user but defaults to ctrl for windows/linux and meta for macos
 * For the modifier key:
 * - if you leave it blank it can be true or false
 * - if you explicitly set it, the event must match ex: modifier false will not trigger if the modifier was pressed
 */
export const DEFAULT_HOTKEYS: HotKeyConfig = {
  Escape: { event: 'closeModal', modifier: false },
  Space: { event: 'closeModal', modifier: false },
}

/**
 * Global keydown handler for hotkeys
 *
 * This is the brain of the operation, we turn keybindings -> events
 */
export const handleHotKeyDown = (
  ev: KeyboardEvent,
  { keyBindings = DEFAULT_HOTKEYS } = {},
) => {
  const key = ev.key === ' ' ? 'Space' : (ev.key as KeydownKey)
  const hotKeyEvent = keyBindings[key]

  // Match the event with possible hotkeys
  if (hotKeyEvent) {
    // TODO Check for modifiers and inputs
    hotKeyBus.emit({ [hotKeyEvent.event]: ev })
  }
}
