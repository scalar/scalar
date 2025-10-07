<script lang="ts" setup>
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
client.items.forEach((it) => client.setExpanded(it.id, true))

const log = (name: string, ...args: any[]) => {
  console.log('[LOG] event name: ', name)
  console.log('[LOG]', ...args)
}
</script>
<template>
  <ScalarSidebar
    layout="reference"
    :state="reference" />
  <ScalarSidebar
    layout="client"
    :state="client"
    @reorder="(...args) => log('reorder', ...args)" />
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
