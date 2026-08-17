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
import { computed } from 'vue'

import { ScalarIconLegacyAdapter } from '../ScalarIcon'
import ScalarSidebarIndent from './ScalarSidebarIndent.vue'
import type { ScalarSidebarButtonSlots, ScalarSidebarItemProps } from './types'

const {
  is = 'a',
  indent = 0,
  href,
  disabled,
} = defineProps<ScalarSidebarItemProps>()

defineSlots<ScalarSidebarButtonSlots>()

/**
 * The link target, dropped whenever the item cannot be a working link.
 *
 * An anchor cannot be disabled the way a button can, so a disabled item must
 * not carry an href — otherwise it stays focusable and navigable despite
 * being presented as unavailable. An href is also meaningless on a plain
 * element like a button, where it would render as an invalid attribute.
 * Component targets keep it, since they take the href as a prop.
 */
const linkHref = computed(() => {
  if (disabled || (typeof is === 'string' && is !== 'a')) {
    return undefined
  }

  return href || undefined
})

const variants = cva({
  base: [
    'group/button peer/button flex items-stretch rounded p-2',
    'font-sidebar text-base/4  text-sidebar-c-2 no-underline wrap-break-word',
    // Match the inset focus ring the theme reset gives buttons so the ring
    // looks the same when the item renders as an anchor
    'focus-visible:-outline-offset-1',
  ],
  variants: {
    active: { true: 'text-sidebar-c-active font-sidebar-active' },
    // cursor-default (not cursor-auto) so anchors show the same arrow cursor
    // buttons do, signalling the item is not actionable
    disabled: { true: 'cursor-default' },
    selected: {
      true: 'cursor-default bg-sidebar-b-active text-sidebar-c-active font-sidebar-active',
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
    :aria-current="selected ? 'page' : undefined"
    :href="linkHref"
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
      class="h-lh *:size-4 mr-1 flex items-center">
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
