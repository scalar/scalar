<script lang="ts">
/**
 * Scalar Sidebar Group Toggle Button component
 *
 * Provides the standalone expand and collapse control for a discrete
 * ScalarSidebarGroup, where the group label is a control of its own
 * (usually a link) and therefore cannot also own the open state.
 *
 * The button is positioned over the end of the group label, so it needs a
 * positioned ancestor and a ScalarSidebarGroupToggleSpacer inside the label
 * to reserve room for it.
 *
 * @example
 * <ScalarSidebarGroupToggleButton
 *   :open="open"
 *   @click="open = !open">
 *   <template #label>{{ open ? 'Close' : 'Open' }} Authentication</template>
 * </ScalarSidebarGroupToggleButton>
 *
 * @see ScalarSidebarGroup
 */
export default {}
</script>
<script setup lang="ts">
import { cva, useBindCx } from '@scalar/use-hooks/useBindCx'

import ScalarSidebarGroupToggle from './ScalarSidebarGroupToggle.vue'

const { open = false } = defineProps<{
  /**
   * Whether or not the group is open
   *
   * @default false
   */
  open?: boolean
  /**
   * Whether or not the group label underneath the button is selected
   *
   * Matches the hover styles of the button to the label it sits on top of.
   */
  selected?: boolean
}>()

defineSlots<{
  /** Override the toggle icon */
  default?(props: { open: boolean }): unknown
  /** Override the screen reader label */
  label?(props: { open: boolean }): unknown
}>()

const variants = cva({
  base: [
    // Position the button over the end of the group label
    'absolute top-[1lh] right-1.25 -translate-y-1/2',
    // Sizing and color
    'rounded p-0.75 text-sidebar-c-2',
  ],
  variants: {
    selected: {
      true: 'hover:bg-sidebar-b-1 hover:text-sidebar-c-1',
      false: 'hover:bg-sidebar-b-hover hover:text-sidebar-c-hover',
    },
  },
  defaultVariants: { selected: false },
})

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <button
    :aria-expanded="open"
    type="button"
    v-bind="cx(variants({ selected }))">
    <slot :open>
      <ScalarSidebarGroupToggle :open>
        <template
          v-if="$slots.label"
          #label>
          <slot
            name="label"
            :open />
        </template>
      </ScalarSidebarGroupToggle>
    </slot>
  </button>
</template>
