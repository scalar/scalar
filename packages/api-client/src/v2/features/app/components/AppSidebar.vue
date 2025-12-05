<script setup lang="ts">
import {
  ScalarButton,
  ScalarIconButton,
  ScalarModal,
  ScalarSidebarItem,
  useModal,
} from '@scalar/components'
import { ScalarIconDotsThree, ScalarIconGlobe } from '@scalar/icons'
import type { DraggingItem, HoveredItem, SidebarState } from '@scalar/sidebar'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getParentEntry } from '@scalar/workspace-store/navigation'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import { capitalize, computed, ref } from 'vue'

import Rabbit from '@/assets/rabbit.ascii?raw'
import RabbitJump from '@/assets/rabbitjump.ascii?raw'
import ScalarAsciiArt from '@/components/ScalarAsciiArt.vue'
import DeleteSidebarListElement from '@/components/Sidebar/Actions/DeleteSidebarListElement.vue'
import { Sidebar } from '@/v2/components/sidebar'
import ItemDecorator from '@/v2/features/app/components/ItemDecorator.vue'
import { dragHandleFactory } from '@/v2/helpers/drag-handle-factory'
import type { Workspace } from '@/v2/hooks/use-workspace-selector'
import type { ClientLayout } from '@/v2/types/layout'

const { sidebarState, layout, activeWorkspace, store, eventBus } = defineProps<{
  /**
   * The current layout of the app (e.g., 'desktop', 'web')
   */
  layout: ClientLayout

  /**
   * The sidebar state, holding navigation items and state
   */
  sidebarState: SidebarState<TraversedEntry>

  /**
   * Whether the workspace overview sidebar is currently open
   */
  isWorkspaceOpen?: boolean
  /**
   * The currently active workspace.
   * This represents the workspace that the user is currently working in.
   */
  activeWorkspace: Workspace
  /**
   * The list of all available workspaces.
   * Used to render options for workspace switching and selection.
   */
  workspaces: Workspace[]
  /**
   * The workspace event bus for handling workspace-level events.
   * Used for triggering and responding to workspace changes and actions.
   */
  eventBus: WorkspaceEventBus
  /**
   * The WorkspaceStore instance for managing workspace state and actions.
   * Provides methods and state for interacting with the current workspace.
   */
  store: WorkspaceStore
}>()

const emit = defineEmits<{
  /** Emitted when the workspace button in the sidebar is clicked */
  (e: 'click:workspace'): void
  /** Emitted when a navigation or sidebar item is selected by ID */
  (e: 'selectItem', id: string): void
  /** Emitted when a workspace is selected by optional ID */
  (e: 'select:workspace', id?: string): void
  /** Emitted when the user requests to create a new workspace */
  (e: 'create:workspace'): void
}>()

/** The label for the workspace button in the sidebar */
const workspaceLabel = computed(() => capitalize(activeWorkspace.name))

/** Controls the visibility of the sidebar */
const isSidebarOpen = defineModel<boolean>('isSidebarOpen', {
  required: true,
})

/** Controls the width of the sidebar */
const sidebarWidth = defineModel<number>('sidebarWidth', {
  required: true,
  default: 288,
})

/** Calculate if we should show the getting started section */
const showGettingStarted = computed(() => sidebarState.items.value.length <= 1)

/*
 * Setup drag and drop handlers for sidebar items.
 * The dragHandleFactory takes the current workspace store and sidebar state,
 * and returns the appropriate handlers for drag ending and droppability.
 *
 * We use computed to ensure the handlers are recreated when the store or sidebarState changes,
 * so they always have access to the latest values.
 */
const dragHandlers = computed(() =>
  dragHandleFactory({
    store,
    sidebarState,
  }),
)

const handleDragEnd = (
  draggingItem: DraggingItem,
  hoveredItem: HoveredItem,
): boolean => {
  return dragHandlers.value.handleDragEnd(draggingItem, hoveredItem)
}

const isDroppable = (
  draggingItem: DraggingItem,
  hoveredItem: HoveredItem,
): boolean => {
  return dragHandlers.value.isDroppable(draggingItem, hoveredItem)
}

const selectedItem = ref<{
  item: TraversedEntry
  target: HTMLElement
  isOpen: boolean
} | null>(null)

const deleteModalState = useModal()

const deleteMessage = computed(() => {
  const item = selectedItem.value?.item

  if (item?.type === 'document') {
    return "This cannot be undone. You're about to delete the document and all tags and operations inside it."
  }

  return `Are you sure you want to delete this ${item?.type ?? 'item'}? This action cannot be undone.`
})

