<script lang="ts">
/**
 * Scalar Sidebar Items component
 *
 * A base container for ScalarSidebarItem(s), renders as
 * a  `<ul>` by default to meet accessibility requirements
 *
 * @example
 * <ScalarSidebarItems>
 *   <ScalarSidebarItem>...</ScalarSidebarItem>
 *   <ScalarSidebarItem>...</ScalarSidebarItem>
 *   <ScalarSidebarItem>...</ScalarSidebarItem>
 * </ScalarSidebarItems>
 *
 * Stable hooks for styling from outside the component:
 * - `.scalar-sidebar-items` targets the list
 * - `[data-nested-open]` is set while a nested list inside it is open,
 *   which slides this list out of view
 */
export default {}
</script>
<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import type { Component } from 'vue'

import { useSidebarNestedItems } from './useSidebarNestedItems'

const { is = 'ul' } = defineProps<{
  is?: Component | string
}>()

const { open } = useSidebarNestedItems()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <component
    :is="is"
    v-bind="
      cx(
        'scalar-sidebar-items group/items relative flex flex-col p-(--scalar-sidebar-padding) gap-px transition-transform duration-300',
        open ? '-translate-x-full' : 'translate-x-0',
      )
    "
    :data-nested-open="open || undefined">
    <slot />
  </component>
</template>
<style>
@reference "../../style.css";

/* Hide the buttons from the keyboard when a nested item is open */
.scalar-sidebar-items[data-nested-open] .scalar-sidebar-button {
  /* Required to prevent the button from being focused */
  display: none;
  /* Required to prevent the button from taking up scroll space */
  max-height: 0;

  transition-property: display, max-height;
  transition-behavior: allow-discrete;
  transition-duration: 0s;
  transition-delay: 300ms;
}

/* Show the buttons within a nested item when it is open */
.scalar-sidebar-nested-items[data-open]
  > *
  > .scalar-sidebar-items:not([data-nested-open])
  .scalar-sidebar-button {
  max-height: calc(infinity * 1px);
  display: flex;
}
</style>
