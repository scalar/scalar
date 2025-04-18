<script lang="ts">
/**
 * Scalar Form Field component
 *
 * A single form input field with a label.
 *
 * @example
 *   <ScalarFormField>
 *     <template #label>Input Label</template>
 *     <ScalarTextInput ... />
 *   </ScalarFormField>
 */
export default {}
</script>
<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import type { Component } from 'vue'

const { is = 'label' } = defineProps<{
  is?: string | Component
}>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <component
    :is="is"
    v-bind="cx('flex flex-col gap-1.5 rounded')">
    <div
      v-if="$slots.label"
      class="flex items-start justify-between gap-2 text-sm leading-none text-c-1 whitespace-nowrap font-medium">
      <slot name="label" />
    </div>
    <slot />
    <span
      v-if="$slots.below"
      :class="cx('-mt-1.5 text-sm')">
      <slot name="below" />
    </span>
  </component>
</template>
