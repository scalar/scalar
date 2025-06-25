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
        'relative flex flex-col text-base p-3 gap-px transition-transform duration-300',
        open ? '-translate-x-full' : 'translate-x-0',
      )
    ">
    <slot />
  </component>
</template>
