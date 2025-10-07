<script lang="ts" setup>
import {
  ScalarSidebarGroup,
  ScalarSidebarItem,
  ScalarSidebarSection,
} from '@scalar/components'
import {
  Draggable,
  type DraggingItem,
  type HoveredItem,
} from '@scalar/draggable'
import { getHttpMethodInfo } from '@scalar/helpers/http/http-info'
import { ScalarIconWebhooksLogo } from '@scalar/icons'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import { computed } from 'vue'

import SidebarHttpBadge from './SidebarHttpBadge.vue'

const { item, layout, selectedItems, expandedItems } = defineProps<{
  item: TraversedEntry
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
  aside?(props: { item: TraversedEntry }): unknown
}>()

const hasChildren = (
  currentItem: TraversedEntry,
): currentItem is TraversedEntry & { children: TraversedEntry[] } => {
  return (
    'children' in currentItem &&
    Array.isArray(currentItem.children) &&
    currentItem.children.length > 0
  )
}

const isGroup = (
  currentItem: TraversedEntry,
): currentItem is TraversedEntry & { isGroup: true } => {
  return 'isGroup' in currentItem && currentItem.isGroup
}

/** Extract the path or title from a TraversedEntry */
const getPathOrTitle = (currentItem: TraversedEntry): string => {
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

const filterItems = (items: TraversedEntry[]) => {
  if (layout === 'reference') {
    return items
  }

  // For client layout, filter to only show webhooks and operations
  return items.filter(
    (c) =>
      c.type === 'webhook' || c.type === 'operation' || c.type === 'example',
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
      v-else-if="hasChildren(item)"
      v-model="groupModelValue"
      :active="selectedItems[item.id] ?? false">
      <div class="group/entry flex flex-1 items-center justify-center">
        <div class="flex-1 text-left">{{ item.title }}</div>
        <slot
          :item="item"
          name="aside" />
      </div>
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
        <p class="sidebar-heading-link-method">
          &hairsp;
          <span class="sr-only">HTTP Method:&nbsp;</span>
          <SidebarHttpBadge
            :active="selectedItems[item.id] ?? false"
            class="min-w-9.75 justify-end text-right"
            :method="item.method">
            <ScalarIconWebhooksLogo
              v-if="item.type === 'webhook'"
              :style="{
                color: getHttpMethodInfo(item.method).colorVar,
              }"
              weight="bold" />
          </SidebarHttpBadge>
        </p>
      </template>
    </ScalarSidebarItem>
  </Draggable>
</template>
