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
import type { ScalarSidebarItemProps, ScalarSidebarItemSlots } from './types'

const { is = 'a', indent = 0 } = defineProps<ScalarSidebarItemProps>()

defineSlots<ScalarSidebarItemSlots>()

const variants = cva({
  base: [
    'group/button flex items-stretch rounded p-2 ',
    'font-sidebar leading-5 text-c-2 no-underline wrap-break-word',
  ],
  variants: {
    active: { true: 'text-c-1 font-sidebar-active' },
    disabled: { true: 'cursor-auto' },
    selected: { true: 'cursor-auto bg-b-2 text-c-1 font-sidebar-active' },
  },
  compoundVariants: [
    { selected: false, disabled: false, class: 'hover:bg-b-2' },
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
    <div class="flex-1 min-w-0">
      <slot />
    </div>
    <slot name="aside" />
  </component>
</template>
