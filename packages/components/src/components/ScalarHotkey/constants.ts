/** Screen reader labels for the hotkey modifiers */
export const HOTKEY_LABELS = {
  '⌘': 'Command',
  '^': 'Control',
  '⌥': 'Option',
  '⇧': 'Shift',
  '⇪': 'Caps Lock',
  '↵': 'Enter',
  '←': 'Left Arrow',
  '→': 'Right Arrow',
  '↑': 'Up Arrow',
  '↓': 'Down Arrow',
} as const

/** Symbols for the hotkey modifiers */
export const MODIFIER_KEY_SYMBOLS = {
  Command: '⌘',
  Shift: '⇧',
  Alt: '⌥',
  Control: '^',
} as const
