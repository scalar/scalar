/**
 * Check if the current platform is macOS.
 */
export function isMacOS(): boolean {
  return typeof navigator !== 'undefined' ? /Mac/.test(navigator.platform) : false
}
