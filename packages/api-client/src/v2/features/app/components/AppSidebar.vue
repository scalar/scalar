<script setup lang="ts">
import type { AppState } from '@scalar/api-client/v2/features/app'
import {
  ScalarIconButton,
  ScalarModal,
  ScalarSidebar,
  ScalarSidebarButton,
  ScalarSidebarItem,
  ScalarSidebarItems,
  ScalarSidebarNestedItems,
  ScalarSidebarSearchInput,
  ScalarSidebarSection,
  useModal,
} from '@scalar/components'
import {
  ScalarIconCaretLeft,
  ScalarIconDotsThree,
  ScalarIconFolderDashed,
  ScalarIconFunnel,
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
import { useToasts } from '@scalar/use-toasts'
import { getParentEntry } from '@scalar/workspace-store/navigation'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import { computed, onBeforeMount, onBeforeUnmount, ref } from 'vue'

import DeleteSidebarListElement from '@/components/Sidebar/Actions/DeleteSidebarListElement.vue'
import { Resize } from '@/v2/components/resize'
import SidebarItemMenu from '@/v2/features/app/components/SidebarItemMenu.vue'
import { createTempOperation } from '@/v2/features/app/helpers/create-temp-operation'
import { loadRegistryDocument } from '@/v2/features/app/helpers/load-registry-document'
import { useDocumentFilter } from '@/v2/features/app/hooks/use-document-filter'
import { useSidebarContextMenu } from '@/v2/features/app/hooks/use-sidebar-context-menu'
import {
  useSidebarDocuments,
  type RegistryDocumentsState,
  type SidebarDocumentItem,
} from '@/v2/features/app/hooks/use-sidebar-documents'
import { DocumentSearchModal } from '@/v2/features/search'
import { dragHandleFactory } from '@/v2/helpers/drag-handle-factory'
import type { ImportDocumentFromRegistry } from '@/v2/types/configuration'

const {
  app,
  indent = 20,
  registryDocuments = { status: 'success', documents: [] },
  fetchRegistryDocument,
} = defineProps<{
  /** The app state from @scalar/api-client. */
  app: AppState
  /** Horizontal indent applied to nested sidebar items, in pixels. */
  indent?: number
  /**
   * The list of all available registry documents, wrapped in a loading state
   * so the sidebar can render skeleton placeholders while the registry is
   * still being fetched.
   */
  registryDocuments?: RegistryDocumentsState
  /** A function to fetch a registry document */
  fetchRegistryDocument?: ImportDocumentFromRegistry
}>()

const { toast } = useToasts()

/**
 * Whether the caller is still fetching the list of registry documents. We
 * only surface the loading state on team workspaces because local workspaces
 * never consult the registry
 */
const isLoadingRegistry = computed(
  () =>
    registryDocuments.status === 'loading' &&
    app.workspace.isTeamWorkspace.value,
)

const { rest } = useSidebarDocuments({
  app,
  managedDocs: () => registryDocuments.documents ?? [],
})

/**
 * Whether the workspace truly has no documents to show. Distinct from the
 * filter producing no results: we only surface the "No APIs yet" empty state
 * when the workspace is genuinely empty so users see a clear call-to-action
 * instead of a confusing blank space.
 */
const isEmpty = computed(
  () => !isLoadingRegistry.value && rest.value.length === 0,
)

/**
 * Fuzzy filter over the top-level documents. Owns its own input visibility,
 * query string and Fuse index. See `use-document-filter.ts` for details.
 */
const {
  isVisible: isFilterVisible,
  query: filterQuery,
  filteredItems: filteredRest,
  toggle: toggleFilter,
} = useDocumentFilter(rest)

const sidebarState = app.sidebar.state

/** Which registry documents are currently being fetched. */
const loadingKeys = ref<Record<string, boolean>>({})

/**
 * Check if the given {@link SidebarDocumentItem} is the currently active document (from the sidebar state).
 */
const isDocActive = (item: SidebarDocumentItem) => {
  if (!item.navigation) {
    return false
  }

  return (
    sidebarState.selectedItem.value === item.navigation.id ||
    Boolean(sidebarState.selectedItems.value[item.navigation.id])
  )
}

const handleDocumentClick = async (item: SidebarDocumentItem) => {
  if (item.navigation) {
    app.sidebar.handleSelectItem(item.navigation.id)
    return
  }

  if (!item.registry || !app.store.value) {
    console.warn('Document does not have a sidebar navigation, skipping...')
    return
  }

  if (!fetchRegistryDocument) {
    console.warn(
      'You need to provide a fetchRegistryDocument function to load registry documents',
    )
    return
  }

  if (loadingKeys.value[item.key]) {
    return
  }

  loadingKeys.value[item.key] = true

  const result = await loadRegistryDocument({
    fetcher: fetchRegistryDocument,
    workspaceStore: app.store.value,
    namespace: item.registry.namespace,
    slug: item.registry.slug,
  })

  loadingKeys.value[item.key] = false

  if (!result.ok) {
    toast(result.error, 'error')
    return
  }

  // After loading, route to the document overview. `syncSidebar` will then
  // mark the document as selected and the template's `:open="isDocActive"`
  // binding drills the sidebar in automatically — no local state needed.
  app.eventBus.emit('ui:navigate', {
    page: 'document',
    path: 'overview',
    documentSlug: result.documentName,
  })
}

const isSelected = (id: string) => sidebarState.isSelected(id)
const isExpanded = (id: string) => sidebarState.isExpanded(id)

const handleSelectItem = (id: string) => {
  app.sidebar.handleSelectItem(id)
}

const handleToggleGroup = (id: string) => {
  sidebarState.setExpanded(id, !sidebarState.isExpanded(id))
}

/**
 * Drag-and-drop handlers for sidebar items. The factory reads from the live
 * workspace store and shared sidebar state, so it reflects the latest
 * navigation tree on every drag. Mirrors the behaviour of the old
 * `AppSidebar.vue` (documents, tags, and operations can be reordered, and
 * operations can be moved between tags/documents).
 */
const dragHandlers = computed(() =>
  dragHandleFactory({
    store: app.store,
    sidebarState,
  }),
)

const handleDragEnd = (
  draggingItem: DraggingItem,
  hoveredItem: HoveredItem,
): boolean => dragHandlers.value.handleDragEnd(draggingItem, hoveredItem)

const isDroppable = (
  draggingItem: DraggingItem,
  hoveredItem: HoveredItem,
): boolean => dragHandlers.value.isDroppable(draggingItem, hoveredItem)

/**
 * Contextual "more" dropdown for tags, operations and examples, together
 * with the shared delete-confirmation modal it triggers.
 */
const {
  menuTarget,
  deleteModalState,
  deleteMessage,
  openMenu,
  closeMenu,
  handleDelete,
} = useSidebarContextMenu({
  eventBus: app.eventBus,
  sidebarState,
})

/**
 * Create a new operation from an empty folder slot inside a tag or document.
 * If the entry is a tag, the new operation inherits that tag so it stays
 * grouped under the same folder.
 */
const handleAddEmptyFolder = (item: TraversedEntry) => {
  const itemWithParent = sidebarState.getEntryById(item.id)
  const documentName = getParentEntry('document', itemWithParent)?.name
  const tagName = getParentEntry('tag', itemWithParent)?.name
  const store = app.store.value

  if (!documentName || !store) {
    console.error('Document name not found')
    return
  }

  createTempOperation(documentName, {
    existingPaths: new Set(
      Object.keys(store.workspace.documents[documentName]?.paths ?? {}),
    ),
    eventBus: app.eventBus,
    tags: tagName ? [tagName] : undefined,
  })
}

const handleCreate = () => {
  app.eventBus.emit('ui:open:command-palette', {
    action: 'create-openapi-document',
    payload: undefined,
  })
}

/**
 * Create a new operation inside the given document and immediately navigate to
 * it. Uses `createTempOperation` so the operation gets a unique `/temp…` path,
 * then the sidebar focuses the new example and the address bar is focused so
 * the user can start typing the real path right away.
 */
const handleCreateOperation = (item: SidebarDocumentItem) => {
  const documentName = item.documentName
  const store = app.store.value

  if (!documentName || !store) {
    console.warn('Cannot create an operation: no document loaded')
    return
  }

  createTempOperation(documentName, {
    existingPaths: new Set(
      Object.keys(store.workspace.documents[documentName]?.paths ?? {}),
    ),
    eventBus: app.eventBus,
  })
}

/**
 * Navigates back to the workspace "Get started" page.
 */
const handleBack = () => {
  app.eventBus.emit('ui:navigate', {
    page: 'workspace',
    path: 'get-started',
  })
}

/**
 * True when the user is currently viewing a document (any of its subpages).
 * When inside a document, the sidebar actions are scoped to that document:
 * the gear icon opens the document (collection) settings and the filter icon
 * becomes a search icon that focuses the search input.
 */
const isOnDocumentPage = computed(() =>
  Boolean(app.activeEntities.documentSlug.value),
)

const handleOpenSettings = () => {
  if (isOnDocumentPage.value) {
    app.eventBus.emit('ui:navigate', {
      page: 'document',
      path: 'settings',
      documentSlug: app.activeEntities.documentSlug.value,
    })
    return
  }

  app.eventBus.emit('ui:navigate', {
    page: 'workspace',
    path: 'settings',
  })
}

/**
 * Controls the per-document search modal. Only used when the user is drilled
 * into a single document and clicks the magnifying-glass icon.
 */
const searchModal = useModal()

/**
 * The OpenAPI document currently selected in the workspace. The search modal
 * scopes its Fuse index to this document so results never leak across
 * collections.
 */
const activeDocument = computed(() => app.store.value?.workspace.activeDocument)

const handleFilterOrSearch = () => {
  // Inside a document, this icon opens a modal search that is scoped to that
  // single document (similar to the reference search modal), so users can jump
  // to any operation / tag / heading without noise from other documents.
  if (isOnDocumentPage.value) {
    searchModal.show()
    return
  }

  // At the top-level documents view, the icon toggles a lightweight filter
  // that narrows the visible documents by title.
  toggleFilter()
}

/**
 * Handle the `ui:focus:search` event. Dispatch is driven by the shared
 * `handleHotkeys` helper (Cmd/Ctrl+J) or by programmatic callers such as the
 * workspace "Get started" page. When a `KeyboardEvent` is included we
 * preventDefault to override the browser's Cmd+J (downloads panel), then
 * delegate to `handleFilterOrSearch`, which already branches on whether the
 * user is viewing a document or the workspace root.
 */
const handleSearchHotkey = (payload: { event: KeyboardEvent } | undefined) => {
  payload?.event.preventDefault()
  handleFilterOrSearch()
}

/**
 * Handle the `ui:open:settings` event (Cmd/Ctrl+I). Same delegation model as
 * `handleSearchHotkey`: preventDefault on the originating keyboard event (if
 * any) and hand off to `handleOpenSettings`, which routes to the document-
 * level settings page when a document is active and the workspace-level
 * settings page otherwise.
 */
const handleSettingsHotkey = (
  payload: { event: KeyboardEvent } | undefined,
) => {
  payload?.event.preventDefault()
  handleOpenSettings()
}

onBeforeMount(() => {
  app.eventBus.on('ui:focus:search', handleSearchHotkey)
  app.eventBus.on('ui:open:settings', handleSettingsHotkey)
})
onBeforeUnmount(() => {
  app.eventBus.off('ui:focus:search', handleSearchHotkey)
  app.eventBus.off('ui:open:settings', handleSettingsHotkey)
})

/**
 * Navigate to the selected search result. `scroll-to:nav-item` is already
 * wired up through the app event bus to update the sidebar + route, matching
 * the behaviour used elsewhere in the app.
 */
const handleSearchSelect = (id: string) => {
  app.eventBus.emit('scroll-to:nav-item', { id })
}

/** Controls the width of the sidebar */
const sidebarWidth = defineModel<number>('sidebarWidth', {
  required: true,
  default: 288,
})
</script>

<template>
  <Resize
    v-model:width="sidebarWidth"
    class="flex flex-col">
    <template #default>
      <div class="flex flex-1">
        <ScalarSidebar
          class="flex min-h-0 flex-1 flex-col"
          :style="{ '--scalar-sidebar-indent': indent + 'px' }">
          <!-- Top-level sidebar header -->
          <div
            v-if="!isOnDocumentPage"
            class="flex flex-col gap-1.5 p-(--scalar-sidebar-padding)">
            <div class="flex items-center gap-1">
              <ScalarSidebarButton
                is="div"
                class="text-sidebar-c-1 font-sidebar-active flex-1"
                disabled>
                All Documents
              </ScalarSidebarButton>
              <ScalarIconButton
                :icon="ScalarIconGearSix"
                label="Workspace settings"
                size="sm"
                @click="handleOpenSettings" />
              <ScalarIconButton
                :icon="ScalarIconFunnel"
                label="Filter documents"
                size="sm"
                @click="handleFilterOrSearch" />
              <ScalarIconButton
                class="rounded-full border"
                :icon="ScalarIconPlus"
                label="Add document"
                size="sm"
                @click="handleCreate" />
            </div>
            <ScalarSidebarSearchInput
              v-if="isFilterVisible"
              v-model="filterQuery"
              autofocus />
          </div>

          <!-- Document list (top-level) -->
          <div class="custom-scroll flex flex-1 flex-col">
            <!--
              Empty state: no documents in the workspace yet. Matches the
              minimal `empty folder` appearance.
            -->
            <div
              v-if="isEmpty && !isOnDocumentPage"
              class="text-c-3 flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center select-none">
              <ScalarIconFolderDashed
                class="size-10"
                weight="light" />
              <p class="text-sm font-medium">No APIs yet</p>
            </div>
            <ScalarSidebarItems v-else>
              <!-- Show pinned documents after we add support for it -->
              <!--  <ScalarSidebarSection v-if="pinned.length">
              Pinned
              <template #items>
                <ScalarSidebarNestedItems
                  v-for="item in pinned"
                  :key="item.key"
                  :active="isDocActive(item)"
                  controlled
                  :open="Boolean(openKeys[item.key])"
                  @back="openKeys[item.key] = false"
                  @click="handleDocumentClick(item)">
                  <span class="truncate">{{ item.title }}</span>
                  <template #back-label>{{ item.title }}</template>
                  <template #items>
                    <SidebarItem
                      v-for="child in filterItems(item.navigation?.children ?? [])"
                      :key="child.id"
                      :isDraggable="false"
                      :isDroppable="isDroppable"
                      :isExpanded="isExpanded"
                      :isSelected="isSelected"
                      :item="child"
                      layout="client"
                      @selectItem="handleSelectItem"
                      @toggleGroup="handleToggleGroup" />
                  </template>
                </ScalarSidebarNestedItems>
              </template>
            </ScalarSidebarSection> -->

              <ScalarSidebarSection>
                All documents
                <template #items>
                  <!--
                    Skeleton rows shown while the caller is still fetching
                    the registry document list. We only render skeletons in
                    the top-level view (when no document is drilled-in) so
                    the collection view is never masked by placeholders.
                  -->
                  <template v-if="isLoadingRegistry && !isOnDocumentPage">
                    <li
                      v-for="n in 4"
                      :key="`registry-skeleton-${n}`"
                      aria-hidden="true"
                      class="sidebar-skeleton-row px-(--scalar-sidebar-padding) py-1">
                      <span class="bg-b-3 block h-6 rounded-md" />
                    </li>
                  </template>
                  <ScalarSidebarNestedItems
                    v-for="item in filteredRest"
                    :key="item.key"
                    :active="isDocActive(item)"
                    controlled
                    :open="isDocActive(item)"
                    @back="handleBack"
                    @click="handleDocumentClick(item)">
                    <span>{{ item.title }}</span>
                    <template
                      v-if="loadingKeys[item.key]"
                      #aside>
                      <span class="text-c-3 text-xs">Loading…</span>
                    </template>
                    <!-- Document back row -->
                    <template #back>
                      <div class="flex items-center gap-1">
                        <ScalarSidebarButton
                          is="button"
                          class="text-sidebar-c-1 font-sidebar-active hover:text-sidebar-c-1 flex-1"
                          @click="handleBack">
                          <template #icon>
                            <ScalarIconCaretLeft
                              class="text-sidebar-c-2 -m-px size-4" />
                          </template>
                          Back
                        </ScalarSidebarButton>
                        <ScalarIconButton
                          :icon="ScalarIconGearSix"
                          label="Collection settings"
                          size="sm"
                          @click="handleOpenSettings" />
                        <ScalarIconButton
                          :icon="ScalarIconMagnifyingGlass"
                          label="Search collection"
                          size="sm"
                          @click="handleFilterOrSearch" />
                        <ScalarIconButton
                          class="rounded-full border"
                          :icon="ScalarIconPlus"
                          label="Add operation"
                          size="sm"
                          @click="handleCreateOperation(item)" />
                      </div>
                    </template>
                    <!-- Document items (operations, tags, examples) -->
                    <template #items>
                      <template v-if="item.navigation?.children?.length">
                        <SidebarItem
                          v-for="child in filterItems(
                            'client',
                            item.navigation.children,
                          )"
                          :key="child.id"
                          :isDroppable="isDroppable"
                          :isExpanded="isExpanded"
                          :isSelected="isSelected"
                          :item="child"
                          layout="client"
                          @onDragEnd="handleDragEnd"
                          @selectItem="handleSelectItem"
                          @toggleGroup="handleToggleGroup">
                          <!--
                            Per-item "more" dropdown for tags, operations and
                            examples (add / edit / delete…). The dropdown is
                            rendered once at the sidebar root and anchors
                            itself to whichever icon button opened it.
                            Operation settings live on the operation header
                            (next to the environment selector), not here.
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
                              @click.stop="
                                (e: MouseEvent) => openMenu(e, entry)
                              "
                              @keydown.down.stop="
                                (e: KeyboardEvent) => openMenu(e, entry)
                              "
                              @keydown.enter.stop="
                                (e: KeyboardEvent) => openMenu(e, entry)
                              "
                              @keydown.space.stop="
                                (e: KeyboardEvent) => openMenu(e, entry)
                              "
                              @keydown.up.stop="
                                (e: KeyboardEvent) => openMenu(e, entry)
                              " />
                          </template>
                          <!--
                            Empty tag / folder slot. Matches the "Add operation"
                            affordance from the old sidebar so users can create
                            an operation directly inside the hovered tag.
                          -->
                          <template #empty="{ item: emptyItem }">
                            <ScalarSidebarItem
                              is="button"
                              @click="handleAddEmptyFolder(emptyItem)">
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
              </ScalarSidebarSection>
            </ScalarSidebarItems>
          </div>

          <slot name="footer" />
        </ScalarSidebar>
      </div>
      <DocumentSearchModal
        :document="activeDocument"
        :modalState="searchModal"
        @select="handleSearchSelect" />
      <!--
        Contextual dropdown menu for tags, operations and examples. Rendered
        once for the whole sidebar and re-anchored to the triggering icon via
        `menuTarget.el`, so we do not create a dropdown per item.
      -->
      <SidebarItemMenu
        v-if="app.store.value && menuTarget?.showMenu"
        :eventBus="app.eventBus"
        :item="menuTarget.item"
        :sidebarState="sidebarState"
        :target="menuTarget.el"
        :workspaceStore="app.store.value"
        @closeMenu="closeMenu"
        @showDeleteModal="deleteModalState.show()" />
      <!-- Delete confirmation modal, triggered from the dropdown menu above. -->
      <ScalarModal
        v-if="menuTarget"
        size="xxs"
        :state="deleteModalState"
        :title="`Delete ${menuTarget.item.title}`">
        <DeleteSidebarListElement
          :variableName="menuTarget.item.title"
          :warningMessage="deleteMessage"
          @close="deleteModalState.hide()"
          @delete="handleDelete" />
      </ScalarModal>
    </template>
  </Resize>
</template>

<style scoped>
/*
 * Gentle pulse for the registry loading skeletons. Matches the existing
 * `LoadingSkeleton.vue` easing/duration used in `@scalar/api-reference` so
 * any skeleton in the app feels consistent.
 */
.sidebar-skeleton-row > span {
  animation: sidebar-skeleton-pulse 1.5s infinite alternate;
}

@keyframes sidebar-skeleton-pulse {
  from {
    opacity: 1;
  }
  to {
    opacity: 0.33;
  }
}
</style>
