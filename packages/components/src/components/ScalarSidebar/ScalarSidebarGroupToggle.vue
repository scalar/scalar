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
import { ScalarIconCaretRight } from '@scalar/icons'
import type { ScalarIconComponent } from '@scalar/icons/types'
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import { cva } from '@scalar/use-hooks/useBindCx'
import type { Component } from 'vue'

import { type Icon, ScalarIconLegacyAdapter } from '../ScalarIcon'

const { is = 'div', open = false } = defineProps<{
  /** Override the element tag */
  is?: Component | string
  /** Whether or not the toggle is open */
  open?: boolean
  /** Overrides the icon */
  icon?: Icon | ScalarIconComponent
}>()

defineSlots<{
  /** Override the toggle icon */
  default?(props: { open: boolean }): unknown
  /** Override the screen reader label */
  label?(props: { open: boolean }): unknown
}>()

const variants = cva({
  base: 'size-4 flex items-center justify-center transition-transform duration-100',
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
      <ScalarIconLegacyAdapter
        v-if="icon"
        :icon="icon" />
      <ScalarIconCaretRight
        class="size-3"
        weight="bold"
        v-else />
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
