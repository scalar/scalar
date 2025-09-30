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
import { ScalarIconCheck } from '@scalar/icons'

import type { ScalarCheckboxType } from './types'

const { type = 'checkbox' } = defineProps<{
  selected?: boolean
  type?: ScalarCheckboxType
}>()
</script>
<template>
  <div
    class="flex size-4 items-center justify-center p-0.75"
    :class="[
      selected ? 'bg-c-accent text-b-1' : 'text-transparent shadow-border',
      type === 'checkbox' ? 'rounded' : 'rounded-full',
    ]">
    <ScalarIconCheck
      v-if="selected"
      class="size-3"
      weight="bold" />
  </div>
</template>
