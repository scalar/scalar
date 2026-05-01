<script setup lang="ts">
import {
  ScalarIconButton,
  ScalarSidebarButton,
  ScalarSidebarItem,
  ScalarSidebarNestedItems,
} from '@scalar/components'
import {
  ScalarIconCaretLeft,
  ScalarIconDotsThree,
  ScalarIconGearSix,
  ScalarIconMagnifyingGlass,
  ScalarIconPlus,
} from '@scalar/icons'
import {
  filterItems,
  SidebarItem,
  type DraggingItem,
  type HoveredItem,
} from '@scalar/sidebar'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'

import type { SidebarDocumentItem } from '@/v2/features/app/hooks/use-sidebar-documents'

const { item, active, open, loading } = defineProps<{
  /** The document row to render. */
  item: SidebarDocumentItem
  /** Whether the document row is the currently active sidebar entry. */
  active: boolean
  /** Whether the document is drilled-in (its children are shown). */
  open: boolean
  /** Whether the document is currently being fetched from the registry. */
  loading?: boolean
  /** Predicate to check whether a child entry can be dropped on a target. */
  isDroppable: (draggingItem: DraggingItem, hoveredItem: HoveredItem) => boolean
  /** Predicate to check whether a child entry is currently expanded. */
  isExpanded: (id: string) => boolean
  /** Predicate to check whether a child entry is currently selected. */
  isSelected: (id: string) => boolean
}>()

const emit = defineEmits<{
  /** Navigate back from the drilled-in document view. */
  (event: 'back'): void
  /** The document row was clicked. */
  (event: 'click', item: SidebarDocumentItem): void
  /** Open the document (collection) settings. */
  (event: 'openSettings'): void
  /** Open the per-document search modal. */
  (event: 'search'): void
  /** Create a new operation in this document. */
  (event: 'createOperation', item: SidebarDocumentItem): void
  /** Add an operation inside an empty tag/folder. */
  (event: 'addEmptyFolder', item: TraversedEntry): void
  /** Open the contextual "more" menu for a child entry. */
  (
    event: 'openMenu',
    nativeEvent: MouseEvent | KeyboardEvent,
    entry: TraversedEntry,
  ): void
  /** A child entry was selected. */
  (event: 'selectItem', id: string): void
  /** A child group was toggled. */
  (event: 'toggleGroup', id: string): void
  /** A drag-and-drop operation has completed. */
  (
    event: 'dragEnd',
    draggingItem: DraggingItem,
    hoveredItem: HoveredItem,
  ): boolean
}>()

const handleDragEnd = (
  draggingItem: DraggingItem,
  hoveredItem: HoveredItem,
): boolean => emit('dragEnd', draggingItem, hoveredItem)
</script>

<template>
  <ScalarSidebarNestedItems
    :active="active"
    controlled
    :open="open"
    @back="emit('back')"
    @click="emit('click', item)">
    <span>{{ item.title }}</span>
    <template
      v-if="loading"
      #aside>
      <span class="text-c-3 text-xs">Loading…</span>
    </template>
    <!-- Document back row -->
    <template #back>
      <div class="flex items-center gap-1">
        <ScalarSidebarButton
          is="button"
          class="text-sidebar-c-1 font-sidebar-active hover:text-sidebar-c-1 flex-1"
          @click="emit('back')">
          <template #icon>
            <ScalarIconCaretLeft class="text-sidebar-c-2 -m-px size-4" />
          </template>
          Back
        </ScalarSidebarButton>
        <ScalarIconButton
          :icon="ScalarIconGearSix"
          label="Collection settings"
          size="sm"
          @click="emit('openSettings')" />
        <ScalarIconButton
          :icon="ScalarIconMagnifyingGlass"
          label="Search collection"
          size="sm"
          @click="emit('search')" />
        <ScalarIconButton
          class="rounded-full border"
          :icon="ScalarIconPlus"
          label="Add operation"
          size="sm"
          @click="emit('createOperation', item)" />
      </div>
    </template>
    <!-- Document items (operations, tags, examples) -->
    <template #items>
      <template v-if="item.navigation?.children?.length">
        <SidebarItem
          v-for="child in filterItems('client', item.navigation.children)"
          :key="child.id"
          :isDroppable="isDroppable"
          :isExpanded="isExpanded"
          :isSelected="isSelected"
          :item="child"
          layout="client"
          @onDragEnd="handleDragEnd"
          @selectItem="(id: string) => emit('selectItem', id)"
          @toggleGroup="(id: string) => emit('toggleGroup', id)">
          <!--
            Per-item "more" dropdown for tags, operations and examples
            (add / edit / delete…). The dropdown is rendered once at the
            sidebar root and anchors itself to whichever icon button opened
            it. Operation settings live on the operation header (next to the
            environment selector), not here.
          -->
          <template #decorator="{ item: entry }">
            <ScalarIconButton
              aria-expanded="false"
              aria-haspopup="menu"
              class="bg-b-2"
              :icon="ScalarIconDotsThree"
              label="More options"
              size="sm"
              variant="ghost"
              weight="bold"
              @click.stop="(e: MouseEvent) => emit('openMenu', e, entry)"
              @keydown.down.stop="
                (e: KeyboardEvent) => emit('openMenu', e, entry)
              "
              @keydown.enter.stop="
                (e: KeyboardEvent) => emit('openMenu', e, entry)
              "
              @keydown.space.stop="
                (e: KeyboardEvent) => emit('openMenu', e, entry)
              "
              @keydown.up.stop="
                (e: KeyboardEvent) => emit('openMenu', e, entry)
              " />
          </template>
          <!--
            Empty tag / folder slot. Matches the "Add operation" affordance
            from the old sidebar so users can create an operation directly
            inside the hovered tag.
          -->
          <template #empty="{ item: emptyItem }">
            <ScalarSidebarItem
              is="button"
              @click="emit('addEmptyFolder', emptyItem)">
              <template #icon>
                <ScalarIconPlus />
              </template>
              <template #default>Add operation</template>
            </ScalarSidebarItem>
          </template>
        </SidebarItem>
      </template>
      <li
        v-else
        class="text-c-3 px-3 py-1 text-xs">
        Empty document
      </li>
    </template>
  </ScalarSidebarNestedItems>
</template>
