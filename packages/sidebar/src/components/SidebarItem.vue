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

import { formatSidebarLabel } from '@/helpers/format-sidebar-label'
import type { Item } from '@/types'

import SidebarHttpBadge from './SidebarHttpBadge.vue'

const { item, layout, isSelected, isExpanded } = defineProps<{
  item: Item
  layout: 'client' | 'reference'
  isSelected: (id: string) => boolean
  isExpanded: (id: string) => boolean
  options:
    | {
        operationTitleSource: 'path' | 'summary' | undefined
      }
    | undefined
}>()

const emits = defineEmits<{
  (e: 'selectItem', id: string): void
  (e: 'onDragEnd', draggingItem: DraggingItem, hoveredItem: HoveredItem): void
}>()

defineSlots<{
  decorator?(props: { item: Item }): unknown
}>()

const hasChildren = (
  currentItem: Item,
): currentItem is Item & { children: Item[] } => {
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
    class="flex flex-1 flex-col"
    :isDraggable="layout === 'client'"
    :parentIds="[]"
    @onDragEnd="handleDragEnd">
    <ScalarSidebarSection v-if="hasChildren(item) && isGroup(item)">
      {{ item.title }}
      <template #items>
        <SidebarItem
          v-for="child in filterItems(item.children)"
          :key="child.id"
          :isExpanded="isExpanded"
          :isSelected="isSelected"
          :item="child"
          :layout="layout"
          :options="options"
          @onDragEnd="handleDragEnd"
          @selectItem="(id) => emits('selectItem', id)">
          <template #decorator="slotProps">
            <slot
              v-bind="slotProps"
              name="decorator" />
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
      :active="isSelected(item.id)"
      controlled
      :open="isExpanded(item.id)"
      @click="() => emits('selectItem', item.id)">
      <template
        v-if="item.type === 'document'"
        #icon="{ open }">
        <ScalarIconFolder
          class="text-c-3 block group-hover/group-button:hidden" />
        <ScalarSidebarGroupToggle
          class="text-c-3 hidden group-hover/group-button:block"
          :open="open" />
      </template>
      {{ item.title }}
      <template
        v-if="'method' in item || $slots.decorator"
        #aside>
        <slot
          v-if="$slots.decorator"
          :item="item"
          name="decorator" />
        <SidebarHttpBadge
          v-if="'method' in item"
          :active="isSelected(item.id)"
          class="ml-2 h-4 self-start"
          :method="item.method"
          :webhook="item.type === 'webhook'" />
      </template>
      <template #items>
        <SidebarItem
          v-for="child in filterItems(item.children)"
          :key="child.id"
          :isExpanded="isExpanded"
          :isSelected="isSelected"
          :item="child"
          :layout="layout"
          :options="options"
          :parentIds="[]"
          @onDragEnd="handleDragEnd"
          @selectItem="(id) => emits('selectItem', id)">
          <template #decorator="slotProps">
            <slot
              v-bind="slotProps"
              name="decorator" />
          </template>
        </SidebarItem>
      </template>
    </ScalarSidebarGroup>
    <ScalarSidebarItem
      is="button"
      v-else
      class="text-left"
      :selected="isSelected(item.id)"
      @click="() => emits('selectItem', item.id)">
      <template v-if="item.type === 'model'">
        {{
          formatSidebarLabel(item.title, { wrapCharacters: /[\/\-\_A-Z\.]/g })
        }}
      </template>
      <template v-else>
        {{
          options?.operationTitleSource === 'path' && 'path' in item
            ? formatSidebarLabel(item.path)
            : formatSidebarLabel(item.title)
        }}
      </template>
      <template
        v-if="'method' in item || $slots.decorator"
        #aside>
        <slot
          v-if="$slots.decorator"
          :item="item"
          name="decorator" />
        <SidebarHttpBadge
          v-if="'method' in item"
          :active="isSelected(item.id)"
          class="ml-2 h-4 self-start"
          :method="item.method"
          :webhook="item.type === 'webhook'" />
      </template>
    </ScalarSidebarItem>
  </Draggable>
</template>
