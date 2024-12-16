import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { z } from 'zod'

import type { ColorMode, DarkLightMode, UseColorModeOptions } from './types'

const colorMode = ref<ColorMode>('dark')

const colorModeSchema = z
  .enum(['dark', 'light', 'system'])
  .optional()
  .catch(undefined)

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
    if (typeof window === 'undefined') return
    window?.localStorage?.setItem('colorMode', colorMode.value)
  }

  /** Sets the color mode to the specified value. */
  function setColorMode(value: ColorMode) {
    colorMode.value = value
    if (typeof window === 'undefined') return
    window?.localStorage?.setItem('colorMode', colorMode.value)
  }

  /** Gets the system mode preference. */
  function getSystemModePreference(): DarkLightMode {
    if (typeof window === 'undefined') return 'light'
    if (typeof window?.matchMedia !== 'function') return 'dark'

    return window?.matchMedia('(prefers-color-scheme: dark)')?.matches
      ? 'dark'
      : 'light'
  }

  /** The computed dark/light mode with system preference applied */
  const darkLightMode = computed<DarkLightMode>(() => {
    return colorMode.value === 'system'
      ? getSystemModePreference()
      : colorMode.value
  })

  /** Applies the appropriate color mode class to the body. */
  function applyColorMode(mode: ColorMode): void {
    if (typeof document === 'undefined' || typeof window === 'undefined') return

    const classMode =
      overrideColorMode ??
      (mode === 'system' ? getSystemModePreference() : mode)

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
    typeof window !== 'undefined'
      ? window?.localStorage?.getItem('colorMode')
      : 'system',
  )
  colorMode.value = savedColorMode ?? initialColorMode

  // Watch for colorMode changes and update the body class
  watch(colorMode, applyColorMode, { immediate: true })

  // Listen to system preference changes
  onMounted(() => {
    if (
      typeof window !== 'undefined' &&
      typeof window?.matchMedia === 'function'
    ) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () =>
        colorMode.value === 'system' && applyColorMode('system')

      mediaQuery.addEventListener('change', handleChange)

      onUnmounted(() => {
        mediaQuery.removeEventListener('change', handleChange)
      })
    }
  })

  return {
    colorMode: computed(() => colorMode.value),
    darkLightMode,
    toggleColorMode,
    setColorMode,
    getSystemModePreference,
  }
}
