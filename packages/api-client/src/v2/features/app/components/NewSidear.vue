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
import type {
  TraversedEntry,
  TraversedOperation,
} from '@scalar/workspace-store/schemas/navigation'
import Fuse from 'fuse.js'
import {
  computed,
  nextTick,
  onBeforeMount,
  onBeforeUnmount,
  ref,
  watch,
} from 'vue'

import DeleteSidebarListElement from '@/components/Sidebar/Actions/DeleteSidebarListElement.vue'
import { Resize } from '@/v2/components/resize'
import SidebarItemMenu from '@/v2/features/app/components/SidebarItemMenu.vue'
import { createTempOperation } from '@/v2/features/app/helpers/create-temp-operation'
import { loadRegistryDocument } from '@/v2/features/app/helpers/load-registry-document'
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
 * never consult the registry — see `useSidebarDocuments` — so skeletons there
 * would always be stale placeholders for data that will never arrive.
 */
const isLoadingRegistry = computed(
  () => registryDocuments.status === 'loading' && app.workspace.isTeamWorkspace.value,
)

const { rest } = useSidebarDocuments({
  app,
  managedDocs: () => registryDocuments.documents ?? [],
})

/** Controls the visibility of the document filter input in the top-level view. */
const isFilterVisible = ref(false)

/** The current filter query entered by the user. */
const filterQuery = ref('')

/**
 * Fuzzy index over the top-level documents. Rebuilt when the document list
 * changes so newly added or removed entries are reflected immediately. We
 * index the `title` field only, since the filter is a lightweight "jump to
 * document by name" affordance rather than a full content search.
 */
const fuse = computed(
  () =>
    new Fuse(rest.value, {
      keys: ['title'],
      threshold: 0.3,
      ignoreLocation: true,
    }),
)

/**
 * Top-level documents narrowed down by the current filter query using Fuse.js
 * fuzzy matching on the title. An empty query returns the full list.
 */
const filteredRest = computed(() => {
  const query = filterQuery.value.trim()
  if (!query) {
    return rest.value
  }

  return fuse.value.search(query).map((result) => result.item)
})

const sidebarState = app.sidebar.state

/**
 * Tracks which top-level documents are drilled into. Keyed by the sidebar item
 * key so it works for both loaded documents and registry-only placeholders.
 */
const openKeys = ref<Record<string, boolean>>({})

/** Which registry documents are currently being fetched. */
const loadingKeys = ref<Record<string, boolean>>({})

/**
 * Whether this item represents the document currently selected in the shared
 * sidebar state. `selectedItems` contains every ancestor on the path to the
 * active node, so the document entry is included whenever any of its children
 * (operation, example, …) is selected by the route.
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

/**
 * The sidebar item that matches the currently active document, derived from
 * the shared `app.sidebar.state`. This stays in sync automatically because
 * `syncSidebar` in the app-state updates `sidebarState` on every route change.
 */
const activeItem = computed(() => rest.value.find(isDocActive))

