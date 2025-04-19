<script lang="ts">
/**
 * Scalar Sidebar Group toggle component
 *
 * Provides the toggle icon for a ScalarSidebarGroup
 *
 * @example
 * <ScalarSidebarGroupToggle :open="..." />
 */
export default {}
</script>
<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import { cva } from '@scalar/use-hooks/useBindCx'
import type { Component } from 'vue'

import { type Icon, ScalarIcon } from '../ScalarIcon'

const {
  is = 'div',
  open = false,
  icon = 'ChevronRight',
} = defineProps<{
  /** Override the element tag */
  is?: Component | string
  /** Whether or not the toggle is open */
  open?: boolean
  /** Overrides the icon */
  icon?: Icon
}>()

defineSlots<{
  /** Override the toggle icon */
  default?: (props: { open: boolean }) => any
  /** Override the screen reader label */
  label?: (props: { open: boolean }) => any
}>()

const variants = cva({
  base: 'size-4 -m-px transition-transform duration-100',
  variants: { open: { true: 'rotate-90' } },
  defaultVariants: { open: false },
})
defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <component
    :is="is"
    :type="is === 'button' ? 'button' : undefined"
    v-bind="cx(variants({ open }))">
    <slot :open="open">
      <ScalarIcon :icon="icon" />
    </slot>
    <span class="sr-only">
      <slot
        name="label"
        :open="open">
        {{ open ? 'Close' : 'Open' }} Group
      </slot>
    </span>
  </component>
</template>
