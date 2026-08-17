<script lang="ts" setup>
import {
  ScalarSidebarGroup,
  ScalarSidebarGroupToggle,
  ScalarSidebarItem,
  ScalarSidebarSection,
} from '@scalar/components/sidebar'
import { isPlainLeftClick } from '@scalar/helpers/dom/is-plain-left-click'
import { LibraryIcon } from '@scalar/icons/library'
import { computed } from 'vue'

import SidebarItemDecorator from '@/components/SidebarItemDecorator.vue'
import { filterItems } from '@/helpers/filter-items'
import { hasChildren } from '@/helpers/has-children'
import { isSidebarFolder } from '@/helpers/is-sidebar-folder'
import {
  useDraggable,
  type DraggingItem,
  type HoveredItem,
  type UseDraggableOptions,
} from '@/hooks/use-draggable'
import type { Item, Layout, SidebarOptions } from '@/types'

import SidebarHttpBadge from './SidebarHttpBadge.vue'
import SidebarItemLabel from './SidebarItemLabel.vue'

const {
  item,
  layout,
  isSelected,
  isExpanded,
  isDraggable,
  isDroppable,
  options,
  getHref,
} = defineProps<{
  /**
   * The sidebar item to render.
   */
  item: Item
  /**
   * The layout mode for the sidebar ('client' or 'reference').
   */
  layout: Layout
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
  options?: SidebarOptions

  /**
   * Returns the URL for a sidebar item.
   *
   * When provided (and it returns a value) items render as anchor tags
   * instead of buttons, so search engines can crawl the navigation.
   */
  getHref?: (item: Item) => string | undefined

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

  /**
   * Emitted when the group is toggled
   * @param id - The id of the group
   */
  (e: 'toggleGroup', id: string): void
}>()

const slots = defineSlots<{
  /**
   * Adds an optional decorator for each item, such as an edit menu.
   * The slot receives an object with the current item.
   */
  decorator?(props: { item: Item }): unknown
  /**
   * Adds an optional empty state for an item.
   * The slot receives an object with the current item.
   */
  empty?(props: { item: Item }): unknown
  /**
   * Adds an optional icon for each item.
   * The slot receives an object with the current item and the open state.
   */
  icon?(props: { item: Item; open: boolean }): unknown
}>()

const isGroup = (
  currentItem: Item,
): currentItem is Item & { isGroup: true } => {
  return 'isGroup' in currentItem && currentItem.isGroup
}

