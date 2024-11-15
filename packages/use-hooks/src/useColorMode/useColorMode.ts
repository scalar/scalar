import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { z } from 'zod'

import type { ColorMode, UseColorModeOptions } from './types'

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
    const darkLightMode =
      colorMode.value === 'system' ? getSystemModePreference() : colorMode.value
    // Update state
    colorMode.value = darkLightMode === 'dark' ? 'light' : 'dark'

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
  function getSystemModePreference(): ColorMode {
    if (typeof window?.matchMedia !== 'function') return 'dark'

    return window?.matchMedia('(prefers-color-scheme: dark)')?.matches
      ? 'dark'
      : 'light'
  }

  /** Applies the appropriate color mode class to the body. */
  function applyColorMode(mode: ColorMode): void {
    if (typeof document === 'undefined') return

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
    window?.localStorage?.getItem('colorMode'),
  )
  colorMode.value = savedColorMode ?? initialColorMode

  // Watch for colorMode changes and update the body class
  watch(colorMode, applyColorMode, { immediate: true })

  // Listen to system preference changes
  onMounted(() => {
    if (typeof window?.matchMedia === 'function') {
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
    toggleColorMode,
    setColorMode,
    getSystemModePreference,
  }
}
