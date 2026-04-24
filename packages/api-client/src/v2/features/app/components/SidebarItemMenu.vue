<script setup lang="ts">
import {
  ScalarDropdown,
  ScalarDropdownDivider,
  ScalarDropdownItem,
  ScalarIcon,
} from '@scalar/components'
import { ScalarIconPencil } from '@scalar/icons'
import type { SidebarState } from '@scalar/sidebar'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getParentEntry } from '@scalar/workspace-store/navigation'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import { isOpenApiDocument } from '@scalar/workspace-store/schemas/type-guards'
import { nextTick, ref, watch } from 'vue'

import { createTempOperation } from '@/v2/features/app/helpers/create-temp-operation'

const { item, eventBus, sidebarState, target, workspaceStore } = defineProps<{
  /** The item to display the decorator for */
  item: TraversedEntry
  /** The event bus to emit events to */
  eventBus: WorkspaceEventBus
  /** The sidebar state to get the parent entry from */
  sidebarState: SidebarState<TraversedEntry>
  /** The target to position the dropdown relative to */
  target: HTMLElement
  /** The workspace store for accessing documents */
  workspaceStore: WorkspaceStore
}>()

const emit = defineEmits<{
  (e: 'closeMenu'): void
  (e: 'showDeleteModal'): void
}>()

const open = ref(false)

watch(open, async (newValue, oldValue) => {
  // Close the menu if it was open and is now closed
  if (!newValue && oldValue) {
    // Wait to let the menu close and clean up the aria attributes
    await nextTick()
    emit('closeMenu')
  }
})

/** Returns whether the item supports adding operations */
const canAddOperation = (): boolean =>
  item.type === 'document' || item.type === 'tag'

/** Returns whether the item supports adding tags */
const canAddTag = (): boolean => item.type === 'document'

/** Returns whether the item supports editing tags */
const canEditTag = (): boolean => item.type === 'tag'

/** Returns whether the item supports editing examples */
const canEditExample = (): boolean => item.type === 'example'

/** Returns whether the item supports adding examples */
const canAddExample = (): boolean => item.type === 'operation'

/** Returns whether the item supports deletion */
const canDelete = (): boolean =>
  (item.type === 'document' && item.id !== 'drafts') ||
  item.type === 'tag' ||
  item.type === 'operation' ||
  item.type === 'example'

const handleAddTag = () => {
  if (item.type === 'document') {
    eventBus.emit('ui:open:command-palette', {
      action: 'add-tag',
      payload: {
        documentName: item.name,
      },
    })
  }
}

const handleEditTag = () => {
  if (item.type === 'tag') {
    const itemWithParent = sidebarState.getEntryById(item.id)
    eventBus.emit(
      'ui:open:command-palette',
      {
        action: 'edit-tag',
        payload: {
          tag: item,
          documentName: getParentEntry('document', itemWithParent)?.name ?? '',
        },
      },
      { skipUnpackProxy: true },
    )
  }
}

const handleAddExample = () => {
  if (item.type === 'operation') {
    const itemWithParent = sidebarState.getEntryById(item.id)
    eventBus.emit('ui:open:command-palette', {
      action: 'add-example',
      payload: {
        documentName: getParentEntry('document', itemWithParent)?.name,
        operationId: item.id,
      },
    })
  }
}

const handleEditExample = () => {
  if (item.type === 'example') {
    const itemWithParent = sidebarState.getEntryById(item.id)
    const parentOperation = getParentEntry('operation', itemWithParent)
    eventBus.emit(
      'ui:open:command-palette',
      {
        action: 'edit-example',
        payload: {
          example: item,
          documentName: getParentEntry('document', itemWithParent)?.name ?? '',
          operationId: parentOperation?.id ?? '',
        },
      } as any,
      { skipUnpackProxy: true },
    )
  }
}

const handleAddOperation = () => {
  const itemWithParent = sidebarState.getEntryById(item.id)
  const documentName = getParentEntry('document', itemWithParent)?.name
  const tagName = getParentEntry('tag', itemWithParent)?.name
  if (!documentName) {
    console.error('Document name not found')
    return
  }
  const doc = workspaceStore.workspace.documents[documentName]
  createTempOperation(documentName, {
    existingPaths: new Set(
      Object.keys((isOpenApiDocument(doc) ? doc.paths : undefined) ?? {}),
    ),
    eventBus,
    tags: tagName ? [tagName] : undefined,
  })
}
</script>
<template>
  <ScalarDropdown
    v-model:open="open"
    placement="bottom-end"
    :target="target"
    teleport>
    <template #items>
      <!-- Add operation option for documents and tags -->
      <ScalarDropdownItem
        v-if="canAddOperation()"
        @click="handleAddOperation">
        <div class="flex items-center gap-2">
          <ScalarIcon
            icon="Add"
            size="sm" />
          Add Operation
        </div>
      </ScalarDropdownItem>

      <!-- Add tag option for documents only -->
      <ScalarDropdownItem
        v-if="canAddTag()"
        @click="handleAddTag()">
        <div class="flex items-center gap-2">
          <ScalarIcon
            icon="Add"
            size="sm" />
          Add Tag
        </div>
      </ScalarDropdownItem>

      <!-- Edit tag option for tags only -->
      <ScalarDropdownItem
        v-if="canEditTag()"
        @click="handleEditTag()">
        <div class="flex items-center gap-2">
          <ScalarIconPencil size="sm" />
          Rename Tag
        </div>
      </ScalarDropdownItem>

      <!-- Edit example option for examples only -->
      <ScalarDropdownItem
        v-if="canEditExample()"
        @click="handleEditExample()">
        <div class="flex items-center gap-2">
          <ScalarIconPencil size="sm" />
          Rename Example
        </div>
      </ScalarDropdownItem>

      <!-- Add example option for operations -->
      <ScalarDropdownItem
        v-if="canAddExample()"
        @click="handleAddExample()">
        <div class="flex items-center gap-2">
          <ScalarIcon
            icon="Add"
            size="sm" />
          Add Example
        </div>
      </ScalarDropdownItem>
      <ScalarDropdownDivider
        v-if="
          (canAddExample() ||
            canAddOperation() ||
            canAddTag() ||
            canEditExample()) &&
          canDelete()
        " />
      <ScalarDropdownItem
        v-if="canDelete()"
        @click="emit('showDeleteModal')">
        <div class="text-red flex items-center gap-2">
          <ScalarIcon
            icon="Delete"
            size="sm" />
          Delete
        </div>
      </ScalarDropdownItem>
    </template>
  </ScalarDropdown>
</template>
