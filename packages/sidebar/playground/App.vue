<script lang="ts" setup>
import {
  ScalarIconButton,
  ScalarSidebarFooter,
  ScalarSidebarItem,
  ScalarSidebarSearchInput,
} from '@scalar/components'
import { ScalarIconDotsThree, ScalarIconPlus } from '@scalar/icons'

import { createSidebarState, ScalarSidebar, type Item } from '@/index'

import { galaxySidebar } from './sidebar-data'

const reference = createSidebarState(galaxySidebar)
const client = createSidebarState([
  {
    type: 'document',
    name: 'root',
    id: 'root',
    title: 'Root',
    children: galaxySidebar,
  },
  {
    type: 'document',
    name: 'empty',
    id: 'empty',
    title: 'Empty Document',
    children: [],
  },
  {
    type: 'document',
    name: 'empty-2',
    id: 'empty-2',
    title: 'Empty Document 2',
    children: [
      {
        type: 'tag',
        name: 'tag-1',
        id: 'tag-1',
        title: 'Tag 1',
        isGroup: false,
      },
    ],
  },
] satisfies Item[])

// Default open the first level of items for better visibility in the playground
client.items.value.forEach((it) => client.setExpanded(it.id, true))

function handleSelectItem(
  sidebar: typeof reference | typeof client,
  id: string,
) {
  sidebar.setExpanded(id, !sidebar.isExpanded(id))
  sidebar.setSelected(id)
}

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
    layout="reference"
    @selectItem="(id) => handleSelectItem(reference, id)">
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
    :isExpanded="client.isExpanded"
    :isSelected="client.isSelected"
    :items="client.items.value"
    layout="client"
    @reorder="(...args) => log('reorder', ...args)"
    @selectItem="(id) => handleSelectItem(client, id)">
    <template #search>
      <div class="bg-sidebar-b-1 sticky top-0 z-1 px-3 pt-3">
        <ScalarSidebarSearchInput />
      </div>
    </template>

    <!-- Decorator slot -->
    <template #decorator>
      <ScalarIconButton
        :icon="ScalarIconDotsThree"
        label="More options"
        size="sm"
        weight="bold" />
    </template>

    <!-- Empty folder slot -->
    <template #empty>
      <ScalarSidebarItem>
        <template #icon>
          <ScalarIconPlus />
        </template>
        <template #default>Add operation</template>
      </ScalarSidebarItem>
    </template>

    <!-- Sidebar footer slot -->
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
