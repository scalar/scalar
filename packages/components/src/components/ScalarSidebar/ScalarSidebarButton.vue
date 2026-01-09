<script lang="ts">
/**
 * Scalar Sidebar Button component
 *
 * Provide a styled link for the ScalarSidebar or similar, supports
 * the same props and slots as ScalarSidebarItem
 *
 * This is used internally by the ScalarSidebarItem component
 *
 * If you're looking to create items in ScalarSidebarItems
 * you probably want the ScalarSidebarItem component
 *
 * @example
 *   <ScalarSidebarButton>
 *     <template #icon>
 *       <!-- Overrides the icon slot -->
 *     </template>
 *     <!-- Button text -->
 *     <template #aside>
 *       <!-- After the button text -->
 *     </template>
 *   </ScalarSidebarButton>
 */
export default {}
</script>
<script setup lang="ts">
import { cva, useBindCx } from '@scalar/use-hooks/useBindCx'

import { ScalarIconLegacyAdapter } from '../ScalarIcon'
import ScalarSidebarIndent from './ScalarSidebarIndent.vue'
import type { ScalarSidebarButtonSlots, ScalarSidebarItemProps } from './types'

const { is = 'a', indent = 0 } = defineProps<ScalarSidebarItemProps>()

defineSlots<ScalarSidebarButtonSlots>()

const variants = cva({
  base: [
    'group/button peer/button flex items-stretch rounded p-2',
    'font-sidebar text-base/5  text-sidebar-c-2 no-underline wrap-break-word',
  ],
  variants: {
    active: { true: 'text-sidebar-c-active font-sidebar-active' },
    disabled: { true: 'cursor-auto' },
    selected: {
      true: 'cursor-auto bg-sidebar-b-active text-sidebar-c-active font-sidebar-active',
    },
  },
  compoundVariants: [
    {
      selected: false,
      disabled: false,
      active: false,
      class: 'hover:bg-sidebar-b-hover hover:text-sidebar-c-hover',
    },
    {
      selected: false,
      disabled: false,
      active: true,
      class: 'hover:bg-sidebar-b-hover',
    },
  ],
  defaultVariants: { selected: false, disabled: false, active: false },
})
defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <component
    :is="is"
    :aria-selected="selected"
    :type="is === 'button' ? 'button' : undefined"
    v-bind="cx(variants({ selected, disabled, active }))">
    <slot name="indent">
      <ScalarSidebarIndent
        class="-my-2"
        :disabled
        :indent
        :selected />
    </slot>
    <div
      v-if="icon || $slots.icon"
      class="h-[1lh] *:size-4 mr-1">
      <slot name="icon">
        <ScalarIconLegacyAdapter
          v-if="icon"
          :icon="icon" />
      </slot>
    </div>
    <div class="group/button-label flex-1 min-w-0">
      <slot />
    </div>
    <slot name="aside" />
  </component>
</template>
