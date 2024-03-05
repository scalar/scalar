import { onMounted } from 'vue'

/**
 *  Applies the given classes to an element on mount
 *
 * @param selector the selector for the element you want to add the class(es) to
 * @param classes the class(es) to be added
 */
export function useApplyClasses(selector: string, classes: string) {
  onMounted(() => {
    if (!document.body) return
    const el = document.querySelector(selector)
    el?.classList.add(classes)
  })
}
