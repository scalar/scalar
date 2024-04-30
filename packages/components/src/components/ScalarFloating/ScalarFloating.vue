<script setup lang="ts">
import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/vue'
import { type Ref, computed, ref, watch } from 'vue'

import type { FloatingOptions } from './types'

const props = defineProps<FloatingOptions>()

defineOptions({ inheritAttrs: false })

const floatingRef: Ref<HTMLElement | null> = ref(null)

const wrapperRef: Ref<HTMLElement | null> = ref(null)

const targetWidth = ref(0)
const observer = ref<ResizeObserver>()

if (typeof ResizeObserver !== 'undefined')
  observer.value = new ResizeObserver(([entry]) => {
    if (!entry) return
    targetWidth.value = entry.target.clientWidth
  })

/** Fallback to div wrapper if a button element is not provided */
const targetRef = computed(
  () => wrapperRef.value?.children?.[0] || wrapperRef.value,
)

// Watch the width of the trigger if fullWidth is enabled
watch(
  () => [props.resize, targetRef.value],
  ([observe]) => {
    if (!targetRef.value || !observer.value) return
    if (observe) observer.value.observe(targetRef.value)
    else observer.value.disconnect()
  },
  { immediate: true },
)

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
      :width="resize ? `${targetWidth}px` : undefined" />
  </div>
</template>
