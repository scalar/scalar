<script lang="ts">
/**
 * Scalar header component
 *
 * Provides the header chrome; layout is left to the consumer. Columns hug their
 * content, so give one `flex-1` to take the free space.
 *
 * @example
 * ```html
 * <ScalarHeader>
 *   <ScalarHeaderColumn class="flex-1">
 *     <ScalarMenu />
 *   </ScalarHeaderColumn>
 *   <ScalarHeaderColumn class="justify-end">
 *     <ScalarHeaderButton cta>Register</ScalarHeaderButton>
 *   </ScalarHeaderColumn>
 * </ScalarHeader>
 * ```
 */
export default {}
</script>
<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import { type Component, useSlots } from 'vue'

const { is = 'header' } = defineProps<{
  /** Render as a `div` when nested inside an existing `header` landmark */
  is?: string | Component
}>()

defineSlots<{
  /** The contents of the header, typically `ScalarHeaderColumn` children */
  default?(): unknown
}>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
const slots = useSlots()

// Vue drops content for slots we no longer render, so an unmigrated consumer
// would otherwise just get an empty header.
if (slots.start || slots.end) {
  console.warn(
    'ScalarHeader: the `start`, `center` and `end` slots have been removed. Compose `ScalarHeaderColumn` children instead.',
  )
}
</script>
<template>
  <component
    :is
    v-bind="
      cx(
        'flex min-h-header min-w-0 items-center justify-between gap-2 border-b px-3',
        'bg-b-header-1 text-c-header border-border-header',
      )
    ">
    <slot />
  </component>
</template>