const handleDelete = () => {
  const item = selectedItem.value?.item

  if (!item) {
    return
  }

  const result = sidebarState.getEntryById(item.id)

  const document = getParentEntry('document', result)
  const operation = getParentEntry('operation', result)

  if (!document) {
    return
  }

  if (item.type === 'document') {
    eventBus.emit('document:delete:document', { name: item.id })
  } else if (item.type === 'tag') {
    eventBus.emit('tag:delete:tag', {
      documentName: document.id,
      name: item.name,
    })
  } else if (item.type === 'operation') {
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
  } else if (item.type === 'example') {
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

  /** Clean up after deletion */
  deleteModalState.hide()
  selectedItem.value = null
}

const selectItem = (event: MouseEvent, item: TraversedEntry) => {
  event.preventDefault()
  event.stopPropagation()
  selectedItem.value = {
    item,
    target: event.currentTarget as HTMLElement,
    isOpen: true,
  }
}

// Closes the decorator dropdown menu by setting isOpen to false on the selected item
const handleCloseMenu = () => {
  if (selectedItem.value) {
    selectedItem.value.isOpen = false
  }
}
</script>

<template>
  <div class="flex">
    <Sidebar
      v-model:isSidebarOpen="isSidebarOpen"
      v-model:sidebarWidth="sidebarWidth"
      :activeWorkspace="activeWorkspace"
      :documents="Object.values(store.workspace.documents)"
      :eventBus="eventBus"
      :isDroppable="isDroppable"
      :layout="layout"
      :sidebarState="sidebarState"
      :workspaces="workspaces"
      @create:workspace="emit('create:workspace')"
      @reorder="
        (draggingItem, hoveredItem) => handleDragEnd(draggingItem, hoveredItem)
      "
      @select:workspace="(id) => emit('select:workspace', id)"
      @selectItem="(id) => emit('selectItem', id)">
      <!-- Workspace Identifier -->
      <template #workspaceButton>
        <ScalarSidebarItem
          is="button"
          :active="isWorkspaceOpen"
          :icon="ScalarIconGlobe"
          @click="emit('click:workspace')">
          {{ workspaceLabel }}
        </ScalarSidebarItem>
      </template>

      <!-- Decorator dropdown menu -->
      <template #decorator="{ item }">
        <ScalarIconButton
          class="hover:bg-b-3"
          :class="{
            'hidden group-hover/button:block': !(
              selectedItem?.isOpen && selectedItem?.item.id === item.id
            ),
          }"
          :icon="ScalarIconDotsThree"
          label="Show options"
          size="xxs"
          @click="(e: MouseEvent) => selectItem(e, item)" />
      </template>

      <!-- Getting started section -->
      <template
        v-if="layout !== 'modal'"
        #footer>
        <div
          :class="{
            'empty-sidebar-item border-t': showGettingStarted,
          }">
          <div
            v-if="showGettingStarted"
            class="empty-sidebar-item-content overflow-hidden px-2.5 py-2.5">
            <div class="rabbit-ascii relative m-auto mt-2 h-[68px] w-[60px]">
              <ScalarAsciiArt
                :art="Rabbit"
                class="rabbitsit font-bold" />
              <ScalarAsciiArt
                :art="RabbitJump"
                class="rabbitjump absolute top-0 left-0 font-bold" />
            </div>
            <div class="mt-2 mb-2 text-center text-sm text-balance">
              <b class="font-medium">Let's Get Started</b>
              <p class="mt-2 leading-3">
                Create request, folder, collection or import from
                OpenAPI/Postman
              </p>
            </div>
          </div>

          <div class="gap-1.5 p-2">
            <ScalarButton
              v-if="showGettingStarted"
              class="w-full"
              size="sm"
              @click="
                eventBus.emit('ui:open:command-palette', {
                  action: 'import-from-openapi-swagger-postman-curl',
                  payload: undefined,
                })
              ">
              Import Collection
            </ScalarButton>

            <ScalarButton
              class="w-full"
              hotkey="K"
              size="sm"
              variant="outlined"
              @click="eventBus.emit('ui:open:command-palette')">
              Add Item
            </ScalarButton>
          </div>
        </div>
      </template>
    </Sidebar>
    <ItemDecorator
      v-if="selectedItem && selectedItem.isOpen"
      :eventBus="eventBus"
      :item="selectedItem.item"
      :sidebarState="sidebarState"
      :target="selectedItem.target"
      @closeMenu="handleCloseMenu"
      @showDeleteModal="deleteModalState.show()" />
    <!-- Delete Modal -->
    <ScalarModal
      v-if="selectedItem"
      :size="'xxs'"
      :state="deleteModalState"
      :title="`Delete ${selectedItem.item.title}`">
      <DeleteSidebarListElement
        :variableName="selectedItem.item.title"
        :warningMessage="deleteMessage"
        @close="deleteModalState.hide()"
        @delete="handleDelete" />
    </ScalarModal>
  </div>
</template>

<style scoped>
.empty-sidebar-item-content {
  display: none;
}
.empty-sidebar-item .empty-sidebar-item-content {
  display: block;
}
.rabbitjump {
  opacity: 0;
}
.empty-sidebar-item:hover .rabbitjump {
  opacity: 1;
  animation: rabbitAnimation 0.5s steps(1) infinite;
}
.empty-sidebar-item:hover .rabbitsit {
  opacity: 0;
  animation: rabbitAnimation2 0.5s steps(1) infinite;
}
.empty-sidebar-item:hover .rabbit-ascii {
  animation: rabbitRun 8s infinite linear;
}
@keyframes rabbitRun {
  0% {
    transform: translate3d(0, 0, 0);
  }
  25% {
    transform: translate3d(250px, 0, 0);
  }
  25.01% {
    transform: translate3d(-250px, 0, 0);
  }
  75% {
    transform: translate3d(250px, 0, 0);
  }
  75.01% {
    transform: translate3d(-250px, 0, 0);
  }
  100% {
    transform: translate3d(0, 0, 0);
  }
}
@keyframes rabbitAnimation {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
@keyframes rabbitAnimation2 {
  0%,
  100% {
    opacity: 0;
  }
  50% {
    opacity: 1;
    transform: translate3d(0, -8px, 0);
  }
}
</style>
