import type { Ref } from 'vue'
import { ref } from 'vue'

/**
 * Constants for the loading animation behavior.
 * These control how the progress bar animates during and after requests.
 */
const TICK_INTERVAL_MS = 20
const MAX_PERCENTAGE = 100
const MIN_PERCENTAGE = 0
const ASYMPTOTIC_LIMIT = 15 // Stops at 85% (100 - 15) to show ongoing progress
const ASYMPTOTIC_DIVISOR = 60 // Controls the speed of asymptotic approach
const FINISH_ANIMATION_DURATION_MS = 400
const FINISH_ANIMATION_STEPS = FINISH_ANIMATION_DURATION_MS / TICK_INTERVAL_MS

/**
 * Manages the loading animation for the address bar.
 *
 * The animation has two phases:
 * 1. While requesting: Animates asymptotically toward 85% to indicate ongoing work
 * 2. After request completes: Animates linearly to 100% over 400ms for smooth completion
 *
 * This creates a natural feel where the bar does not instantly jump to 100%,
 * making the loading experience more predictable and less jarring.
 *
 * @returns An object with methods to control the loading animation and the current percentage
 */
export const useLoadingAnimation = (): {
  startLoading: () => void
  stopLoading: () => void
  percentage: Ref<number>
  isLoading: Ref<boolean>
} => {
  /** The current loading percentage from 100 (not started) to 0 (complete) */
  const percentage = ref(MAX_PERCENTAGE)
  /** Tracks how much percentage was remaining when the request completed */
  const remaining = ref(0)
  /** Indicates whether a request is currently in progress */
  const isRequesting = ref(false)
  /** The interval timer that drives the animation */
  const interval = ref<ReturnType<typeof setInterval>>()

  /**
   * Resets the animation state to initial values.
   * This is called when the animation completes.
   */
  const resetAnimation = (): void => {
    clearInterval(interval.value)
    interval.value = undefined
    percentage.value = MAX_PERCENTAGE
    isRequesting.value = false
  }

  /**
   * Advances the loading animation by one tick.
   * Uses different animation strategies based on whether a request is active.
   */
  const load = (): void => {
    if (isRequesting.value) {
      // Asymptotic approach: Slows down as it nears 85% to indicate ongoing work
      // without reaching 100% until the request actually completes
      percentage.value -= (percentage.value - ASYMPTOTIC_LIMIT) / ASYMPTOTIC_DIVISOR
    } else {
      // Linear finish: Complete the remaining percentage smoothly over a fixed duration
      // to avoid jarring jumps when the request completes
      percentage.value -= remaining.value / FINISH_ANIMATION_STEPS
    }

    if (percentage.value <= MIN_PERCENTAGE) {
      resetAnimation()
    }
  }

  /**
   * Starts the loading animation.
   * If called while the finishing animation is running, it switches back to requesting mode.
   * This handles the case where a new request starts before the previous animation completes.
   */
  const startLoading = (): void => {
    if (interval.value) {
      // Switch back to requesting mode if we are in finishing mode.
      // This prevents the animation from completing while a new request is active.
      isRequesting.value = true
      return
    }
    isRequesting.value = true
    interval.value = setInterval(load, TICK_INTERVAL_MS)
  }

  /**
   * Marks the request as complete and begins the finish animation.
   * The animation will continue until it reaches 100% to provide visual feedback.
   */
  const stopLoading = (): void => {
    remaining.value = percentage.value
    isRequesting.value = false
  }

  return {
    startLoading,
    stopLoading,
    percentage,
    isLoading: isRequesting,
  }
}
