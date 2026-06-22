import { literal, union, validate } from '@scalar/validation'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

const colorMode = ref<ColorMode>('dark')

/**
 * Reactive snapshot of the system preference, shared across every `useColorMode` instance.
 *
 * It defaults to `'light'` so the first client render matches the server, where
 * `window`/`matchMedia` do not exist. We resolve the real value in `onMounted` to avoid a
 * hydration mismatch in anything bound to the color mode (for example the dark-mode toggle).
 *
 * It lives at module scope (like `colorMode`) so all instances agree on a single value instead
 * of each holding its own copy that resolves at a different mount time.
 */
const systemPreference = ref<DarkLightMode>('light')

const colorModeSchema = union([literal('system'), literal('dark'), literal('light')])

/** Possible color modes */
type ColorMode = 'light' | 'dark' | 'system'

/** Specific dark/light mode */
type DarkLightMode = 'light' | 'dark'

/**
 * A composable hook that provides color mode (dark/light) functionality.
 */
export function useColorMode(
  opts: {
    /** The initial color mode to use */
    initialColorMode?: ColorMode
    /** Override the color mode */
    overrideColorMode?: ColorMode
  } = {},
) {
  const { initialColorMode = 'system', overrideColorMode } = opts

  /** Toggles the color mode between light and dark. */
  function toggleColorMode() {
    // Update state
    colorMode.value = darkLightMode.value === 'dark' ? 'light' : 'dark'

    // Store in local storage
    if (typeof window === 'undefined') {
      return
    }
    window?.localStorage?.setItem('colorMode', colorMode.value)
  }

  /** Sets the color mode to the specified value. */
  function setColorMode(value: ColorMode) {
    colorMode.value = value
    if (typeof window === 'undefined') {
      return
    }
    window?.localStorage?.setItem('colorMode', colorMode.value)
  }

  /** Gets the system mode preference. */
  function getSystemModePreference(): DarkLightMode {
    if (typeof window === 'undefined') {
      return 'light'
    }
    if (typeof window?.matchMedia !== 'function') {
      return 'dark'
    }

    return window?.matchMedia('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light'
  }

  /** Writable computed ref for dark/light mode with system preference applied */
  const darkLightMode = computed<DarkLightMode>({
    get: () => (colorMode.value === 'system' ? systemPreference.value : colorMode.value),
    set: setColorMode,
  })

  /** Writable computed ref for whether the current color mode is dark */
  const isDarkMode = computed<boolean>({
    get: () => darkLightMode.value === 'dark',
    set: (value) => setColorMode(value ? 'dark' : 'light'),
  })

  /** Applies the appropriate color mode class to the body. */
  function applyColorMode(): void {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return
    }

    // Read from the deferred `systemPreference` ref (not `getSystemModePreference()` directly) so
    // the body class agrees with `darkLightMode`/the toggle before `onMounted` resolves the real value.
    const classMode = overrideColorMode ?? (colorMode.value === 'system' ? systemPreference.value : colorMode.value)

    if (classMode === 'dark') {
      document.body.classList.add('dark-mode')
      document.body.classList.remove('light-mode')
    } else {
      document.body.classList.add('light-mode')
      document.body.classList.remove('dark-mode')
    }
  }

  // Priority: overrideColorMode -> localStorage -> initialColorMode
  // Without `window` (SSR/SSG), there is no storage — treat preference as `system` so we do not
  // fall through to `initialColorMode` and diverge from client hydration (see useColorMode tests).
  const storedValue = typeof window === 'undefined' ? 'system' : window?.localStorage?.getItem('colorMode')
  const savedColorMode = validate(colorModeSchema, storedValue) ? (storedValue as ColorMode) : null

  colorMode.value = overrideColorMode ?? savedColorMode ?? initialColorMode

  // Watch for color mode or system preference changes and update the body class. Watching
  // `systemPreference` means resolving it in `onMounted` (or an OS theme change) re-applies the class.
  watch([colorMode, systemPreference], applyColorMode, { immediate: true })

  const handleChange = () => {
    systemPreference.value = getSystemModePreference()
  }

  const mediaQuery = ref<MediaQueryList | null>(null)
  // Listen to system preference changes
  onMounted(() => {
    // Now that we are on the client, resolve the real system preference so the
    // color mode updates after hydration instead of mismatching the server.
    systemPreference.value = getSystemModePreference()

    if (typeof window !== 'undefined' && typeof window?.matchMedia === 'function') {
      mediaQuery.value = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.value?.addEventListener('change', handleChange)
    }
  })

  onUnmounted(() => {
    mediaQuery.value?.removeEventListener('change', handleChange)
  })

  return {
    /** The current color mode (writable). */
    colorMode: computed({
      get: () => colorMode.value,
      set: setColorMode,
    }),
    /** The computed dark/light mode (writable). */
    darkLightMode,
    /** Whether the current color mode is dark (writable). */
    isDarkMode,
    /** Toggles the color mode between light and dark. */
    toggleColorMode,
    /** Sets the color mode to the specified value. */
    setColorMode,
    /** Gets the system mode preference. */
    getSystemModePreference,
  }
}
