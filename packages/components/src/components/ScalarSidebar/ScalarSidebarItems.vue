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

.group\/items > .group\/item:not(.group\/nested-items) > * {
  max-height: calc(infinity * 1px);
}

.group\/items.-translate-x-full > .group\/item:not(.group\/nested-items) > * {
  /* Squish the items so they don't affect the scrolling */
  max-height: 0;

  /* Delay the max height transition so it's after transform */
  transition-property: max-height;
  transition-duration: 0s;
  transition-delay: 300ms;
}
</style>
