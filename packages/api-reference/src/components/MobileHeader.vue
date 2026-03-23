<script setup lang="ts">
import { cva, ScalarIconButton } from '@scalar/components'
import { ScalarIconList, ScalarIconX } from '@scalar/icons'

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

const variants = cva({
  base: 'lg:hidden items-center bg-b-1 sticky top-(--scalar-custom-header-height,0) z-10 [grid-area:header]',
  variants: {
    open: {
      true: 'h-(--refs-sidebar-height) custom-scrollbar flex flex-col',
    },
  },
})
</script>
<template>
  <!-- Always render the desktop sidebar slot and let CSS handle breakpoints -->
  <slot
    v-bind="{
      sidebarClasses:
        'hidden lg:flex sticky top-(--refs-header-height) h-(--refs-sidebar-height) w-(--refs-sidebar-width) [grid-area:navigation]',
    }"
    name="sidebar" />
  <div
    class="t-doc__header"
    :class="variants({ open: isSidebarOpen })">
    <header
      class="flex h-(--scalar-header-height) w-full items-center border-b bg-inherit px-2">
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
