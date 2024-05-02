<script setup lang="ts">
import {
  type MiddlewareData,
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
} from '@floating-ui/vue'
import { type Ref, computed, ref } from 'vue'

import type { FloatingOptions } from './types'
import { useResizeWithTarget } from './useResizeWithTarget'

const props = defineProps<FloatingOptions>()

defineSlots<{
  /** The reference element for the element in the #floating slot */
  default(): any
  /** The floating element */
  floating(props: {
    /** The width of the reference element if `resize` is true */
    width?: string
    /** The height of the reference element if `resize` is true */
    height?: string
    /** The middleware data return by Floating UI */
    data?: MiddlewareData
  }): any
}>()

defineOptions({ inheritAttrs: false })

const floatingRef: Ref<HTMLElement | null> = ref(null)
const wrapperRef: Ref<HTMLElement | null> = ref(null)

/** Fallback to div wrapper if a button element is not provided */
const targetRef = computed(
  () => (wrapperRef.value?.children?.[0] || wrapperRef.value) ?? undefined,
)

const targetSize = useResizeWithTarget(targetRef, {
  enabled: computed(() => props.resize),
})

const { floatingStyles, middlewareData } = useFloating(targetRef, floatingRef, {
  placement: computed(() => props.placement),
  whileElementsMounted: autoUpdate,
  middleware: computed(() => [
    offset(5),
    flip(),
    shift(),
    ...(props.middleware ?? []),
  ]),
})
</script>
<template>
  <div
    ref="wrapperRef"
    :class="{ contents: !!$slots.default }">
    <slot />
  </div>
  <div
    ref="floatingRef"
    class="relative z-context"
    :style="floatingStyles"
    v-bind="$attrs">
    <slot
      :data="middlewareData"
      :height="targetSize.height.value"
      name="floating"
      :width="targetSize.width.value" />
  </div>
</template>
