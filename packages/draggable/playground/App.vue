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
  const parent = draggingItem.parentId
    ? sidebar.items[draggingItem.parentId]
    : null

  // Remove from old position
  if (parent?.children) {
    parent.children = parent.children.filter((id) => id !== draggingItem.id)
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
  <main class="scalar-app light-mode bg-b-1 text-c-1 min-h-screen font-sans">
    <div class="mx-auto max-w-5xl px-6 py-12 sm:px-10">
      <header class="mb-10 border-b pb-8">
        <p class="text-c-2 mb-3 text-sm font-medium">Scalar / Draggable</p>
        <h1 class="mb-3 text-xl font-bold tracking-tight">
          Make room for your teams.
        </h1>
        <p class="text-c-2 max-w-xl text-base leading-relaxed">
          Try reordering a nested list. Move teams between groups or give them a
          new place of their own.
        </p>
      </header>
      <div class="grid items-start gap-10 sm:grid-cols-2">
        <section
          aria-labelledby="teams-heading"
          class="overflow-hidden rounded-lg border">
          <div
            class="bg-b-2 flex items-center justify-between border-b px-4 py-3">
            <h2
              id="teams-heading"
              class="text-base font-medium">
              Your teams
            </h2>
            <span class="text-c-2 text-sm">
              {{ sidebar.children.length }} at the top level
            </span>
          </div>
          <div
            aria-label="Draggable teams"
            class="p-2"
            @dragenter.prevent
            @dragover.prevent>
            <SidebarItem
              v-for="id in sidebar.children"
              :id="id"
              :key="id"
              :items="sidebar.items"
              :parentIds="[]"
              @onDragEnd="onDragEnd" />
          </div>
        </section>
        <aside
          aria-labelledby="instructions-heading"
          class="py-2">
          <h2
            id="instructions-heading"
            class="mb-5 text-lg font-medium">
            Three ways to move
          </h2>
          <ol class="text-c-2 space-y-6 text-base leading-relaxed">
            <li>
              <h3 class="text-c-1 mb-1 font-medium">01 — Pick up a team</h3>
              Drag any team row to start moving it. A group brings its nested
              teams along.
            </li>
            <li>
              <h3 class="text-c-1 mb-1 font-medium">
                02 — Choose its position
              </h3>
              Hover near the top or bottom edge of another row to place it
              before or after that team.
            </li>
            <li>
              <h3 class="text-c-1 mb-1 font-medium">03 — Create a group</h3>
              Hover over the center of a row to nest your team inside it.
              Release to drop.
            </li>
          </ol>
          <p class="text-c-3 mt-8 border-t pt-4 text-sm">
            This playground uses mouse or trackpad dragging. Refresh to start
            over.
          </p>
        </aside>
      </div>
    </div>
  </main>
</template>
