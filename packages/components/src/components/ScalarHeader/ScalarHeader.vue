<script lang="ts">
/**
 * Scalar header component
 *
 * Used to create a standardized header for Scalar applications
 *
 * @example
 * ```html
 * <ScalarHeader>
 *   <template #start>
 *     <ScalarMenu />
 *     <ScalarHeaderButton>Login</ScalarHeaderButton>
 *     <ScalarHeaderButton>Register</ScalarHeaderButton>
 *   </template>
 *   <template #default>
 *     <ScalarHeaderButton>Middle thing</ScalarHeaderButton>
 *   </template>
 *   <template #end>
 *     <ScalarHeaderButton>Call to Action</ScalarHeaderButton>
 *   </template>
 * </ScalarHeader>
 * ```
 */
export default {}
</script>
<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import { computed, useSlots } from 'vue'

defineSlots<{
  /** The first section of the header, typically on the left */
  start?(): unknown
  /** The middle section of the header */
  default?(): unknown
  /** The last section of the header, typically on the right */
  end?(): unknown
}>()

const { cx } = useBindCx()
const slots = useSlots()

/** Middle slot is optional; layout differs so start/end are not forced to equal width */
const hasCenterSlot = computed(() => Boolean(slots.default))
</script>
<template>
  <header
    v-bind="
      cx(
        'flex min-h-header min-w-0 items-center justify-between gap-2 border-b px-3',
        'bg-b-header-1 text-c-header border-border-header',
      )
    ">
    <div
      v-bind="
        cx(
          'flex items-center gap-1',
          hasCenterSlot
            ? 'shrink-0 justify-start'
            : 'min-w-0 flex-1 justify-start',
        )
      ">
      <slot name="start" />
    </div>
    <div
      v-if="$slots.default"
      class="flex min-w-0 flex-1 items-center justify-center gap-1">
      <slot />
    </div>
    <div class="flex shrink-0 items-center justify-end gap-1">
      <slot name="end" />
    </div>
  </header>
</template>
