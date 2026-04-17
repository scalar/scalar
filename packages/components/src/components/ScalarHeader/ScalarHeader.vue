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

const { cx } = useBindCx()

defineSlots<{
  /** The first section of the header, typically on the left */
  start?(): unknown
  /** The middle section of the header */
  default?(): unknown
  /** The last section of the header, typically on the right */
  end?(): unknown
}>()
</script>
<template>
  <header
    v-bind="
      cx(
        'flex min-h-header items-center justify-between gap-2 border-b px-3 min-w-min',
        '*:flex *:flex-1 *:items-center *:gap-1',
        'bg-b-header-1 text-c-header border-border-header',
      )
    ">
    <div class="justify-start"><slot name="start" /></div>
    <div
      v-if="$slots.default"
      class="justify-center">
      <slot />
    </div>
    <div class="justify-end"><slot name="end" /></div>
  </header>
</template>
