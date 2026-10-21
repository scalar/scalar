<script lang="ts">
/**
 * Skeleton loading UI for the sidebar. Renders animated pulse bars inside
 * `ScalarSidebarItem` rows so spacing and hierarchy match real navigation while content loads.
 *
 * @example
 * ```vue
 * <ScalarSidebarLoading :items="6" />
 * ```
 */
export default {}
</script>
<script lang="ts" setup>
import ScalarSidebarItem from '@/components/ScalarSidebar/ScalarSidebarItem.vue'

const { items = 4 } = defineProps<{
  /** The number of items to display */
  items?: number
}>()
</script>
<template>
  <ScalarSidebarItem
    v-for="idx in items"
    :key="idx"
    class="pointer-events-none">
    <div
      class="group/button-loading bg-sidebar-c-2/15 -my-px box-content h-lh w-full animate-pulse rounded-lg py-px" />
  </ScalarSidebarItem>
</template>
<style>
@reference "../../style.css";

.group\/item:last-of-type
  > .group\/button
  > .group\/button-label
  > .group\/button-loading {
  @apply w-2/3;
}
</style>
