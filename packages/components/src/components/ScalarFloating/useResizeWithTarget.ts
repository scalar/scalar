import { type ComputedRef, type Ref, computed, ref, watch } from 'vue'

type ResizeOptions = {
  enabled?: Ref<boolean> | ComputedRef<boolean>
}

export function useResizeWithTarget(
  target: Ref<Element | undefined>,
  opts: ResizeOptions = { enabled: ref(true) },
) {
  const targetWidth = ref(0)
  const observer = ref<ResizeObserver>()

  if (typeof ResizeObserver !== 'undefined')
    observer.value = new ResizeObserver(([entry]) => {
      if (!entry) return
      targetWidth.value = entry.borderBoxSize[0]?.inlineSize ?? 0
    })

  watch(
    () => [opts.enabled?.value, target?.value],
    ([enabled]) => {
      if (!target?.value || !observer.value) return
      if (enabled) observer.value.observe(target.value)
      else observer.value.disconnect()
    },
    { immediate: true },
  )

  return {
    width: computed(() =>
      opts.enabled?.value ? `${targetWidth.value}px` : undefined,
    ),
  }
}
