import { type TemplateRef, nextTick, ref, watch } from 'vue'

export const useVirtual = (el: TemplateRef<HTMLElement | undefined>) => {
  const isVisible = ref(false)
  const observer = ref<IntersectionObserver | null>(null)
  const placeholderHeight = ref(1000)

  watch(el, () => {
    if (el.value) {
      observer.value?.disconnect()

      observer.value = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            isVisible.value = true
            nextTick(() => {
              placeholderHeight.value = el.value?.offsetHeight || 1000
            })
          }
        },
        {
          rootMargin: '9000px',
        },
      )
      observer.value.observe(el.value)
    } else {
      observer.value?.disconnect()
    }
  })

  return {
    isVisible,
    placeholderHeight,
  }
}
