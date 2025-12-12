import { ref } from 'vue'

/**
 * Create the address bar animation
 */
export const useLoadingAnimation = () => {
  /** The amount remaining to load from 100 -> 0 */
  const percentage = ref(100)
  /** Keeps track of how much was left when the request finished */
  const remaining = ref(0)
  /** Whether or not there is a request loading */
  const isRequesting = ref(false)
  /** The loading interval */
  const interval = ref<ReturnType<typeof setInterval>>()

  function load() {
    if (isRequesting.value) {
      // Reduce asymptotically up to 85% loaded
      percentage.value -= (percentage.value - 15) / 60
    } else {
      // Always finish loading linearly over 400ms
      percentage.value -= remaining.value / 20
    }
    if (percentage.value <= 0) {
      clearInterval(interval.value)
      interval.value = undefined
      percentage.value = 100
      isRequesting.value = false
    }
  }

  function startLoading() {
    if (interval.value) {
      return
    }
    isRequesting.value = true
    interval.value = setInterval(load, 20)
  }

  function stopLoading() {
    remaining.value = percentage.value
    isRequesting.value = false
  }

  return {
    startLoading,
    stopLoading,
    percentage,
  }
}
