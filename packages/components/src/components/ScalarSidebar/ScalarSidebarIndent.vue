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
  /** Whether the indent hover is disabled @default false */
  disabled?: boolean
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
        'mr-[calc(20px-var(--scalar-sidebar-indent))]': indent > 0,
        'scalar-sidebar-indent-selected': selected,
      })
    ">
    <div
      v-for="(block, index) in indents"
      :key="block"
      class="relative w-[var(--scalar-sidebar-indent)]">
      <!-- Indent Border -->
      <div
        class="scalar-sidebar-indent-border absolute left-2 inset-y-0 w-border bg-sidebar-indent-border" />
      <!-- Indent Border Active or Hover -->
      <div
        v-if="index === indents.length - 1"
        class="absolute left-2 inset-y-0 w-border"
        :class="
          disabled
            ? ''
            : selected
              ? 'bg-sidebar-indent-border-active'
              : 'group-hover/button:bg-sidebar-indent-border-hover'
        " />
    </div>
  </div>
</template>
<style scoped>
@reference "../../style.css";

/* Add extra height to the indent border to account for the px spacing between the items */
.group\/item > * > .scalar-sidebar-indent .scalar-sidebar-indent-border {
  @apply -inset-y-px;
}

/* Push the border down for the first item in a group */
.group\/item:first-child
  > *
  > .scalar-sidebar-indent
  .scalar-sidebar-indent-border {
  @apply top-0;
}

/* Push the border up for the last item in a group */
.group\/item:last-child
  > *
  > .scalar-sidebar-indent
  .scalar-sidebar-indent-border {
  @apply bottom-0;
}
</style>
