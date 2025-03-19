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
import { useBindCx } from '../../hooks/useBindCx'

defineProps<{
  error?: boolean
}>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <label
    v-bind="
      cx('flex flex-col gap-1.5 rounded', {
        'outline outline-c-danger outline-offset-2': error,
      })
    ">
    <div
      v-if="$slots.label"
      class="flex items-start justify-between gap-2 text-sm leading-none text-c-1">
      <span class="whitespace-nowrap font-medium">
        <slot name="label" />
      </span>
    </div>
    <slot />
  </label>
</template>
