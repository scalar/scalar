import { useIntersectionObserver } from '@vueuse/core'
import { type TemplateRef, onMounted } from 'vue'

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
}

export const useIntersection = (
  el: TemplateRef<HTMLElement | undefined>,
  onIntersect: () => void,
  options?: UseIntersectionOptions,
) => {
  onMounted(() => {
    const observerOptions = {
      rootMargin: options?.immediate ? '0px 0px 0px 0px' : VIEWPORT_VERTICAL_CENTER_ROOT_MARGIN,
      threshold: 0,
    } as const

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
        observerOptions,
      )
    }
  })
}
