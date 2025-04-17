<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'

import { type LoadingState, ScalarLoading } from '../ScalarLoading'
import { type Variants, variants } from './variants'

/**
 * Scalar Button
 */
withDefaults(
  defineProps<{
    disabled?: boolean
    fullWidth?: boolean
    loading?: LoadingState | undefined
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
const { cx } = useBindCx()
</script>
<template>
  <button
    :ariaDisabled="disabled || undefined"
    :type="type"
    v-bind="
      cx(variants({ fullWidth, disabled, size, variant }), {
        relative: loading?.isLoading,
      })
    ">
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
        size="xs" />
    </div>
  </button>
</template>
