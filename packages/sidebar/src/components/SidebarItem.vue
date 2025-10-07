<script lang="ts" setup>
import {
  ScalarSidebarGroup,
  ScalarSidebarGroupToggle,
  ScalarSidebarItem,
  ScalarSidebarSection,
} from '@scalar/components'
import {
  Draggable,
  type DraggingItem,
  type HoveredItem,
} from '@scalar/draggable'
import { ScalarIconFolder } from '@scalar/icons'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import { computed } from 'vue'

import SidebarHttpBadge from './SidebarHttpBadge.vue'

export type Item =
  | TraversedEntry
  | { id: string; title: string; children: TraversedEntry[]; type: 'document' }

const { item, layout, selectedItems, expandedItems } = defineProps<{
  item: Item
  layout: 'client' | 'reference'
  selectedItems: Record<string, boolean>
  expandedItems: Record<string, boolean>
  options?: {
    operationTitleSource: 'path' | 'summary' | undefined
  }
}>()

const emits = defineEmits<{
  (e: 'click', id: string): void
  (e: 'onDragEnd', draggingItem: DraggingItem, hoveredItem: HoveredItem): void
}>()

defineSlots<{
  aside?(props: { item: Item }): unknown
}>()

const hasChildren = (
  currentItem: Item,
): currentItem is Item & { children: TraversedEntry[] } => {
  return (
    'children' in currentItem &&
    Array.isArray(currentItem.children) &&
    currentItem.children.length > 0
  )
}

const isGroup = (
  currentItem: Item,
): currentItem is Item & { isGroup: true } => {
  return 'isGroup' in currentItem && currentItem.isGroup
}

/** Extract the path or title from a TraversedEntry */
const getPathOrTitle = (currentItem: Item): string => {
  if ('path' in currentItem) {
    // Insert zero-width space after every slash, to give line-break opportunity.
    return currentItem.path.replace(/\//g, '/\u200B')
  }
  return currentItem.title
}

const groupModelValue = computed({
  get: () => expandedItems[item.id] ?? false,
  set: () => emits('click', item.id),
})

const filterItems = (items: Item[]) => {
  if (layout === 'reference') {
    return items
  }

  // For client layout, filter to only show webhooks and operations
  return items.filter(
    (c) =>
      c.type === 'webhook' ||
      c.type === 'operation' ||
      c.type === 'example' ||
      c.type === 'tag',
  )
}

/**
 * Handle drag end event and bubble it up to parent.
 */
const handleDragEnd = (
  draggingItem: DraggingItem,
  hoveredItem: HoveredItem,
) => {
  emits('onDragEnd', draggingItem, hoveredItem)
}
</script>
<template>
  <Draggable
    :id="item.id"
    class="grid flex-1"
    :isDraggable="layout === 'client'"
    :parentIds="[]"
    @onDragEnd="handleDragEnd">
    <ScalarSidebarSection v-if="hasChildren(item) && isGroup(item)">
      {{ item.title }}
      <template #items>
        <SidebarItem
          v-for="child in filterItems(item.children)"
          :key="child.id"
          :expandedItems="expandedItems"
          :item="child"
          :layout="layout"
          :options="options"
          :selectedItems="selectedItems"
          @click="(id) => emits('click', id)"
          @onDragEnd="handleDragEnd">
          <template #aside="slotProps">
            <slot
              v-bind="slotProps"
              name="aside" />
          </template>
        </SidebarItem>
      </template>
    </ScalarSidebarSection>
    <ScalarSidebarGroup
      v-else-if="
        hasChildren(item) &&
        ((layout === 'reference' &&
          !(item.type === 'operation' || item.type === 'webhook')) ||
          layout === 'client')
      "
      v-model="groupModelValue"
      :active="selectedItems[item.id] ?? false">
      <div class="group/entry flex flex-1 items-center justify-center">
        <div class="flex-1 text-left">{{ item.title }}</div>
        <slot
          :item="item"
          name="aside" />
      </div>
      <SidebarHttpBadge
        v-if="'method' in item"
        :active="selectedItems[item.id] ?? false"
        class="min-w-9.75 justify-end text-right"
        :method="item.method"
        :webhook="item.type === 'webhook'" />
      <template
        v-if="item.type === 'document'"
        #icon="{ open }">
        <ScalarIconFolder
          class="text-c-3 block group-hover/group-button:hidden" />
        <ScalarSidebarGroupToggle
          class="text-c-3 hidden group-hover/group-button:block"
          :open="open" />
      </template>
      <template #items>
        <SidebarItem
          v-for="child in filterItems(item.children)"
          :key="child.id"
          :expandedItems="expandedItems"
          :item="child"
          :layout="layout"
          :options="options"
          :parentIds="[]"
          :selectedItems="selectedItems"
          @click="(id) => emits('click', id)"
          @onDragEnd="handleDragEnd">
          <template #aside="slotProps">
            <slot
              v-bind="slotProps"
              name="aside" />
          </template>
        </SidebarItem>
      </template>
    </ScalarSidebarGroup>
    <ScalarSidebarItem
      is="button"
      v-else
      class="text-left"
      :selected="selectedItems[item.id] ?? false"
      @click="() => emits('click', item.id)">
      <div class="group/entry flex flex-1 items-center justify-center">
        <div class="flex-1">
          <template v-if="options?.operationTitleSource === 'path'">
            {{ getPathOrTitle(item) }}
          </template>
          <template v-else>
            {{ item.title }}
          </template>
        </div>
        <slot
          :item="item"
          name="aside" />
      </div>
      <template
        v-if="'method' in item"
        #aside>
        <SidebarHttpBadge
          :active="selectedItems[item.id] ?? false"
          class="min-w-9.75 justify-end text-right"
          :method="item.method"
          :webhook="item.type === 'webhook'" />
      </template>
    </ScalarSidebarItem>
  </Draggable>
</template>
