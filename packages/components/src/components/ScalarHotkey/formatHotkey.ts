import { isMacOS } from '@scalar/helpers/general/is-mac-os'

import { HOTKEY_LABELS, MODIFIER_KEY_SYMBOLS, MODIFIER_KEY_SYMBOLS_MACOS } from './constants'
import type { HotKeyModifier } from './types'

// Type guards
// ------------------------------------------------------------

/** Typescript helper to check if a modifier is the default modifier */
export function isDefault(modifier: HotKeyModifier): modifier is 'default' {
  return modifier === 'default'
}

// Symbol Formatting
// ------------------------------------------------------------

/** Get the modifier key symbol for a modifier */
export function getModifierKeySymbol(modifier: HotKeyModifier): string {
  const hotkey = isDefault(modifier) ? 'Meta' : modifier
  return isMacOS() ? MODIFIER_KEY_SYMBOLS_MACOS[hotkey] : MODIFIER_KEY_SYMBOLS[hotkey]
}

/** Format the hotkey symbols for a hotkey */
export function formatHotkeySymbols(hotkey: string, modifier: HotKeyModifier[]): string[] {
  const modifierKeys = modifier.map((mod) => getModifierKeySymbol(mod))
  return [...modifierKeys, hotkey]
}

// Screen Reader Label Formatting
// ------------------------------------------------------------

/** Get the hotkey label for a hotkey */
export function getKeyLabel(key: string): string {
  return key in HOTKEY_LABELS ? HOTKEY_LABELS[key as keyof typeof HOTKEY_LABELS] : key
}
