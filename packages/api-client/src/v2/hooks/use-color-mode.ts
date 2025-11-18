import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { ColorMode } from '@scalar/workspace-store/schemas/workspace'
import { type MaybeRefOrGetter, computed, onMounted, onUnmounted, ref, toValue, watch } from 'vue'

/**
 * Specific dark or light mode, excluding the 'system' option.
 */
type DarkLightMode = Exclude<ColorMode, 'system'>

/**
 * Gets the system color mode preference from the browser.
 * Falls back to 'light' if running in a non-browser environment.
 *
 * @returns The system preference for dark or light mode.
 */
const getSystemModePreference = (): DarkLightMode => {
  if (typeof window === 'undefined' || typeof window?.matchMedia !== 'function') {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Converts a ColorMode to a DarkLightMode by resolving 'system' to the actual system preference.
 *
 * @param mode - The color mode to convert.
 * @returns The resolved dark or light mode.
 */
const getDarkLightMode = (mode: ColorMode): DarkLightMode => {
  return mode === 'system' ? getSystemModePreference() : mode
}

/**
 * Applies the color mode by adding/removing the appropriate CSS classes on the document body.
 * This function is safe to call in non-browser environments (no-op).
 *
 * @param mode - The dark or light mode to apply.
 */
const applyColorMode = (mode: DarkLightMode): void => {
  if (typeof document === 'undefined') {
    return
  }

  const isDark = mode === 'dark'
  document.body.classList.toggle('dark-mode', isDark)
  document.body.classList.toggle('light-mode', !isDark)
}

/**
 * Composable hook that manages color mode (dark/light/system) based on workspace store configuration.
 * Automatically listens to system preference changes when mode is set to 'system'.
 *
 * @param options - Configuration options for the color mode hook.
 * @param options.workspaceStore - The workspace store instance that contains the color mode preference.
 * @returns Reactive color mode state and computed properties.
 */
export const useColorMode = ({ workspaceStore }: { workspaceStore: MaybeRefOrGetter<WorkspaceStore | null> }) => {
  const colorMode = computed(() => toValue(workspaceStore)?.workspace['x-scalar-color-mode'] ?? 'system')
  const darkLightMode = computed(() => getDarkLightMode(colorMode.value))
  const isDarkMode = computed(() => darkLightMode.value === 'dark')

  const mediaQuery = ref<MediaQueryList | null>(null)

  /**
   * Handles system preference changes.
   * Only updates the color mode if the current mode is set to 'system'.
   */
  const handleSystemPreferenceChange = (): void => {
    if (colorMode.value === 'system') {
      applyColorMode(getSystemModePreference())
    }
  }

  // Watch for colorMode changes and apply them immediately
  watch(colorMode, (mode) => applyColorMode(getDarkLightMode(mode)), { immediate: true })

  onMounted(() => {
    // Listen to system preference changes when mode is 'system'
    if (typeof window !== 'undefined' && typeof window?.matchMedia === 'function') {
      mediaQuery.value = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.value.addEventListener('change', handleSystemPreferenceChange)
    }
  })

  onUnmounted(() => {
    mediaQuery.value?.removeEventListener('change', handleSystemPreferenceChange)
  })

  return {
    /** The current color mode from the workspace store (reactive). */
    colorMode,
    /** Whether the current effective color mode is dark (reactive). */
    isDarkMode,
  }
}
