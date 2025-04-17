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
  start?: () => any
  /** The middle section of the header */
  default?: () => any
  /** The last section of the header, typically on the right */
  end?: () => any
}>()
</script>
<template>
  <header
    v-bind="
      cx(
        'flex min-h-header items-center justify-between gap-2 bg-b-2 border-b px-2 text-sm min-w-min',
        '*:flex *:flex-1 *:items-center *:gap-px',
      )
    ">
    <div class="justify-start"><slot name="start" /></div>
    <div class="justify-center"><slot /></div>
    <div class="justify-end"><slot name="end" /></div>
  </header>
</template>
