<script lang="ts">
/**
 * Scalar checkbox base component
 *
 * Provides a styled visual checkbox but not the underlying input element.
 *
 * This is used internally by the ScalarCheckboxInput component.
 *
 * If you're looking to create an interactive checkbox you
 * probably want the ScalarCheckboxInput component.
 *
 * @example
 * <ScalarCheckbox :selected="state" type="radio" />
 */
export default {}
</script>
<script setup lang="ts">
import { ScalarIconCheck, ScalarIconMinus } from '@scalar/icons'

import type { ScalarCheckboxType } from './types'

const props = withDefaults(
  defineProps<{
    selected?: boolean
    /** Checkbox only: shows a minus icon when true and `selected` is false (partial selection). */
    indeterminate?: boolean
    type?: ScalarCheckboxType
  }>(),
  {
    type: 'checkbox',
    indeterminate: false,
  },
)
</script>
<template>
  <div
    class="flex size-4 items-center justify-center p-0.75"
    :class="[
      props.selected
        ? 'bg-c-accent text-b-1'
        : props.indeterminate && props.type === 'checkbox'
          ? 'bg-c-accent text-b-1'
          : 'text-transparent shadow-border',
      props.type === 'checkbox' ? 'rounded' : 'rounded-full',
    ]">
    <ScalarIconCheck
      v-if="props.selected"
      class="size-3"
      weight="bold" />
    <ScalarIconMinus
      v-else-if="props.indeterminate && props.type === 'checkbox'"
      aria-hidden="true"
      class="size-3"
      weight="bold" />
  </div>
</template>
