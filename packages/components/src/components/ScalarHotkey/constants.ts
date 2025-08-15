import type { HotKeyModifierKey } from './types'

/** Screen reader labels for the hotkey modifiers */
export const HOTKEY_LABELS = {
  '⌘': 'Command',
  '^': 'Control',
  'ctrl': 'Control',
  '⌥': 'Option',
  'alt': 'Alt',
  '⇧': 'Shift',
  '⇪': 'Caps Lock',
  '↵': 'Enter',
  '←': 'Left Arrow',
  '→': 'Right Arrow',
  '↑': 'Up Arrow',
  '↓': 'Down Arrow',
} as const

/** Symbols for the hotkey modifiers on MacOS */
export const MODIFIER_KEY_SYMBOLS_MACOS = {
  Meta: '⌘',
  Shift: '⇧',
  Alt: '⌥',
  Control: '^',
} as const satisfies { [K in HotKeyModifierKey]: string }

/** Symbols for the hotkey modifiers outside of MacOS */
export const MODIFIER_KEY_SYMBOLS = {
  Meta: 'ctrl',
  Shift: '⇧',
  Alt: 'alt',
  Control: 'ctrl',
} as const satisfies { [K in HotKeyModifierKey]: string }
