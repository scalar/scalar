<script lang="ts">
/**
 * Scalar Sidebar Item component
 *
 * Provides a ScalarSidebarButton wrapped in an `<li>` to
 * meet accessibility requirements
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

defineProps<ScalarSidebarItemProps>()
defineSlots<ScalarSidebarItemSlots>()

defineOptions({ inheritAttrs: false })
</script>
<template>
  <li class="contents">
    <ScalarSidebarButton v-bind="{ ...$attrs, ...$props }">
      <!-- Pass through all the slots -->
      <template
        v-for="(_, name) in $slots"
        #[name]>
        <slot :name="name" />
      </template>
    </ScalarSidebarButton>
  </li>
</template>
