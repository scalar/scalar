<script setup lang="ts">
import { reactive } from 'vue'

import type { DraggingItem, HoveredItem } from '../src/store'
import SidebarItem, { type Items } from './components/SidebarItem.vue'

const sidebar = reactive({
  // Master list of all items
  items: {
    '1': {
      id: '1',
      name: 'Rangers',
      children: ['2', '4', '5', '6', '7'],
    },
    '2': {
      id: '2',
      name: 'Stars',
      children: ['3'],
    },
    '3': { id: '3', name: 'Bruins', children: [] },
    '4': { id: '4', name: 'Canucks', children: [] },
    '5': { id: '5', name: 'Panthers', children: [] },
    '6': { id: '6', name: 'Avalanche', children: [] },
    '7': { id: '7', name: 'Hurricanes', children: [] },
    '8': { id: '8', name: 'Jets', children: [] },
    '9': { id: '9', name: 'Oilers', children: [] },
    '10': { id: '10', name: 'Predators', children: [] },
    '11': { id: '11', name: 'Maple Leafs', children: [] },
    '12': { id: '12', name: 'Kings', children: [] },
  } as Items,
  // Root level children (the top level of the sidebar)
  children: ['1', '8', '9', '10', '11', '12'],
})

const onDragEnd = (draggingItem: DraggingItem, hoveredItem: HoveredItem) => {
  // Remove from old position
  if (draggingItem.parentId && sidebar.items[draggingItem.parentId]?.children) {
    sidebar.items[draggingItem.parentId].children = sidebar.items[
      draggingItem.parentId
    ]?.children?.filter((id) => id !== draggingItem.id)
  } else {
    sidebar.children = sidebar.children.filter((id) => id !== draggingItem.id)
  }

  // Add as a child
  if (hoveredItem.offset === 2) {
    sidebar.items[hoveredItem.id]?.children?.push(draggingItem.id)
  }
  // Add to an items children
  else if (hoveredItem.parentId) {
    const hoveredIndex =
      sidebar.items[hoveredItem.parentId]?.children?.findIndex(
        (id) => hoveredItem.id === id,
      ) ?? 0

    sidebar.items[hoveredItem.parentId]?.children?.splice(
      hoveredIndex + hoveredItem.offset,
      0,
      draggingItem.id,
    )
  }
  // Add to root children
  else {
    const hoveredIndex =
      sidebar.children?.findIndex((id) => hoveredItem.id === id) ?? 0
    sidebar.children?.splice(
      hoveredIndex + hoveredItem.offset,
      0,
      draggingItem.id,
    )
  }
}
</script>

<template>
  <div>This is an example of Draggable</div>
  <ul
    @dragenter.prevent
    @dragover.prevent>
    <SidebarItem
      v-for="id in sidebar.children"
      :id="id"
      :key="id"
      :items="sidebar.items"
      :parentIds="[]"
      @onDragEnd="onDragEnd" />
  </ul>
  <div>#TODO make this pretty :)</div>
</template>

<style>
:root {
  --scalar-color-blue: #0000ff;
}
</style>
