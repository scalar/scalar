/**
 * Checks whether the user is on macOS
 */
export const isMacOs = () =>
  typeof navigator !== 'undefined' ? /Mac/.test(navigator.platform) : false
