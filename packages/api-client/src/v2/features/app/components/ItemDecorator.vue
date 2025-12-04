<script setup lang="ts">
import {
  ScalarDropdown,
  ScalarDropdownDivider,
  ScalarDropdownItem,
  ScalarIcon,
  ScalarIconButton,
  ScalarModal,
  useModal,
} from '@scalar/components'
import type { SidebarState } from '@scalar/sidebar'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getParentEntry } from '@scalar/workspace-store/navigation'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import { computed } from 'vue'

import DeleteSidebarListElement from '@/components/Sidebar/Actions/DeleteSidebarListElement.vue'

const { item, eventBus, sidebarState } = defineProps<{
  /** The item to display the decorator for */
  item: TraversedEntry
  /** The event bus to emit events to */
  eventBus: WorkspaceEventBus
  /** The sidebar state to get the parent entry from */
  sidebarState: SidebarState<TraversedEntry>
}>()

const deleteModalState = useModal()

/** Returns whether the item supports adding operations */
const canAddOperation = (): boolean => {
  return item.type === 'document' || item.type === 'tag'
}

/** Returns whether the item supports adding tags */
const canAddTag = (): boolean => {
  return item.type === 'document'
}

/** Returns whether the item supports adding examples */
const canAddExample = (): boolean => {
  return item.type === 'operation'
}

/** Returns whether the item supports deletion */
const canDelete = (): boolean => {
  return (
    (item.type === 'document' && item.id !== 'drafts') ||
    item.type === 'tag' ||
    item.type === 'operation' ||
    item.type === 'example'
  )
}

const handleAddOperation = () => {
  if (item.type === 'document') {
    eventBus.emit('ui:open:command-palette', {
      action: 'create-request',
      payload: {
        documentId: item.id,
      },
    })
  }

  if (item.type === 'tag') {
    const itemWithParent = sidebarState.getEntryById(item.id)
    eventBus.emit('ui:open:command-palette', {
      action: 'create-request',
      payload: {
        documentId: getParentEntry('document', itemWithParent)?.id,
        tagId: item.name,
      },
    })
  }
}

const handleAddTag = () => {
  if (item.type === 'document') {
    eventBus.emit('ui:open:command-palette', {
      action: 'add-tag',
      payload: {
        documentId: item.id,
      },
    })
  }
  // TODO: Implement add tag functionality
}

const handleAddExample = () => {
  if (item.type === 'operation') {
    const itemWithParent = sidebarState.getEntryById(item.id)
    eventBus.emit('ui:open:command-palette', {
      action: 'add-example',
      payload: {
        documentId: getParentEntry('document', itemWithParent)?.id,
        operationId: item.id,
      },
    })
  }
}

const handleDelete = () => {
  const result = sidebarState.getEntryById(item.id)

  const document = getParentEntry('document', result)
  const operation = getParentEntry('operation', result)

  if (!document) {
    return
  }

  if (item.type === 'document') {
    eventBus.emit('document:delete:document', { name: item.id })
    return
  }

  if (item.type === 'tag') {
    eventBus.emit('tag:delete:tag', {
      documentName: document.id,
      name: item.name,
    })
  }

  if (item.type === 'operation') {
    if (!operation) {
      return
    }

    eventBus.emit('operation:delete:operation', {
      meta: {
        method: operation.method,
        path: operation.path,
      },
      documentName: document.id,
    })
  }

  if (item.type === 'example') {
    if (!operation) {
      return
    }

    eventBus.emit('operation:delete:example', {
      meta: {
        method: operation.method,
        path: operation.path,
        exampleKey: item.name,
      },
      documentName: document.id,
    })
  }
}

const stopPropagation = (event: MouseEvent) => {
  event.stopPropagation()
}

const deleteMessage = computed(() => {
  if (item.type === 'document') {
    return "This cannot be undone. You're about to delete the document and all tags and operations inside it."
  }

  return `Are you sure you want to delete this ${item.type}? This action cannot be undone.`
})
</script>
<template>
  <ScalarDropdown
    placement="bottom-end"
    @click.stop>
    <template #default="{ open }">
      <ScalarIconButton
        class="hover:bg-b-3"
        :class="{ 'hidden group-hover/button:block': !open }"
        icon="Ellipses"
        label="Show options"
        size="xxs"
        @click="stopPropagation" />
    </template>
    <template #items>
      <!-- Add operation option for documents and tags -->
      <ScalarDropdownItem
        v-if="canAddOperation()"
        @click="handleAddOperation()">
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
          (canAddExample() || canAddOperation() || canAddTag()) && canDelete()
        " />
      <ScalarDropdownItem
        v-if="canDelete()"
        @click="deleteModalState.show()">
        <div class="text-red flex items-center gap-2">
          <ScalarIcon
            icon="Delete"
            size="sm" />
          Delete
        </div>
      </ScalarDropdownItem>
    </template>
  </ScalarDropdown>
  <!-- Delete Modal -->
  <ScalarModal
    :size="'xxs'"
    :state="deleteModalState"
    :title="`Delete ${item.type}`">
    <DeleteSidebarListElement
      :variableName="item.title"
      :warningMessage="deleteMessage"
      @close="deleteModalState.hide()"
      @delete="handleDelete" />
  </ScalarModal>
</template>
