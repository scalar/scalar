import { isMacOS } from '@scalar/helpers/general/is-mac-os'
import {
  type ApiReferenceEvents,
  type NavigationEventBus,
  type NavigationEvents,
  isNavigationEvent,
  navigate,
} from '@scalar/workspace-store/events'

import type { ClientLayout } from '@/v2/types/layout'

/** Navigation destinations used by keyboard shortcuts in each client layout. */
export type HotkeyNavigation<L extends ClientLayout> = L extends 'modal'
  ? never
  : L extends 'web'
    ? 'ui:open:settings'
    : 'ui:open:settings' | 'tabs:navigate:previous' | 'tabs:navigate:next' | 'tabs:focus:tab' | 'tabs:focus:tab-last'

type HotKeyModifiers = ('altKey' | 'ctrlKey' | 'shiftKey' | 'metaKey' | 'default')[]

/** Hotkey configuration */
type HotKeyConfig<L extends ClientLayout> = Record<
  string | number,
  { event: Exclude<keyof ApiReferenceEvents, keyof NavigationEvents> | HotkeyNavigation<L>; modifiers: HotKeyModifiers }
>

/** Default hotkeys available in most contexts */
const COMMON_HOTKEYS: HotKeyConfig<'modal'> = {
  Enter: { event: 'operation:send:request:hotkey', modifiers: ['default'] },
  b: { event: 'ui:toggle:sidebar', modifiers: ['default'] },
  k: { event: 'ui:open:command-palette', modifiers: ['default'] },
  l: { event: 'ui:focus:address-bar', modifiers: ['default'] },
  j: { event: 'ui:focus:search', modifiers: ['default'] },
  s: { event: 'ui:save:local-document', modifiers: ['default'] },
}

const DEFAULT_HOTKEYS: HotKeyConfig<'web'> = {
  ...COMMON_HOTKEYS,
  i: { event: 'ui:open:settings', modifiers: ['default'] },
}

/** Hotkey map by layout, we can allow the user to override this later */
const HOTKEYS: { [L in ClientLayout]: HotKeyConfig<L> } = {
  web: DEFAULT_HOTKEYS,

  modal: {
    ...COMMON_HOTKEYS,
    Escape: { event: 'ui:close:client-modal', modifiers: [] },
    l: { event: 'ui:focus:send-button', modifiers: ['default'] },
  },

  desktop: {
    ...DEFAULT_HOTKEYS,
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
  modifiers.length > 0 &&
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
export const handleHotkeys = <L extends ClientLayout>(
  event: KeyboardEvent,
  eventBus: NavigationEventBus<HotkeyNavigation<NoInfer<L>>>,
  layout: L,
): void => {
  /** Special case for space */
  const key = event.key === ' ' ? 'Space' : event.key
  /** Get the discriminated hotkey event with payload  */
  const hotkeyEvent = (HOTKEYS[layout] as HotKeyConfig<'desktop'>)[key]

  if (!hotkeyEvent) {
    return
  }

  // Default to sending the keyboard event as the payload
  const payload = { event }

  const dispatch = (): void => {
    if (isNavigationEvent(hotkeyEvent.event)) {
      navigate(
        eventBus.navigation as NavigationEventBus<HotkeyNavigation<'desktop'>>['navigation'],
        hotkeyEvent.event,
        payload,
      )
    } else {
      eventBus.emit(hotkeyEvent.event, payload, { skipUnpackProxy: true })
    }
  }

  // Escape always fires, regardless of context
  if (key === 'Escape') {
    dispatch()
    return
  }

  // If modifiers are pressed, fire the hotkey (even in input fields)
  if (areModifiersPressed(event, hotkeyEvent.modifiers)) {
    dispatch()
    return
  }

  // If modifiers are required but missing, do not fire the hotkey.
  if (hotkeyEvent.modifiers.length > 0) {
    return
  }

  // Without modifiers, only fire if not in an editable element
  if (!isEditableElement(event, key)) {
    dispatch()
  }
}
