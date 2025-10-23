<script setup lang="ts">
import { cva, ScalarIconButton } from '@scalar/components'
import { ScalarIconList, ScalarIconX } from '@scalar/icons'
import { useBreakpoints } from '@scalar/use-hooks/useBreakpoints'

defineProps<{
  breadcrumb: string
  isSidebarOpen: boolean
  showSidebar: boolean
}>()

const emit = defineEmits<{
  (e: 'toggleSidebar'): void
}>()

defineSlots<{
  actions?(): never
  sidebar?(props: { sidebarClasses: string }): never
  search?(): never
}>()

const { mediaQueries } = useBreakpoints()

const variants = cva({
  base: 'items-center bg-b-1 sticky top-0 z-1000',
  variants: {
    open: {
      true: 'max-h-dvh h-dvh custom-scrollbar flex flex-col',
    },
    lg: {
      true: 'hidden [grid-area:header]',
    },
  },
})
</script>
<template>
  <!-- In desktop layout, just render the default slot for the sidebar -->
  <slot
    v-if="mediaQueries.lg.value"
    v-bind="{ sidebarClasses: 'sticky top-0 h-dvh [grid-area:navigation]' }"
    name="sidebar" />
  <div
    v-else
    class="t-doc__header"
    :class="variants({ open: isSidebarOpen, lg: mediaQueries.lg.value })">
    <header
      class="flex h-[var(--scalar-header-height)] w-full items-center border-b bg-inherit px-2">
      <ScalarIconButton
        v-if="showSidebar"
        :icon="isSidebarOpen ? ScalarIconX : ScalarIconList"
        :label="isSidebarOpen ? 'Close Menu' : 'Open Menu'"
        size="md"
        @click="emit('toggleSidebar')" />

      <span
        v-if="showSidebar"
        class="flex-1 text-sm font-medium whitespace-nowrap">
        {{ breadcrumb }}
      </span>
      <slot
        v-else
        name="search" />

      <div class="flex h-6 items-center gap-1 pl-1">
        <slot name="actions" />
      </div>
    </header>
    <!-- In mobile layout, render the sidebar slot into the header panel -->
    <slot
      v-if="isSidebarOpen"
      v-bind="{
        sidebarClasses:
          'overflow-y-auto custom-scrollbar min-h-0 flex-1 w-full border-none',
      }"
      name="sidebar" />
  </div>
</template>
