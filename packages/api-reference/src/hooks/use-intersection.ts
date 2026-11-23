import { useIntersectionObserver } from '@vueuse/core'
import { type TemplateRef, onMounted } from 'vue'

import { type ReferenceScrollPane, useReferenceScrollPane } from './use-reference-scroll-pane'

/**
 * Shrinks the observation root to a thin horizontal strip at the vertical middle of
 * the viewport (~2% of viewport height). Emits only while the target overlaps that line.
 */
const VIEWPORT_VERTICAL_CENTER_ROOT_MARGIN = '-49% 0px -49% 0px'

type UseIntersectionOptions = {
  /** Called when the element stops intersecting. */
  onExit?: () => void
  /**
   * Whether to immediately fire the intersection as soon as the element is on the screen.
   *
   * When false (default) we use a root margin that is 2% of the viewport height on the middle of the viewport.
   */
  immediate?: boolean
  /** The root reference supplies its pane directly to the start sentinel. */
  pane?: ReferenceScrollPane
}

export const useIntersection = (
  el: TemplateRef<HTMLElement | undefined>,
  onIntersect: () => void,
  options?: UseIntersectionOptions,
): void => {
  const pane = options?.pane ?? useReferenceScrollPane()

  onMounted(() => {
    const rootMargin = (): string => {
      if (options?.immediate) {
        return '0px'
      }

      // IntersectionObserver resolves percentage margins against the root's width.
      const paneHeight = pane?.scrollportHeight.value
      return paneHeight ? `-${paneHeight * 0.49}px 0px` : VIEWPORT_VERTICAL_CENTER_ROOT_MARGIN
    }

    if (el.value) {
      useIntersectionObserver(
        el,
        ([entry]) => {
          if (entry?.isIntersecting) {
            onIntersect()
          } else {
            options?.onExit?.()
          }
        },
        { root: pane?.element, rootMargin, threshold: 0 },
      )
    }
  })
}
