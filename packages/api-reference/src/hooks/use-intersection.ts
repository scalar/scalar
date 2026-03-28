import { useIntersectionObserver } from '@vueuse/core'
import { type TemplateRef, onMounted } from 'vue'

/**
 * Shrinks the observation root to a thin horizontal strip at the vertical middle of
 * the viewport (~2% of viewport height). Emits only while the target overlaps that line.
 */
const VIEWPORT_VERTICAL_CENTER_ROOT_MARGIN = '-49% 0px -49% 0px'

export const useIntersection = (el: TemplateRef<HTMLElement | undefined>, onIntersect: () => void) => {
  onMounted(() => {
    if (el.value) {
      const observerOptions = {
        rootMargin: VIEWPORT_VERTICAL_CENTER_ROOT_MARGIN,
        threshold: 0,
      }

      useIntersectionObserver(
        el,
        ([entry]) => {
          if (entry?.isIntersecting) {
            onIntersect()
          }
        },
        observerOptions,
      )
    }
  })
}
