<script lang="ts">
/**
 * Scalar Sidebar Group component
 *
 * A collapsible ScalarSidebarItem that can contain subitems
 *
 * @example
 * <ScalarSidebarGroup v-model="open">
 *   <!-- Group toggle text -->
 *   <template #items>
 *     <ScalarSidebarItem>...</ScalarSidebarItem>
 *     <ScalarSidebarItem>...</ScalarSidebarItem>
 *     <ScalarSidebarItem>...</ScalarSidebarItem>
 *   </template>
 * </ScalarSidebarGroup>
 */
export default {}
</script>
<script setup lang="ts">
import type { Component } from 'vue'

import { useBindCx } from '../../hooks/useBindCx'
import ScalarSidebarButton from './ScalarSidebarButton.vue'
import ScalarSidebarGroupToggle from './ScalarSidebarGroupToggle.vue'
import { useSidebarGroups } from './useSidebarGroups'

const { is = 'ul' } = defineProps<{
  is?: Component | string
}>()

const open = defineModel<boolean>()

defineSlots<{
  /** The text content of the toggle */
  default?: () => any
  /** Override the entire toggle button */
  button?: () => any
  /** The list of sidebar subitems */
  items?: () => any
}>()

const { level } = useSidebarGroups({ increment: true })

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <li class="contents">
    <slot
      name="button"
      :open="open">
      <ScalarSidebarButton
        is="button"
        :aria-expanded="open"
        class="text-c-1"
        :indent="level"
        @click="open = !open">
        <template #icon>
          <ScalarSidebarGroupToggle :open="open" />
        </template>
        <slot :open="open" />
      </ScalarSidebarButton>
    </slot>
    <component
      :is="is"
      v-if="open"
      v-bind="cx('flex flex-col relative')">
      <slot
        name="items"
        :open="open" />
      <div
        class="absolute w-border bg-border h-full top-1/2 -translate-y-1/2"
        :style="{ left: 13 + 18 * level + 'px' }" />
    </component>
  </li>
</template>
