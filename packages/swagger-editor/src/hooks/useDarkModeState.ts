import { ref } from 'vue'

// State
const isDark = ref<boolean>(false)

/** This hook helps with retrieving the dark mode setting from local storage or from system settings. */
export function useDarkModeState() {
  // Get intial dark mode state
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

  // Set initial value
  isDark.value = getDarkModeState()

  return {
    isDark,
    toggleDarkMode,
  }
}
