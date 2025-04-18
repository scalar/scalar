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

const { is = 'ul' } = defineProps<{
  is?: Component | string
}>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <component
    :is="is"
    v-bind="cx('flex flex-col p-3 gap-px')">
    <slot />
  </component>
</template>
