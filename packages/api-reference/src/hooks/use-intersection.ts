import { useIntersectionObserver } from '@vueuse/core'
import { type TemplateRef, onMounted } from 'vue'

/**
 * Shrinks the observation root to a thin horizontal strip at the vertical middle of
 * the viewport (~2% of viewport height). Emits only while the target overlaps that line.
 */
const VIEWPORT_VERTICAL_CENTER_ROOT_MARGIN = '-49% 0px -49% 0px'

export type UseIntersectionRootRegion = 'element-inset' | 'viewport-center-band'

export type UseIntersectionOptions = {
  /**
   * `viewport-center-band`: target must overlap the vertical center of the viewport
   * (narrow band around 50vh, not the full visible area).
   * `element-inset`: positive root margin by half the element height (earlier detection).
   */
  rootRegion?: UseIntersectionRootRegion
}

/**
 * `intersectionRatio` is visible area ÷ target bounding area, not viewport coverage.
 * A threshold like 0.5 can never be reached when the target is taller than ~2× the
 * visible root height, so callbacks never fire. Use `threshold: 0` for scroll-spy.
 */
const getObserverOptions = (element: HTMLElement, rootRegion: UseIntersectionRootRegion) => {
  if (rootRegion === 'viewport-center-band') {
    return {
      rootMargin: VIEWPORT_VERTICAL_CENTER_ROOT_MARGIN,
      threshold: 0,
    }
  }

  const height = element.offsetHeight
  const rootMargin = `${height / 2}px 0px ${height / 2}px 0px`
  const threshold =
    height < window.innerHeight
      ? 0.8
      : Math.min(0.5, (window.innerHeight / height) * 0.99)

  return { rootMargin, threshold }
}

export const useIntersection = (
  el: TemplateRef<HTMLElement | undefined>,
  onIntersect: () => void,
  options?: UseIntersectionOptions,
) => {
  const rootRegion = options?.rootRegion ?? 'viewport-center-band'

  onMounted(() => {
    if (el.value) {
      const observerOptions = getObserverOptions(el.value, rootRegion)

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
