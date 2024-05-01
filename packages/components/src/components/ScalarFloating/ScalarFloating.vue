<script setup lang="ts">
import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/vue'
import { type Ref, computed, ref } from 'vue'

import type { FloatingOptions } from './types'
import { useResizeWithTarget } from './useResizeWithTarget'

const props = defineProps<FloatingOptions>()

defineOptions({ inheritAttrs: false })

const floatingRef: Ref<HTMLElement | null> = ref(null)
const wrapperRef: Ref<HTMLElement | null> = ref(null)

/** Fallback to div wrapper if a button element is not provided */
const targetRef = computed(
  () => (wrapperRef.value?.children?.[0] || wrapperRef.value) ?? undefined,
)

const resize = computed(() => props.resize)
const { width: targetWidth } = useResizeWithTarget(targetRef, {
  enabled: resize,
})

const { floatingStyles } = useFloating(targetRef, floatingRef, {
  placement: props.placement || 'bottom',
  whileElementsMounted: autoUpdate,
  middleware: [offset(5), flip(), shift()],
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
      name="floating"
      :width="targetWidth" />
  </div>
</template>