async function handleDocumentClick(item: SidebarDocumentItem) {
  if (item.navigation) {
    app.sidebar.handleSelectItem(item.navigation.id)
    openKeys.value[item.key] = true
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

  openKeys.value[item.key] = true
  app.eventBus.emit('ui:navigate', {
    page: 'document',
    path: 'overview',
    documentSlug: result.documentName,
  })
}

const isSelected = (id: string) => sidebarState.isSelected(id)
const isExpanded = (id: string) => sidebarState.isExpanded(id)

function handleSelectItem(id: string) {
  app.sidebar.handleSelectItem(id)
}

function handleToggleGroup(id: string) {
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
 * Contextual "more" menu for tags, operations and examples. We only keep
 * a reference to the element the menu is anchored to; `SidebarItemMenu`
 * then teleports itself next to that target. Mirrors the dropdown flow
 * from the old `AppSidebar.vue`.
 */
const menuTarget = ref<{
  /** The sidebar entry the menu is acting on. */
  item: TraversedEntry
  /** The DOM element the dropdown is anchored to. */
  el: HTMLElement
  /** Whether the menu is currently rendered. */
  showMenu: boolean
} | null>(null)

/** Modal state for the "are you sure you want to delete…" confirmation. */
const deleteModalState = useModal()

/**
 * Copy shown inside the delete confirmation modal. Documents get a stronger
 * warning because deleting one also removes all tags and operations inside.
 */
const deleteMessage = computed(() => {
  const item = menuTarget.value?.item

  if (item?.type === 'document') {
    return "This cannot be undone. You're about to delete the document and all tags and operations inside it."
  }

  return `Are you sure you want to delete this ${item?.type ?? 'item'}? This action cannot be undone.`
})

/**
 * Fire the correct `*:delete:*` event on the event bus based on the active
 * menu target. Replicates the delete branches from `AppSidebar.vue` so the
 * behaviour is identical between the old and new sidebars.
 */
function handleDelete() {
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
    app.eventBus.emit('document:delete:document', { name: document.name })
  } else if (item.type === 'tag') {
    app.eventBus.emit('tag:delete:tag', {
      documentName: document.name,
      name: item.name,
    })
  } else if (item.type === 'operation') {
    app.eventBus.emit('operation:delete:operation', {
      meta: { method: item.method, path: item.path },
      documentName: document.name,
    })
  } else if (item.type === 'example') {
    if (!operation) {
      return
    }
    app.eventBus.emit('operation:delete:example', {
      meta: {
        method: operation.method,
        path: operation.path,
        exampleKey: item.name,
      },
      documentName: document.name,
    })
  }

  deleteModalState.hide()
  menuTarget.value = null
}

/**
 * Open the "more" dropdown for the given item. We bind the menu to the
 * triggering element and re-dispatch the originating event on it after the
 * next tick, matching the old sidebar pattern so the dropdown opens on the
 * correct anchor for both mouse and keyboard interactions.
 */
async function openMenu(
  event: MouseEvent | KeyboardEvent,
  item: TraversedEntry,
) {
  if (menuTarget.value?.showMenu) {
    return
  }

  const el = event.currentTarget as HTMLElement
  menuTarget.value = { item, el, showMenu: true }

  await nextTick()

  const cloned =
    event instanceof MouseEvent
      ? new MouseEvent(event.type, event)
      : new KeyboardEvent(event.type, event)

  menuTarget.value?.el.dispatchEvent(cloned)
}

/** Close the "more" dropdown without resetting its target so animations can play out. */
function closeMenu() {
  if (menuTarget.value) {
    menuTarget.value.showMenu = false
  }
}

/**
 * Navigate to the overview page of a given operation when the gear icon on an
 * operation row is clicked. Mirrors `navigateToOperationsPage` from the old
 * sidebar.
 */
function navigateToOperationsPage(item: TraversedOperation) {
  const operationWithParent = sidebarState.getEntryById(item.id)
  const documentSlug = getParentEntry('document', operationWithParent)?.name

  app.eventBus.emit('ui:navigate', {
    page: 'operation',
    path: 'overview',
    operationPath: item.path,
    method: item.method,
    documentSlug,
  })
}

/**
 * Create a new operation from an empty folder slot inside a tag or document.
 * If the entry is a tag, the new operation inherits that tag so it stays
 * grouped under the same folder. Mirrors `handleAddEmptyFolder` from
 * `AppSidebar.vue`.
 */
function handleAddEmptyFolder(item: TraversedEntry) {
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

function handleCreate() {
  app.eventBus.emit('ui:open:command-palette', {
    action: 'create-openapi-document',
    payload: undefined,
  })
}

/**
 * Create a new operation inside the given document and immediately navigate to
 * it. Uses `createTempOperation` so the operation gets a unique `/temp…` path,
 * then the sidebar focuses the new example and the address bar is focused so
 * the user can start typing the real path right away. Mirrors the old
 * "Add operation" behaviour from `AppSidebar.vue` (`handleAddEmptyFolder`).
 */
function handleCreateOperation(item: SidebarDocumentItem) {
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
 * Navigates back to the workspace "Get started" page. We rely on the watcher
 * below to clear `openKeys` once the route change lands, so this function only
 * needs to trigger the navigation.
 */
function handleBack() {
  app.eventBus.emit('ui:navigate', {
    page: 'workspace',
    path: 'get-started',
  })
}

/**
 * Keep the drilled-in sidebar state in sync with the active document. When the
 * user navigates to a document (via any means), open that document's entry in
 * the sidebar. When they leave the document (no active slug), collapse back to
 * the top-level list.
 */
watch(
  () => activeItem.value?.key ?? null,
  (key) => {
    if (key) {
      openKeys.value = { [key]: true }
    } else {
      openKeys.value = {}
    }
  },
  { immediate: true },
)

/**
 * True when the user is currently viewing a document (any of its subpages).
 * When inside a document, the sidebar actions are scoped to that document:
 * the gear icon opens the document (collection) settings and the filter icon
 * becomes a search icon that focuses the search input.
 */
const isOnDocumentPage = computed(() =>
  Boolean(app.activeEntities.documentSlug.value),
)

function handleOpenSettings() {
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

function handleFilterOrSearch() {
  // Inside a document, this icon opens a modal search that is scoped to that
  // single document (similar to the reference search modal), so users can jump
  // to any operation / tag / heading without noise from other documents.
  if (isOnDocumentPage.value) {
    searchModal.show()
    return
  }

  // At the top-level documents view, the icon toggles a lightweight filter
  // that narrows the visible documents by title.
  isFilterVisible.value = !isFilterVisible.value
  if (!isFilterVisible.value) {
    filterQuery.value = ''
  }
}

/**
 * Handle the `ui:focus:search` event. Dispatch is driven by the shared
 * `handleHotkeys` helper (Cmd/Ctrl+J) or by programmatic callers such as the
 * workspace "Get started" page. When a `KeyboardEvent` is included we
 * preventDefault to override the browser's Cmd+J (downloads panel), then
 * delegate to `handleFilterOrSearch`, which already branches on whether the
 * user is viewing a document or the workspace root.
 */
function handleSearchHotkey(payload: { event: KeyboardEvent } | undefined) {
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
function handleSettingsHotkey(payload: { event: KeyboardEvent } | undefined) {
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
function handleSearchSelect(id: string) {
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
          <!--
      Top-level sidebar header. When the user drills into a document, the
      header for that state (back button + collection-level actions) is
      rendered inside `ScalarSidebarNestedItems`' `#back` slot below, so this
      outer header is hidden to avoid stacking two header rows.

      The inner layout mirrors the `#back` row (non-interactive `ScalarSidebarButton`
      wrapper + icon buttons in a flex container) so the label and icons line up
      identically between the two states.
    -->
          <div
            v-if="!activeItem"
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

          <div class="custom-scroll flex-1 overflow-hidden">
            <ScalarSidebarItems>
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
                  <template v-if="isLoadingRegistry && !activeItem">
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
                    :open="Boolean(openKeys[item.key])"
                    @back="handleBack"
                    @click="handleDocumentClick(item)">
                    <span>{{ item.title }}</span>
                    <template
                      v-if="loadingKeys[item.key]"
                      #aside>
                      <span class="text-c-3 text-xs">Loading…</span>
                    </template>
                    <!--
                Replace the default back row with one that also hosts the
                collection-scoped icon actions (settings, search, add). This
                mirrors the default `#back` markup from `ScalarSidebarNestedItems`
                and adds the icon buttons on the right side.
              -->
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
                            Per-item actions: gear for operations (jump to
                            overview) and a "more" dropdown for tags,
                            operations and examples (add / edit / delete…).
                            The dropdown is rendered once at the sidebar root
                            and anchors itself to whichever icon button opened
                            it.
                          -->
                          <template #decorator="{ item: entry }">
                            <div class="flex items-center gap-0.5">
                              <ScalarIconButton
                                v-if="entry.type === 'operation'"
                                :icon="ScalarIconGearSix"
                                label="Operation settings"
                                size="sm"
                                weight="bold"
                                @click.stop="navigateToOperationsPage(entry)"
                                @keydown.enter.stop="
                                  navigateToOperationsPage(entry)
                                "
                                @keydown.space.stop="
                                  navigateToOperationsPage(entry)
                                " />
                              <ScalarIconButton
                                aria-expanded="false"
                                aria-haspopup="menu"
                                :icon="ScalarIconDotsThree"
                                label="More options"
                                size="sm"
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
                            </div>
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
