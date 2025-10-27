<script lang="ts" setup>
import {
  ScalarSidebarFooter,
  ScalarSidebarSearchInput,
} from '@scalar/components'

import { createSidebarState, ScalarSidebar, type Item } from '@/index'

import { galaxySidebar } from './sidebar-data'

const reference = createSidebarState(galaxySidebar)
const client = createSidebarState([
  {
    type: 'document',
    id: 'root',
    title: 'Root',
    children: galaxySidebar,
  },
] satisfies Item[])

// Default open the first level of items for better visibility in the playground
client.items.value.forEach((it) => client.setExpanded(it.id, true))

const log = (name: string, ...args: any[]) => {
  console.log('[LOG] event name: ', name)
  console.log('[LOG]', ...args)
}
</script>
<template>
  <ScalarSidebar
    :isExpanded="reference.isExpanded"
    :isSelected="reference.isSelected"
    :items="reference.items.value"
    layout="reference">
    <template #search>
      <div class="bg-sidebar-b-1 sticky top-0 z-1 px-3 pt-3">
        <ScalarSidebarSearchInput />
      </div>
    </template>
    <template #footer>
      <ScalarSidebarFooter />
    </template>
  </ScalarSidebar>
  <ScalarSidebar
    :isExpanded="reference.isExpanded"
    :isSelected="reference.isSelected"
    :items="reference.items.value"
    layout="client"
    :state="client"
    @reorder="(...args) => log('reorder', ...args)">
    <template #search>
      <div class="bg-sidebar-b-1 sticky top-0 z-1 px-3 pt-3">
        <ScalarSidebarSearchInput />
      </div>
    </template>
    <template #footer>
      <ScalarSidebarFooter />
    </template>
  </ScalarSidebar>
</template>

<style>
body {
  background-color: var(--scalar-background-1);
}

#playground {
  min-height: 100vh;
  display: flex;
}
</style>
