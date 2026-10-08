import { startViewTransition, supportsViewTransitions } from '@scalar/helpers/dom/start-view-transition'
import { type Ref, ref } from 'vue'

import { EXPLORE_VT_ATTRIBUTE } from './constants'

type ExploreTransitionDirection = 'open' | 'close'

/**
 * Runs the open/close choreography of the Explore Scalar card.
 *
 * While a run is in flight the `<html>` element carries the direction in a data attribute so the
 * global `::view-transition-*` rules only match our transition and never a host page's own.
 */
export const useExploreScalarTransition = (): {
  run: (direction: ExploreTransitionDirection, update: () => Promise<void>) => Promise<void>
  isTransitioning: Ref<boolean>
  usesViewTransition: Ref<boolean>
} => {
  const isTransitioning = ref(false)

  /** True for the lifetime of an open session that was entered through a view transition */
  const usesViewTransition = ref(false)

  const run = async (direction: ExploreTransitionDirection, update: () => Promise<void>): Promise<void> => {
    if (!supportsViewTransitions()) {
      await update()
      return
    }

    isTransitioning.value = true
    const root = document.documentElement
    root.setAttribute(EXPLORE_VT_ATTRIBUTE, direction)

    try {
      await startViewTransition(update)
    } finally {
      root.removeAttribute(EXPLORE_VT_ATTRIBUTE)
      isTransitioning.value = false
    }
  }

  return { run, isTransitioning, usesViewTransition }
}
