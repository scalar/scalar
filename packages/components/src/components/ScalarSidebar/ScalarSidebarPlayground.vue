<script setup lang="ts">
import ScalarSidebar from './ScalarSidebar.vue'
import ScalarSidebarFooter from './ScalarSidebarFooter.vue'
import ScalarSidebarSearchInput from './ScalarSidebarSearchInput.vue'

const { indent = 20 } = defineProps<{
  indent: number
}>()

const selected = defineModel<string>('selected')
</script>
<template>
  <div class="flex h-screen">
    <ScalarSidebar
      class="t-doc__sidebar"
      :style="{
        '--scalar-sidebar-indent': indent + 'px',
        '--scalar-sidebar-indent-border-hover': 'var(--scalar-color-3)',
        '--scalar-sidebar-indent-border-active': 'var(--scalar-color-accent)',
      }">
      <div class="flex flex-col flex-1 min-h-0 custom-scroll overflow-x-clip">
        <slot name="search">
          <div class="px-3 pt-3 sticky z-1 top-0 bg-sidebar-b-1">
            <ScalarSidebarSearchInput />
          </div>
        </slot>
        <slot>
          <div class="flex-1 grid p-3">
            <div class="placeholder">Sidebar content</div>
          </div>
        </slot>
      </div>
      <slot name="footer">
        <ScalarSidebarFooter />
      </slot>
    </ScalarSidebar>
    <div class="flex items-center justify-center flex-1 text-c-2">
      <template v-if="selected"> {{ selected }} Selected </template>
      <template v-else> Select an item in the sidebar </template>
    </div>
  </div>
</template>
