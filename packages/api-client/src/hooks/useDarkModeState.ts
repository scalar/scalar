import { onMounted, onUnmounted, ref, watch } from 'vue'

// State - null to indicate system preference
const isDark = ref<boolean | null>(null)

/** This hook helps with retrieving the dark mode setting from local storage or from system settings. */
export function useDarkModeState(isDarkInitially?: boolean) {
  // Get initial dark mode state
  const getDarkModeState = () => {
    // Use setting from local storage
    const isDarkFromLocalStorage =
      typeof window !== 'undefined'
        ? window.localStorage?.getItem('isDark')
        : null

    if (isDarkFromLocalStorage === 'system') {
      return null
    }

    if (typeof isDarkFromLocalStorage === 'string') {
      return !!JSON.parse(isDarkFromLocalStorage)
    }

    // Fall back to system setting
    return getSystemModePreference()
  }

  // Toggle dark mode
  const toggleDarkMode = () => {
    // Update state
    isDark.value = !isDark.value

    // Store in local storage
    if (typeof window !== 'undefined') {
      window?.localStorage?.setItem('isDark', JSON.stringify(isDark.value))
    }
  }

  function setDarkMode(value: boolean | null) {
    isDark.value = value
    if (typeof window !== 'undefined') {
      window?.localStorage?.setItem(
        'isDark',
        value === null ? 'system' : JSON.stringify(isDark.value),
      )
    }
  }

  const getSystemModePreference = () => {
    if (
      typeof window !== 'undefined' &&
      typeof window?.matchMedia === 'function'
    ) {
      return window?.matchMedia('(prefers-color-scheme: dark)')?.matches
    }
    return false
  }

  const applyDarkModeClass = (dark: boolean | null) => {
    if (typeof document !== 'undefined') {
      if (dark === null) {
        document.body.classList.toggle('dark-mode', getSystemModePreference())
        document.body.classList.toggle('light-mode', !getSystemModePreference())
      } else {
        document.body.classList.toggle('dark-mode', dark === true)
        document.body.classList.toggle('light-mode', dark === false)
      }
    }
  }

  // Priority of initial values is: LocalStorage/App Config/Fallback
  isDark.value =
    (typeof window === 'undefined'
      ? null
      : window.localStorage?.getItem('isDark') === 'system'
        ? null
        : JSON.parse(window.localStorage?.getItem('isDark') || 'null')) ??
    isDarkInitially ??
    getDarkModeState()

  // Apply the correct class immediately
  applyDarkModeClass(isDark.value)

  // Watch for changes in isDark to update the class
  watch(
    isDark,
    (dark) => {
      applyDarkModeClass(dark)
    },
    { immediate: true },
  )

  // Listen to system preference changes
  onMounted(() => {
    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function'
    ) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => {
        if (isDark.value === null) {
          applyDarkModeClass(null)
        }
      }
      mediaQuery.addEventListener('change', handleChange)

      onUnmounted(() => {
        mediaQuery.removeEventListener('change', handleChange)
      })
    }
  })

  return {
    isDark,
    toggleDarkMode,
    setDarkMode,
  }
}
