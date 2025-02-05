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
import { cva } from '../../cva'
import { useBindCx } from '../../hooks/useBindCx'
import { ScalarIcon } from '../ScalarIcon'
import type { ScalarSidebarItemProps, ScalarSidebarItemSlots } from './types'

const { is = 'a', indent = 0 } = defineProps<ScalarSidebarItemProps>()

defineSlots<ScalarSidebarItemSlots>()

const variants = cva({
  base: ['rounded p-1.5 font-medium text-c-2 no-underline'],
  variants: {
    selected: { true: 'cursor-auto bg-b-2 text-c-1' },
    disabled: { true: 'cursor-auto' },
    indent: {
      0: 'pl-[6px]',
      1: 'pl-[24px]',
      2: 'pl-[42px]',
      3: 'pl-[60px]',
      4: 'pl-[78px]',
      5: 'pl-[96px]',
      6: 'pl-[114px]',
    },
  },
  compoundVariants: [
    { selected: false, disabled: false, class: 'hover:bg-b-2' },
  ],
  defaultVariants: { selected: false, disabled: false, indent: 0 },
})
defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <component
    :is="is"
    :aria-level="indent"
    :type="is === 'button' ? 'button' : undefined"
    v-bind="cx(variants({ selected, disabled, indent }))">
    <div class="flex items-center gap-1 flex-1">
      <div
        v-if="icon || $slots.icon"
        class="size-3.5">
        <slot name="icon">
          <ScalarIcon :icon="icon" />
        </slot>
      </div>
      <slot />
    </div>
    <div v-if="$slots.aside">
      <slot name="aside" />
    </div>
  </component>
</template>
