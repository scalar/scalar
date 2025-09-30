<script lang="ts">
/**
 * Scalar Button Component
 *
 * Provides a styled button, if you are looking for
 * an icon only button, use ScalarIconButton instead,
 * it's a helpful wrapper around this component
 *
 * @example
 *   <ScalarButton>
 *     <template #icon>
 *       <!-- Icon -->
 *     </template>
 *     <!-- Button label -->
 *   </ScalarButton>
 */
export default {}
</script>
<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'

import { type LoadingState, ScalarLoading } from '../ScalarLoading'
import { type Variants, variants } from './variants'

const {
  size = 'md',
  variant = 'solid',
  type = 'button',
} = defineProps<{
  disabled?: boolean
  fullWidth?: boolean
  loading?: LoadingState | undefined
  size?: Variants['size']
  variant?: Variants['variant']
  type?: 'button' | 'submit' | 'reset'
}>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <button
    :aria-disabled="disabled || undefined"
    :type="type"
    v-bind="
      cx(variants({ fullWidth, disabled, size, variant }), {
        relative: loading?.isLoading,
      })
    ">
    <div
      v-if="$slots.icon"
      class="mr-2 size-4"
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
      class="centered">
      <ScalarLoading
        :loadingState="loading"
        size="xl" />
    </div>
  </button>
</template>
