<script setup lang="ts">
import {
  ScalarButton,
  ScalarIconButton,
  ScalarModal,
  ScalarSidebarItem,
  useModal,
  type WorkspaceGroup,
} from '@scalar/components'
import { isMacOS } from '@scalar/helpers/general/is-mac-os'
import {
  ScalarIconDotsThree,
  ScalarIconGlobe,
  ScalarIconPlus,
} from '@scalar/icons'
import type { DraggingItem, HoveredItem, SidebarState } from '@scalar/sidebar'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getParentEntry } from '@scalar/workspace-store/navigation'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import { capitalize, computed, nextTick, ref } from 'vue'

import Rabbit from '@/assets/rabbit.ascii?raw'
import RabbitJump from '@/assets/rabbitjump.ascii?raw'
import ScalarAsciiArt from '@/components/ScalarAsciiArt.vue'
import DeleteSidebarListElement from '@/components/Sidebar/Actions/DeleteSidebarListElement.vue'
import { Sidebar } from '@/v2/components/sidebar'
import SidebarItemMenu from '@/v2/features/app/components/SidebarItemMenu.vue'
import { dragHandleFactory } from '@/v2/helpers/drag-handle-factory'
import type { ClientLayout } from '@/v2/types/layout'

const { sidebarState, layout, activeWorkspace, workspaces, store, eventBus } =
  defineProps<{
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
    activeWorkspace: { id: string; label: string }
    /**
     * The list of all available workspaces.
     * Used to render options for workspace switching and selection.
     */
    workspaces: WorkspaceGroup[]
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

defineSlots<{
  /** Slot for customizing the actions section of the sidebar menu. */
  sidebarMenuActions?(): unknown
}>()

/** The label for the workspace button in the sidebar */
const workspaceLabel = computed(() => capitalize(activeWorkspace.label))

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

/** The current target for the dropdown menu */
const menuTarget = ref<{
  /** The sidebar item that the menu is targeting */
  item: TraversedEntry
  /** A reference to the element that the menu is for */
  el: HTMLElement
  /** Whether or not to show the menu */
  showMenu: boolean
} | null>(null)

const deleteModalState = useModal()

/** Computes the message for the delete modal */
const deleteMessage = computed(() => {
  const item = menuTarget.value?.item

  if (item?.type === 'document') {
    return "This cannot be undone. You're about to delete the document and all tags and operations inside it."
  }

  return `Are you sure you want to delete this ${item?.type ?? 'item'}? This action cannot be undone.`
})

/** Deletes an item from the sidebar by emitting the appropriate event */
const handleDelete = () => {
  const item = menuTarget.value?.item

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
    eventBus.emit('document:delete:document', { name: document.name })
  } else if (item.type === 'tag') {
    eventBus.emit('tag:delete:tag', {
      documentName: document.name,
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
      documentName: document.name,
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
      documentName: document.name,
    })
  }

  /** Clean up after deletion */
  deleteModalState.hide()
  menuTarget.value = null
}

/** Opens the dropdown menu for the given item */
const openMenu = async (
  event: MouseEvent | KeyboardEvent,
  item: TraversedEntry,
) => {
  if (menuTarget.value?.showMenu) {
    return
  }

  const el = event.currentTarget as HTMLElement
  menuTarget.value = { item, el, showMenu: true }

  // Wait for the target to bind to the element
  await nextTick()

  // Re-dispatch the event on the target to open the menu
  const cloned =
    event instanceof MouseEvent
      ? new MouseEvent(event.type, event)
      : new KeyboardEvent(event.type, event)

  menuTarget.value?.el.dispatchEvent(cloned)
}

/** Closes the dropdown menu */
const closeMenu = () => {
  if (menuTarget.value) {
    menuTarget.value.showMenu = false
  }
}

/** Opens the command palette with the payload needed to create a request */
const handleAddEmptyFolder = (item: TraversedEntry) => {
  const itemWithParent = sidebarState.getEntryById(item.id)
  const document = getParentEntry('document', itemWithParent)
  const tag = getParentEntry('tag', itemWithParent)

  eventBus.emit('ui:open:command-palette', {
    action: 'create-request',
    payload: {
      documentId: document?.id,
      tagId: tag?.name,
    },
  })
}
</script>

<template>
  <div class="flex">
    <Sidebar
      v-model:isSidebarOpen="isSidebarOpen"
      v-model:sidebarWidth="sidebarWidth"
      :activeWorkspace="activeWorkspace"
      :documents="Object.values(store.workspace.documents)"
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
      <template #sidebarMenuActions>
        <slot name="sidebarMenuActions" />
      </template>
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
          aria-expanded="false"
          aria-haspopup="menu"
          :icon="ScalarIconDotsThree"
          label="More options"
          size="sm"
          weight="bold"
          @click.stop="(e: MouseEvent) => openMenu(e, item)"
          @keydown.down.stop="(e: KeyboardEvent) => openMenu(e, item)"
          @keydown.enter.stop="(e: KeyboardEvent) => openMenu(e, item)"
          @keydown.space.stop="(e: KeyboardEvent) => openMenu(e, item)"
          @keydown.up.stop="(e: KeyboardEvent) => openMenu(e, item)" />
      </template>

      <!-- Dirty document icon slot -->
      <template #icon="{ item }">
        <template
          v-if="
            item.type === 'document' &&
            store.workspace.documents[item.name]?.['x-scalar-is-dirty'] === true
          ">
          <div class="flex items-center">
            <div class="h-2 w-2 rounded-full bg-white"></div>
          </div>
        </template>
      </template>

      <!-- Empty folder slot -->
      <template #empty="{ item }">
        <ScalarSidebarItem
          is="button"
          @click="handleAddEmptyFolder(item)">
          <template #icon>
            <ScalarIconPlus />
          </template>
          <template #default>Add operation</template>
        </ScalarSidebarItem>
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
              Add Item &nbsp;

              <span
                class="text-sidebar-c-2 rounded border px-1.25 py-1 text-xs leading-none font-medium uppercase">
                <template v-if="isMacOS()">
                  <span class="sr-only">Command</span>
                  <span aria-hidden="true">⌘</span>
                </template>
                <template v-else>
                  <span class="sr-only">CTRL</span>
                  <span aria-hidden="true">⌃</span>
                </template>
                K
              </span>
            </ScalarButton>
          </div>
        </div>
      </template>
    </Sidebar>
    <SidebarItemMenu
      v-if="menuTarget?.showMenu"
      :eventBus="eventBus"
      :item="menuTarget.item"
      :sidebarState="sidebarState"
      :target="menuTarget.el"
      @closeMenu="closeMenu"
      @showDeleteModal="deleteModalState.show()" />
    <!-- Delete Modal -->
    <ScalarModal
      v-if="menuTarget"
      :size="'xxs'"
      :state="deleteModalState"
      :title="`Delete ${menuTarget.item.title}`">
      <DeleteSidebarListElement
        :variableName="menuTarget.item.title"
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
