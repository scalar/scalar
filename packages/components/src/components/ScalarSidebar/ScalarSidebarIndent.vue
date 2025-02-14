<script lang="ts">
/**
 * Scalar Sidebar Indent component
 *
 * @example
 *   <ScalarSidebarIndent :indent="1" />
 */
export default {}
</script>
<script setup lang="ts">
import type { SidebarGroupLevel } from './useSidebarGroups'
import { useBindCx } from '../../hooks/useBindCx'
import { computed } from 'vue'

const { indent = 0 } = defineProps<{
  selected?: boolean
  indent: SidebarGroupLevel
}>()

const indents = computed<number[]>(() => {
  return Array.from({ length: indent }, (_, i) => i)
})

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <div
    v-bind="
      cx('flex justify-center', {
        'mr-[calc(18px-var(--scalar-sidebar-indent))]': indent > 0,
      })
    ">
    <div
      v-for="block in indents"
      :key="block"
      class="flex w-[var(--scalar-sidebar-indent)] text-sidebar-indent-border"
      :class="
        selected
          ? 'last:text-sidebar-indent-active'
          : 'group-hover/item:last:text-sidebar-indent-hover'
      ">
      <div class="ml-1.75 w-border bg-current shrink-0" />
    </div>
  </div>
</template>
