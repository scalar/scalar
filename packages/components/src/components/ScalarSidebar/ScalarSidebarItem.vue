<script lang="ts">
/**
 * Scalar Sidebar Item component
 *
 * Provides a ScalarSidebarButton wrapped in an `<li>` to
 * meet accessibility requirements and automatically indents
 * the button based on the level of the sidebar group
 *
 * @example
 * <ScalarSidebarItem>
 *   <template #icon>
 *     <!-- Overrides the icon slot -->
 *   </template>
 *   <!-- Button text -->
 *   <template #aside>
 *     <!-- After the button text -->
 *   </template>
 *   <!-- Content to display before the button but inside the list item -->
 *   <template #before>
 *     <!-- Before the button -->
 *   </template>
 *   <!-- Content to display after the button but inside the list item -->
 *   <template #after>
 *     <!-- After the button -->
 *   </template>
 * </ScalarSidebarItem>
 */
export default {}
</script>
<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'

import ScalarSidebarButton from './ScalarSidebarButton.vue'
import type { ScalarSidebarItemProps, ScalarSidebarItemSlots } from './types'
import { useSidebarGroups } from './useSidebarGroups'

const props = defineProps<ScalarSidebarItemProps>()

defineSlots<ScalarSidebarItemSlots>()

const { level } = useSidebarGroups()

const { cx } = useBindCx()
defineOptions({ inheritAttrs: false })
</script>
<template>
  <li v-bind="cx('group/item flex flex-col')">
    <slot name="before" />
    <slot
      :level="level"
      name="button">
      <ScalarSidebarButton
        v-bind="props"
        :indent="indent ?? level">
        <!-- Pass through all the slots -->
        <template
          v-if="$slots.default"
          #default>
          <slot />
        </template>
        <template
          v-if="$slots.icon"
          #icon>
          <slot name="icon" />
        </template>
        <template
          v-if="$slots.aside"
          #aside>
          <slot name="aside" />
        </template>
      </ScalarSidebarButton>
    </slot>
    <slot name="after" />
  </li>
</template>
