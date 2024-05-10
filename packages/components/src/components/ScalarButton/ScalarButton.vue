<script setup lang="ts">
import { computed, useAttrs } from 'vue'

import { cx } from '../../cva'
import { type LoadingState, ScalarLoading } from '../ScalarLoading'
import { type Variants, variants } from './variants'

/**
 * Scalar Button
 */
withDefaults(
  defineProps<{
    disabled?: boolean
    fullWidth?: boolean
    loading?: LoadingState
    size?: Variants['size']
    variant?: Variants['variant']
  }>(),
  {
    fullWidth: false,
    size: 'md',
    variant: 'solid',
  },
)

defineOptions({ inheritAttrs: false })

/* Extract the classes so they can be merged by `cx` */
const attrs = computed(() => {
  const { class: className, ...rest } = useAttrs()
  return { className: className || '', rest }
})
</script>
<template>
  <button
    v-bind="attrs.rest"
    :ariaDisabled="disabled || undefined"
    :class="
      cx(
        variants({ fullWidth, disabled, size, variant }),
        { 'pl-9 pr-3': loading },
        `${attrs.className}`,
      )
    "
    type="button">
    <div
      v-if="$slots.icon"
      class="mr-2 h-4 w-4">
      <slot name="icon" />
    </div>
    <slot />
    <div
      v-if="loading"
      class="ml-2">
      <ScalarLoading
        :loadingState="loading"
        size="20px" />
    </div>
  </button>
</template>
