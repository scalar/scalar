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
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import { cva } from '@scalar/use-hooks/useBindCx'
import type { Component } from 'vue'

const { is = 'button' } = defineProps<{
  is?: string | Component
  active?: boolean
}>()

defineSlots<{
  /** The contents of the button */
  default?: () => any
}>()

const variants = cva({
  base: 'group/button flex items-center rounded  px-2.5 py-1.5 font-medium no-underline leading-3 ',
  variants: {
    active: {
      true: 'bg-b-3 cursor-default',
      false: 'bg-transparent hover:bg-b-3 cursor-pointer',
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
    v-bind="cx(variants({ active }))">
    <slot />
  </component>
</template>
