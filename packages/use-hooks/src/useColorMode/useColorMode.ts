import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { z } from 'zod'

import type { ColorMode, DarkLightMode, UseColorModeOptions } from './types'

const colorMode = ref<ColorMode>('dark')

const colorModeSchema = z.enum(['dark', 'light', 'system']).optional().catch(undefined)

/**
 * A composable hook that provides color mode (dark/light) functionality.
 */
export function useColorMode(opts: UseColorModeOptions = {}) {
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
    get: () => (colorMode.value === 'system' ? getSystemModePreference() : colorMode.value),
    set: setColorMode,
  })

  /** Writable computed ref for whether the current color mode is dark */
  const isDarkMode = computed<boolean>({
    get: () => darkLightMode.value === 'dark',
    set: (value) => setColorMode(value ? 'dark' : 'light'),
  })

  /** Applies the appropriate color mode class to the body. */
  function applyColorMode(mode: ColorMode): void {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return
    }

    const classMode = overrideColorMode ?? (mode === 'system' ? getSystemModePreference() : mode)

    if (classMode === 'dark') {
      document.body.classList.add('dark-mode')
      document.body.classList.remove('light-mode')
    } else {
      document.body.classList.add('light-mode')
      document.body.classList.remove('dark-mode')
    }
  }

  // Priority of initial values is: LocalStorage -> App Config -> initial / Fallback
  const savedColorMode = colorModeSchema.parse(
    typeof window !== 'undefined' ? window?.localStorage?.getItem('colorMode') : 'system',
  )
  colorMode.value = savedColorMode ?? initialColorMode

  // Watch for colorMode changes and update the body class
  watch(colorMode, applyColorMode, { immediate: true })

  const handleChange = () => colorMode.value === 'system' && applyColorMode('system')

  const mediaQuery = ref<MediaQueryList | null>(null)
  // Listen to system preference changes
  onMounted(() => {
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
