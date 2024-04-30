<script setup lang="ts">
import { ref } from 'vue'

import SidebarItem, { type Items } from './components/SidebarItem.vue'

const sidebar = ref({
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
  } satisfies Items,
  // Root level children (the top level of the sidebar)
  children: ['1', '8', '9', '10', '11', '12'],
})
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
      :parentIds="[]" />
  </ul>
</template>

<style>
:root {
  --scalar-color-blue: #0000ff;
}
</style>
