<script lang="ts">
/**
 * Scalar Sidebar component
 *
 * A sidebar for navigation and other content.
 *
 * @example
 *   <ScalarSidebar>
 *     <!-- Sidebar content -->
 *   </ScalarSidebar>
 */
export default {}
</script>
<script lang="ts" setup>
import { useBindCx } from '@scalar/use-hooks/useBindCx'

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <aside
    v-bind="
      cx('flex flex-col border-r bg-sidebar-b-1 border-sidebar-border w-72')
    ">
    <slot />
  </aside>
</template>
