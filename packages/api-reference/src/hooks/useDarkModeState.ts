import { ref, watch } from 'vue'

// State
const isDark = ref<boolean>(false)

/** This hook helps with retrieving the dark mode setting from local storage or from system settings. */
export function useDarkModeState(isDarkInitially?: boolean) {
  // Get initial dark mode state
  const getDarkModeState = () => {
    // Use setting from local storage
    const isDarkFromLocalStorage =
      typeof window !== 'undefined'
        ? window.localStorage?.getItem('isDark')
        : null

    if (typeof isDarkFromLocalStorage === 'string') {
      return !!JSON.parse(isDarkFromLocalStorage)
    }

    // Fall back to system setting
    if (
      typeof window !== 'undefined' &&
      window?.matchMedia('(prefers-color-scheme: dark)')?.matches
    ) {
      return true
    }

    return false
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

  function setDarkMode(value: boolean) {
    isDark.value = value
    if (typeof window !== 'undefined') {
      window?.localStorage?.setItem('isDark', JSON.stringify(isDark.value))
    }
  }

  // Priority of initial values is: LocalStorage/App Config/Fallback
  isDark.value =
    (typeof window === 'undefined'
      ? null
      : JSON.parse(window.localStorage?.getItem('isDark') || 'null')) ??
    isDarkInitially ??
    getDarkModeState()

  watch(
    isDark,
    (dark) => {
      if (typeof document === 'undefined') return
      document.body.classList.toggle('dark-mode', dark)
      document.body.classList.toggle('light-mode', !dark)
    },
    { immediate: true },
  )

  return {
    isDark,
    toggleDarkMode,
    setDarkMode,
  }
}
