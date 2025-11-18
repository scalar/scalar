/**
 * Gets the system color mode preference from the browser.
 * Falls back to 'light' if running in a non-browser environment.
 *
 * @returns The system preference for dark or light mode.
 */
export const getSystemModePreference = (): 'dark' | 'light' => {
  if (typeof window === 'undefined' || typeof window?.matchMedia !== 'function') {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}
