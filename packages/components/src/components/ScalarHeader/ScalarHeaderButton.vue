<script lang="ts">
/**
 * Scalar header button component
 *
 * Used within the ScalarHeader component
 *
 * @example
 * ```html
 * <ScalarHeaderButton>
 *   Login
 * </ScalarHeaderButton>
 * ```
 */
export default {}
</script>
<script setup lang="ts">
import { cva, useBindCx } from '@scalar/use-hooks/useBindCx'
import type { Component } from 'vue'

const { is = 'button' } = defineProps<{
  is?: string | Component
  cta?: boolean
}>()

defineSlots<{
  /** The contents of the button */
  default?(): unknown
}>()

const variants = cva({
  base: 'group/button flex items-center rounded  px-3 py-2 text-base/4 no-underline',
  variants: {
    cta: {
      true: 'font-bold bg-b-header-cta text-sm/4 text-c-header-cta hover:bg-h-header-cta',
      false: 'text-c-header-2 hover:text-c-header-1',
    },
  },
})

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <component
    :is="is"
    :type="is === 'button' ? 'button' : undefined"
    v-bind="cx(variants({ cta }))">
    <slot />
  </component>
</template>
