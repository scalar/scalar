<script lang="ts">
/**
 * Scalar Form component
 *
 * A form for creating and editing data.
 *
 * Automatically calls preventDefault on the form submit event.
 *
 * @example
 *   <ScalarForm>
 *     <!-- Form content -->
 *   </ScalarForm>
 */
export default {}
</script>
<script lang="ts" setup>
import { useBindCx } from '@scalar/use-hooks/useBindCx'

defineEmits<{
  /** Emitted when the form is submitted */
  (e: 'submit', event: SubmitEvent): void
}>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <form
    v-bind="cx('flex flex-col')"
    @submit.prevent="$emit('submit', $event as SubmitEvent)">
    <slot />
  </form>
</template>
