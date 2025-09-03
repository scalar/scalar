import { hasLazyLoaded, lazyBus } from '@/components/Lazy/lazyBus'
import { useSidebar } from '@/features/sidebar'
import { useNavState } from '@/hooks/useNavState'
import { computed, ref } from 'vue'
import { freezeAtTop } from '@scalar/helpers/dom/freeze-at-top'
import { useDebounceFn } from '@vueuse/core'
import { getCurrentIndex } from '@/components/Content/Operations/get-current-index'

/**
 * This hook only needs to be called once above everything that is lazy
 *
 * It handles setting the root active index to decide what gets shown first
 */
export const useLazyLoading = () => {
  const { contentItems } = useSidebar()
  const { hash, isIntersectionEnabled } = useNavState()

  /** Tries to freeze the scroll position of the element */
  const unfreeze = freezeAtTop(hash.value)

  /** Resume scrolling on a debounce in case elements are still loading in */
  const debouncedResume = useDebounceFn(() => {
    unfreeze?.()
    hasLazyLoaded.value = true
    isIntersectionEnabled.value = true
  }, 500)

  /** IDs for all lazy elements above the current entry */
  const lazyIds = ref<Set<string>>(new Set())

  /** The index of the root entry */
  const rootLazyIndex = computed(() => getCurrentIndex(hash.value, contentItems.value))

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
      debouncedResume()
    }
  })

  // Resume scrolling after 5 seconds as a failsafe
  setTimeout(debouncedResume, 4500)

  return {
    rootLazyIndex,
  }
}
