<script setup lang="ts">
import { Draggable } from '../../src'
import type { DraggingItem, HoveredItem } from '../../src/store'

export type Items = Record<
  string,
  { id: string; name: string; children: string[] }
>

defineProps<{ items: Items; id: string; parentIds: string[] }>()
defineEmits<{
  onDragEnd: [draggingItem: DraggingItem, hoveredItem: HoveredItem]
}>()
</script>

<template>
  <Draggable
    :id="id"
    :ceiling="0.8"
    :floor="0.2"
    :parentIds="parentIds"
    @onDragEnd="(...args) => $emit('onDragEnd', ...args)">
    <div>
      <div
        class="sidebar-item"
        :style="{ 'padding-left': parentIds.length * 8 + 'px' }">
        {{ items[id].name }}
      </div>
      <SidebarItem
        v-for="childId in items[id].children"
        :id="childId"
        :key="childId"
        :items="items"
        :parentIds="[...parentIds, id]"
        @onDragEnd="(...args) => $emit('onDragEnd', ...args)" />
    </div>
  </Draggable>
</template>

<style scoped>
.sidebar-item {
  padding: 8px;
  cursor: move;
}
</style>
