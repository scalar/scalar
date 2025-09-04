import { lazyBus } from '@/components/Lazy'
import { hasLazyLoaded } from '@/components/Lazy/lazyBus'
import { useNavState } from '@/hooks/useNavState'
import { freezeAtTop } from '@scalar/helpers/dom/freeze-at-top'
import { ref } from 'vue'

const CHECK_INTERVAL = 25
const CHECK_TIMEOUT = 500

/**
 * Freezes the scroll position of the element until all lazy loaded elements have loaded.
 * Unfreezes immediately when the user scrolls.
 */
export const useFreezing = () => {
  const { hash, isIntersectionEnabled } = useNavState()

  const lazyIds = ref<Set<string>>(new Set())

  /** Tries to freeze the scroll position of the element */
  // console.log('⏸️ FREEZING', hash.value)
  const unfreeze = freezeAtTop(hash.value)

  /** Resume scrolling */
  const resume = () => {
    unfreeze?.()
    hasLazyLoaded.value = true
    isIntersectionEnabled.value = true
  }

  // Use the lazybus to handle [un]freezing elements
  lazyBus.on(({ loading, loaded, save }) => {
    if (hasLazyLoaded.value) {
      return
    }

    // Track the previous elements that are loading
    if (loading && save) {
      lazyIds.value.add(loading)
    }

    // Track which elements have loaded
    if (loaded && save) {
      lazyIds.value.delete(loaded)
    }

    // We are empty! Unfreeze the page
    if (lazyIds.value.size === 0) {
      let lastCheckTime = Date.now()

      const checkAndResume = () => {
        const now = Date.now()
        if (lazyIds.value.size === 0) {
          // If we've been at size 0 for CHECK_TIMEOUT, resume
          if (now - lastCheckTime >= CHECK_TIMEOUT) {
            resume()
            return
          }
        } else {
          // Size is no longer 0, reset the timer
          lastCheckTime = now
        }

        // Continue checking
        setTimeout(checkAndResume, CHECK_INTERVAL)
      }

      // Start the checking loop
      checkAndResume()
    }
  })
}
