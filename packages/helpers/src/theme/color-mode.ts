/**
 * A resolved color mode.
 *
 * This is deliberately narrower than the color mode a user can pick, which also includes `system`.
 * `system` is a preference that has to be resolved against the operating system before anything can
 * be rendered, so by the time a mode reaches the DOM it is always one of these two.
 */
export type DarkLightMode = 'light' | 'dark'

/** The body class each color mode is expressed as. */
const COLOR_MODE_CLASSES = {
  light: 'light-mode',
  dark: 'dark-mode',
} as const satisfies Record<DarkLightMode, string>

/**
 * Applies a color mode to an element by swapping the two mode classes.
 *
 * Every Scalar theme ships both modes as a pair of classes rather than a media query, so switching
 * mode is a matter of swapping which of the two is present. Both are toggled rather than only the
 * one being added, so the element never ends up carrying both at once.
 *
 * The caller is responsible for checking that a DOM exists. Reading the default argument touches
 * `document`, so this throws under SSR rather than silently doing nothing.
 */
export const applyColorMode = (mode: DarkLightMode, target: HTMLElement = document.body): void => {
  target.classList.toggle(COLOR_MODE_CLASSES.dark, mode === 'dark')
  target.classList.toggle(COLOR_MODE_CLASSES.light, mode === 'light')
}

/**
 * Reads the operating system color mode preference.
 *
 * Without a `window` there is no preference to read and nothing rendering yet, so this reports
 * light — the same value the server would render.
 *
 * A `window` without `matchMedia` reports dark instead. That looks inconsistent, and it is: the
 * behaviour predates this helper and is preserved so `useColorMode` keeps resolving the way it
 * always has. Every browser that can run this implements `matchMedia`, so in practice only a
 * stubbed test environment reaches that branch.
 */
export const getSystemColorMode = (): DarkLightMode => {
  if (typeof window === 'undefined') {
    return 'light'
  }

  if (typeof window.matchMedia !== 'function') {
    return 'dark'
  }

  return window.matchMedia('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light'
}