const isDeprecated = (
  currentItem: Item,
): currentItem is Item & { isDeprecated: true } => {
  return ('isDeprecated' in currentItem && currentItem.isDeprecated) ?? false
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

const children = computed(() =>
  hasChildren(item)
    ? filterItems(layout, item.children, options?.hideOperationDefaultExamples)
    : [],
)

/** The URL for this item, when the consumer provides one it renders as a link */
const href = computed(() => getHref?.(item) || undefined)

/**
 * Emit the select event for a click on the item label.
 *
 * When the item renders as a link we only hijack plain left clicks on the
 * link itself for in-app navigation. Modified clicks (meta, ctrl, shift,
 * alt) and middle clicks keep the browser's default behavior so the link
 * can be opened in a new tab or window, and clicks on surrounding content
 * (like the decorator menu) keep their native behavior.
 */
const handleSelect = (event: MouseEvent) => {
  if (href.value) {
    const anchor =
      event.target instanceof Element ? event.target.closest('a') : null
    if (anchor?.getAttribute('href') !== href.value) {
      return
    }
    if (!isPlainLeftClick(event)) {
      return
    }
    event.preventDefault()
  }
  emit('selectItem', item.id)
}
</script>
<template>
  <!-- Sidebar section -->
  <ScalarSidebarSection
    v-if="children.length > 0 && isGroup(item)"
    :data-sidebar-id="item.id"
    v-bind="draggableAttrs"
    v-on="draggableEvents">
    {{ item.title }}
    <template #items>
      <SidebarItem
        v-for="child in children"
        :key="child.id"
        :getHref="getHref"
        :isDraggable="isDraggable"
        :isDroppable="isDroppable"
        :isExpanded="isExpanded"
        :isSelected="isSelected"
        :item="child"
        :layout="layout"
        :options="options"
        @onDragEnd="onDragEnd"
        @selectItem="(id) => emit('selectItem', id)"
        @toggleGroup="(id) => emit('toggleGroup', id)">
        <template
          v-if="slots.decorator"
          #decorator="slotProps">
          <slot
            v-bind="slotProps"
            name="decorator" />
        </template>
        <template
          v-if="slots.empty"
          #empty="slotProps">
          <slot
            v-bind="slotProps"
            name="empty" />
        </template>
        <template
          v-if="slots.icon"
          #icon="slotProps">
          <slot
            v-bind="slotProps"
            name="icon" />
        </template>
      </SidebarItem>
    </template>
  </ScalarSidebarSection>

  <!-- Sidebar group (folder) -->
  <ScalarSidebarGroup
    v-else-if="
      isSidebarFolder(
        layout,
        item,
        slots.empty !== undefined,
        options?.hideOperationDefaultExamples ?? false,
      )
    "
    :active="isSelected(item.id)"
    class="relative"
    controlled
    :data-sidebar-id="item.id"
    v-bind="draggableAttrs"
    :discrete="layout === 'reference' && item.type === 'text'"
    :href="href"
    :open="isExpanded(item.id)"
    v-on="draggableEvents"
    @click="handleSelect"
    @toggle="() => emit('toggleGroup', item.id)">
    <template
      v-if="item.type === 'document'"
      #icon="{ open }">
      <slot
        :item="item"
        name="icon"
        :open="open">
        <LibraryIcon
          class="block"
          :src="('icon' in item && item.icon) || 'interface-content-folder'" />
      </slot>
    </template>
    <span
      v-if="isDeprecated(item)"
      class="line-through">
      <SidebarItemLabel
        :item
        :operationTitleSource="options?.operationTitleSource" />
    </span>
    <SidebarItemLabel
      v-else
      :item
      :operationTitleSource="options?.operationTitleSource" />
    <template
      v-if="'method' in item"
      #aside>
      <SidebarHttpBadge
        :active="isSelected(item.id)"
        class="ml-2 h-4 self-start"
        :class="{
          // Hide the badge when we're showing the decorator
          'group-hover/button:opacity-0 group-focus-visible/button:opacity-0 group-has-[~*_[aria-expanded=true]]/button:opacity-0 group-has-[~*:focus-within]/button:opacity-0 group-has-[~*:hover]/button:opacity-0':
            slots.decorator,
        }"
        :label="options?.labels?.httpMethod"
        :method="item.method"
        :webhook="item.type === 'webhook'" />
    </template>
    <!--
      Hide the chevron
    -->
    <template
      v-if="'method' in item"
      #toggle>
      <span class="hidden"></span>
    </template>
    <template
      v-else
      #toggle="{ open }">
      <ScalarSidebarGroupToggle
        class="text-sidebar-c-2"
        :open>
        <template #label>
          {{
            open
              ? (options?.labels?.closeGroup ?? 'Close Group')
              : (options?.labels?.openGroup ?? 'Open Group')
          }}
        </template>
      </ScalarSidebarGroupToggle>
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
        v-for="child in children"
        :key="child.id"
        :getHref="getHref"
        :isDraggable="isDraggable"
        :isDroppable="isDroppable"
        :isExpanded="isExpanded"
        :isSelected="isSelected"
        :item="child"
        :layout="layout"
        :options="options"
        :parentIds="[]"
        @onDragEnd="onDragEnd"
        @selectItem="(id) => emit('selectItem', id)"
        @toggleGroup="(id) => emit('toggleGroup', id)">
        <template
          v-if="slots.decorator"
          #decorator="slotProps">
          <slot
            v-bind="slotProps"
            name="decorator" />
        </template>
        <template
          v-if="slots.empty"
          #empty="slotProps">
          <slot
            v-bind="slotProps"
            name="empty" />
        </template>
        <template
          v-if="slots.icon"
          #icon="slotProps">
          <slot
            v-bind="slotProps"
            name="icon" />
        </template>
      </SidebarItem>
      <template v-if="slots.empty && (item.children?.length ?? 0) === 0">
        <slot
          :item
          name="empty" />
      </template>
    </template>
  </ScalarSidebarGroup>

  <!-- Sidebar item (leaf node) -->
  <ScalarSidebarItem
    :is="href ? 'a' : 'button'"
    v-else
    v-bind="draggableAttrs"
    class="relative"
    :data-sidebar-id="item.id"
    :href="href"
    :selected="isSelected(item.id)"
    v-on="draggableEvents"
    @click="handleSelect">
    <template
      v-if="slots.icon"
      #icon>
      <slot
        :item="item"
        name="icon"
        :open="true" />
    </template>
    <span
      v-if="isDeprecated(item)"
      class="line-through">
      <SidebarItemLabel
        :item
        :operationTitleSource="options?.operationTitleSource" />
    </span>
    <SidebarItemLabel
      v-else
      :item
      :operationTitleSource="options?.operationTitleSource" />
    <template
      v-if="'method' in item"
      #aside>
      <SidebarHttpBadge
        v-if="'method' in item"
        :active="isSelected(item.id)"
        class="ml-2 h-4 self-start"
        :class="{
          // Hide the badge when we're showing the decorator
          'group-hover/button:opacity-0 group-focus-visible/button:opacity-0 group-has-[~*_[aria-expanded=true]]/button:opacity-0 group-has-[~*:focus-within]/button:opacity-0 group-has-[~*:hover]/button:opacity-0':
            slots.decorator,
        }"
        :label="options?.labels?.httpMethod"
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
