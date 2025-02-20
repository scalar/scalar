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
 * </ScalarSidebarItem>
 */
export default {}
</script>
<script setup lang="ts">
import ScalarSidebarButton from './ScalarSidebarButton.vue'
import type { ScalarSidebarItemProps, ScalarSidebarItemSlots } from './types'
import { useSidebarGroups } from './useSidebarGroups'

const { indent = undefined } = defineProps<ScalarSidebarItemProps>()
// We need to expose the slots here or we get a type error :(
const slots = defineSlots<ScalarSidebarItemSlots>()

const { level } = useSidebarGroups()

defineOptions({ inheritAttrs: false })
</script>
<template>
  <li class="group/item contents">
    <ScalarSidebarButton
      v-bind="{ ...$attrs, ...$props }"
      :indent="indent ?? level">
      <!-- Pass through all the slots -->
      <template
        v-for="(_, name) in slots"
        #[name]>
        <slot :name="name" />
      </template>
    </ScalarSidebarButton>
  </li>
</template>
