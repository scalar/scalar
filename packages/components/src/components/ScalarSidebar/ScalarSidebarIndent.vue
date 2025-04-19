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
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import { computed } from 'vue'

import type { SidebarGroupLevel } from './useSidebarGroups'

const { indent = 0, selected = false } = defineProps<{
  /** The number of indents to render @default 0 */
  indent?: SidebarGroupLevel
  /** Whether the indent is selected @default false */
  selected?: boolean
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
      cx('scalar-sidebar-indent flex justify-center', {
        'mr-[calc(18px-var(--scalar-sidebar-indent))]': indent > 0,
        'scalar-sidebar-indent-selected': selected,
      })
    ">
    <div
      v-for="(block, index) in indents"
      :key="block"
      class="relative w-[var(--scalar-sidebar-indent)]">
      <!-- Indent Border -->
      <div
        class="scalar-sidebar-indent-border absolute left-1.75 inset-y-0 w-border bg-sidebar-indent-border" />
      <!-- Indent Border Active or Hover -->
      <div
        v-if="index === indents.length - 1"
        class="absolute left-1.75 inset-y-0 w-border"
        :class="
          selected
            ? 'bg-sidebar-indent-active'
            : 'group-hover/button:bg-sidebar-indent-hover'
        " />
    </div>
  </div>
</template>
<style scoped lang="postcss">
.group\/item
  > .group\/button
  > .scalar-sidebar-indent
  .scalar-sidebar-indent-border {
  @apply -inset-y-px;
}
.group\/item:first-child
  > .group\/button
  > .scalar-sidebar-indent
  .scalar-sidebar-indent-border {
  @apply top-0;
}
.group\/item:last-child
  > .group\/button
  > .scalar-sidebar-indent
  .scalar-sidebar-indent-border {
  @apply bottom-0;
}
</style>
