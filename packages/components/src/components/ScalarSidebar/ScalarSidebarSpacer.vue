<script lang="ts">
/**
 * Scalar Sidebar Spacer component
 *
 * Provide a styled spacer for the ScalarSidebar, handles the indent lines for nested groups
 *
 *
 *
 * @example
 *   <ScalarSidebarSpacer />
 */
export default {}
</script>
<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'

import ScalarSidebarIndent from './ScalarSidebarIndent.vue'
import type { SidebarGroupLevel } from './useSidebarGroups'

const { indent = 0 } = defineProps<{ indent?: SidebarGroupLevel }>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <div v-bind="cx('flex px-2 h-1')">
    <ScalarSidebarIndent :indent="indent" />
  </div>
</template>
