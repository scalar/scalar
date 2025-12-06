<script lang="ts" setup>
import {
  ScalarSidebarGroup,
  ScalarSidebarGroupToggle,
  ScalarSidebarItem,
  ScalarSidebarSection,
  ScalarWrappingText,
} from '@scalar/components'
import { LibraryIcon } from '@scalar/icons/library'

import SidebarItemDecorator from '@/components/SidebarItemDecorator.vue'
import {
  useDraggable,
  type DraggingItem,
  type HoveredItem,
  type UseDraggableOptions,
} from '@/hooks/use-draggable'
import type { Item } from '@/types'

import SidebarHttpBadge from './SidebarHttpBadge.vue'

const { item, layout, isSelected, isExpanded, isDraggable, isDroppable } =
  defineProps<{
    /**
     * The sidebar item to render.
     */
    item: Item
    /**
     * The layout mode for the sidebar ('client' or 'reference').
     */
    layout: 'client' | 'reference'
    /**
     * Function to determine if an item is currently selected by id.
     */
    isSelected: (id: string) => boolean
    /**
     * Function to determine if an item is currently expanded (showing its children) by id.
     */
    isExpanded: (id: string) => boolean
    /**
     * Sidebar configuration options.
     * - operationTitleSource: sets whether operations show their path or summary as the display title.
     */
    options:
      | {
          operationTitleSource: 'path' | 'summary' | undefined
        }
      | undefined

    /**
     * Prevents this item from being dragged.
     *
     * @default true
     */
    isDraggable?: UseDraggableOptions['isDraggable']
    /**
     * Prevents this item from being hovered and dropped into. Can be either a function or a boolean.
     *
     * @default true
     */
    isDroppable?: UseDraggableOptions['isDroppable']
  }>()

const emit = defineEmits<{
  /**
   * Emitted when the item is selected
   * @param id - The id of the selected item
   */
  (e: 'selectItem', id: string): void
  /**
   * Emitted when a drag operation ends for this item
   * @param draggingItem - The item being dragged
   * @param hoveredItem - The item currently being hovered over
   */
  (e: 'onDragEnd', draggingItem: DraggingItem, hoveredItem: HoveredItem): void
}>()

const slots = defineSlots<{
  /**
   * Adds an optional decorator for each item, such as an edit menu.
   * The slot receives an object with the current item.
   */
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

  // For client layout, filter to only show and operations, examples, and tags
  return items.filter(
    (c) => c.type === 'operation' || c.type === 'example' || c.type === 'tag',
  )
}

/**
 * Handle drag end event and bubble it up to parent.
 */
const onDragEnd = (draggingItem: DraggingItem, hoveredItem: HoveredItem) => {
  emit('onDragEnd', draggingItem, hoveredItem)
}
const { draggableAttrs, draggableEvents } = useDraggable({
  id: item.id,
  isDraggable,
  isDroppable,
  onDragEnd,
})
</script>
<template>
  <ScalarSidebarSection
    v-if="hasChildren(item) && isGroup(item)"
    v-bind="draggableAttrs"
    v-on="draggableEvents">
    {{ item.title }}
    <template #items>
      <SidebarItem
        v-for="child in filterItems(item.children)"
        :key="child.id"
        :isDraggable="isDraggable"
        :isDroppable="isDroppable"
        :isExpanded="isExpanded"
        :isSelected="isSelected"
        :item="child"
        :layout="layout"
        :options="options"
        @onDragEnd="onDragEnd"
        @selectItem="(id) => emit('selectItem', id)">
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
    class="relative"
    :open="isExpanded(item.id)"
    v-bind="draggableAttrs"
    v-on="draggableEvents"
    @click="() => emit('selectItem', item.id)">
    <template
      v-if="item.type === 'document'"
      #icon="{ open }">
      <LibraryIcon
        class="text-c-3 block group-hover/group-button:hidden"
        :src="item.icon ?? 'interface-content-folder'" />
      <ScalarSidebarGroupToggle
        class="text-c-3 hidden group-hover/group-button:block"
        :open="open" />
    </template>
    {{ item.title }}
    <template
      v-if="'method' in item"
      #aside>
      <SidebarHttpBadge
        v-if="'method' in item"
        :active="isSelected(item.id)"
        class="ml-2 h-4 self-start"
        :method="item.method"
        :webhook="item.type === 'webhook'" />
    </template>
    <template
      v-if="slots.decorator"
      #after>
      <SidebarItemDecorator>
        <slot
          :item
          name="decorator" />
      </SidebarItemDecorator>
    </template>
    <template #items>
      <SidebarItem
        v-for="child in filterItems(item.children)"
        :key="child.id"
        :isDraggable="isDraggable"
        :isDroppable="isDroppable"
        :isExpanded="isExpanded"
        :isSelected="isSelected"
        :item="child"
        :layout="layout"
        :options="options"
        :parentIds="[]"
        @onDragEnd="onDragEnd"
        @selectItem="(id) => emit('selectItem', id)">
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
    v-bind="draggableAttrs"
    class="relative"
    :selected="isSelected(item.id)"
    v-on="draggableEvents"
    @click="() => emit('selectItem', item.id)">
    <template v-if="item.type === 'model'">
      <ScalarWrappingText
        preset="property"
        :text="item.title" />
    </template>
    <template v-else>
      <ScalarWrappingText
        :text="
          options?.operationTitleSource === 'path' && 'path' in item
            ? item.path
            : item.title
        " />
    </template>
    <template
      v-if="'method' in item"
      #aside>
      <SidebarHttpBadge
        v-if="'method' in item"
        :active="isSelected(item.id)"
        class="ml-2 h-4 self-start"
        :method="item.method"
        :webhook="item.type === 'webhook'" />
    </template>
    <template
      v-if="slots.decorator"
      #after>
      <SidebarItemDecorator>
        <slot
          :item
          name="decorator" />
      </SidebarItemDecorator>
    </template>
  </ScalarSidebarItem>
</template>
