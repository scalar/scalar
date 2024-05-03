import { type MaybeRefOrGetter, computed, ref, toValue, watch } from 'vue'

type ResizeOptions = {
  enabled?: MaybeRefOrGetter<boolean>
}

export function useResizeWithTarget(
  target: MaybeRefOrGetter<Element | undefined>,
  opts: ResizeOptions = { enabled: ref(true) },
) {
  const targetWidth = ref(0)
  const targetHeight = ref(0)
  const observer = ref<ResizeObserver>()

  if (typeof ResizeObserver !== 'undefined')
    observer.value = new ResizeObserver(([entry]) => {
      if (!entry) return
      targetWidth.value = entry.borderBoxSize[0]?.inlineSize ?? 0
      targetHeight.value = entry.borderBoxSize[0]?.blockSize ?? 0
    })

  watch(
    [() => toValue(opts.enabled), () => toValue(target)],
    ([enabled, element]) => {
      if (!element || !observer.value) return
      if (enabled) observer.value.observe(element)
      else observer.value.disconnect()
    },
    { immediate: true },
  )

  return {
    width: computed(() =>
      toValue(opts.enabled) ? `${targetWidth.value}px` : undefined,
    ),
    height: computed(() =>
      toValue(opts.enabled) ? `${targetHeight.value}px` : undefined,
    ),
  }
}
