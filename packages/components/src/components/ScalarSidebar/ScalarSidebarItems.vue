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
        'group/items relative flex flex-col text-base p-3 gap-px transition-transform duration-300',
        open ? '-translate-x-full' : 'translate-x-0',
      )
    ">
    <slot />
  </component>
</template>
<style>
@reference "../../style.css";

/* Hide the buttons from the keyboard when a nested item is open */
.group\/items.-translate-x-full .group\/button {
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
.group\/item.group\/nested-items-open
  > *
  > .group\/items.translate-x-0
  .group\/button {
  max-height: calc(infinity * 1px);
  display: flex;
}
</style>
