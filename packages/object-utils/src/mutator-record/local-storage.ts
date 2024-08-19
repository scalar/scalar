/** Config options for localStorage mutators */
export const LS_CONFIG = {
  /** The debounce time in milliseconds for saving to localStorage per resource */
  DEBOUNCE_MS: 328,
  /** The max wait time in milliseconds for saving to localStorage per resource */
  MAX_WAIT_MS: 1000,
} as const
