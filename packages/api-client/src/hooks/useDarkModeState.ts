import { onMounted, onUnmounted, ref, watch } from 'vue'

// State - null to indicate system preference
const colorMode = ref<'light' | 'dark' | 'system'>('dark')

/** This hook helps with retrieving the dark mode setting from local storage or from system settings. */
export function useDarkModeState() {
  // Toggle dark mode
  const toggleDarkMode = () => {
    // Update state
    colorMode.value = colorMode.value === 'dark' ? 'light' : 'dark'

    // Store in local storage
    if (typeof window !== 'undefined') {
      window?.localStorage?.setItem('colorMode', colorMode.value)
    }
  }

  function setDarkMode(value: boolean | null) {
    colorMode.value = value === null ? 'system' : value ? 'dark' : 'light'
    if (typeof window !== 'undefined') {
      window?.localStorage?.setItem('colorMode', colorMode.value)
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
  colorMode.value =
    typeof window === 'undefined'
      ? 'dark'
      : (localStorage.getItem('colorMode') as 'light' | 'dark' | 'system') ||
        'dark'

  // Apply the correct class immediately
  applyDarkModeClass(
    colorMode.value === 'dark' ||
      (colorMode.value === 'system' && getSystemModePreference()),
  )

  // Watch for changes in colorMode to update the class
  watch(
    colorMode,
    (mode) => {
      applyDarkModeClass(
        mode === 'dark' || (mode === 'system' && getSystemModePreference()),
      )
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
        if (colorMode.value === 'system') {
          applyDarkModeClass(getSystemModePreference())
        }
      }
      mediaQuery.addEventListener('change', handleChange)

      onUnmounted(() => {
        mediaQuery.removeEventListener('change', handleChange)
      })
    }
  })

  return {
    colorMode,
    toggleDarkMode,
    setDarkMode,
    getSystemModePreference,
  }
}
