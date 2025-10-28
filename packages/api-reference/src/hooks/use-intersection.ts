import { useIntersectionObserver } from '@vueuse/core'
import { type TemplateRef, onMounted } from 'vue'

export const useIntersection = (el: TemplateRef<HTMLElement | undefined>, onIntersect: () => void) => {
  const calculateRootMargin = (element: HTMLElement) => {
    const height = element.offsetHeight
    // Use of a margin on height to ensure sooner intersection detection.
    return `${height / 2}px 0px ${height / 2}px 0px`
  }

  const calculateThreshold = (element: HTMLElement) => {
    const height = element.offsetHeight
    // Favor larger threshold if the element is smaller that the screen
    // to ensure that it is selected
    return height < window.innerHeight ? 0.8 : 0.5
  }

  onMounted(() => {
    if (el.value) {
      const options = {
        rootMargin: calculateRootMargin(el.value),
        threshold: calculateThreshold(el.value),
      }

      useIntersectionObserver(
        el,
        ([entry]) => {
          if (entry?.isIntersecting) {
            onIntersect()
          }
        },
        options,
      )
    }
  })
}
