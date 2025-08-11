import { isMacOS } from '@scalar/helpers/general/is-mac-os'

import { HOTKEY_LABELS, MODIFIER_KEY_SYMBOLS } from './constants'
import type { HotKeyModifier } from './types'

// Type guards
// ------------------------------------------------------------

/** Typescript helper to check if a modifier is the default modifier */
export function isDefault(modifier: HotKeyModifier): modifier is 'default' {
  return modifier === 'default'
}

/** Typescript helper to check if a modifier is the meta modifier */
export function isMeta(modifier: HotKeyModifier): modifier is 'Meta' {
  return modifier === 'Meta'
}

// Helpers
// ------------------------------------------------------------

/** Get the meta key for the current platform */
export default function getMetaKey(): 'Command' | 'Control' {
  return isMacOS() ? 'Command' : 'Control'
}

// Symbol Formatting
// ------------------------------------------------------------

/** Get the modifier key symbol for a modifier */
export function getModifierKeySymbol(modifier: HotKeyModifier): string {
  const hotkey = isDefault(modifier) || isMeta(modifier) ? getMetaKey() : modifier
  return MODIFIER_KEY_SYMBOLS[hotkey]
}

/** Format the hotkey symbols for a hotkey */
export function formatHotkeySymbols(hotkey: string, modifier: HotKeyModifier[]): string {
  const modifierKeys = modifier.map((mod) => getModifierKeySymbol(mod)).join('+')
  return modifier.length > 0 ? `${modifierKeys} ${hotkey}` : hotkey
}

// Screen Reader Label Formatting
// ------------------------------------------------------------

/** Get the modifier key symbol for a modifier */
export function getModifierKeyLabel(modifier: HotKeyModifier): string {
  return isDefault(modifier) || isMeta(modifier) ? getMetaKey() : modifier
}

/** Get the hotkey label for a hotkey */
export function getKeyLabel(key: string): string {
  return key in HOTKEY_LABELS ? HOTKEY_LABELS[key as keyof typeof HOTKEY_LABELS] : key
}

/** Format the screen reader label for a hotkey */
export function formatScreenReaderLabel(hotkey: string, modifier: HotKeyModifier[]): string {
  const modLabels = modifier.map(getModifierKeyLabel).join('+')
  const hotkeyLabel = getKeyLabel(hotkey)
  return modifier.length > 0 ? `${modLabels} ${hotkeyLabel}` : hotkeyLabel
}
