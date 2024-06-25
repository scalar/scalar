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
    type?: 'button' | 'submit' | 'reset'
  }>(),
  {
    fullWidth: false,
    size: 'md',
    variant: 'solid',
    type: 'button',
  },
)

defineOptions({ inheritAttrs: false })

/* Extract the classes so they can be merged by `cx` */
const attrs = computed(() => {
  const { class: className, ...rest } = useAttrs()
  return { class: className || '', rest }
})
</script>
<template>
  <button
    v-bind="attrs.rest"
    :ariaDisabled="disabled || undefined"
    :class="
      cx(
        variants({ fullWidth, disabled, size, variant }),
        { relative: loading?.isLoading },
        `${attrs.class}`,
      )
    "
    :type="type">
    <div
      v-if="$slots.icon"
      class="mr-2 h-4 w-4"
      :class="{ invisible: loading?.isLoading }">
      <slot name="icon" />
    </div>
    <span
      v-if="loading"
      :class="{ invisible: loading?.isLoading }">
      <slot />
    </span>
    <slot v-else />
    <div
      v-if="loading?.isLoading"
      class="centered-x absolute">
      <ScalarLoading
        :loadingState="loading"
        size="12px" />
    </div>
  </button>
</template>
