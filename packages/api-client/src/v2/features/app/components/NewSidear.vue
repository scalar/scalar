<script setup lang="ts">
import type { AppState } from '@scalar/api-client/v2/features/app'
import {
  ScalarIconButton,
  ScalarSidebar,
  ScalarSidebarButton,
  ScalarSidebarItems,
  ScalarSidebarNestedItems,
  ScalarSidebarSearchInput,
  ScalarSidebarSection,
  useModal,
} from '@scalar/components'
import {
  ScalarIconCaretLeft,
  ScalarIconFunnel,
  ScalarIconGearSix,
  ScalarIconMagnifyingGlass,
  ScalarIconPlus,
} from '@scalar/icons'
import { filterItems, SidebarItem } from '@scalar/sidebar'
import { useToasts } from '@scalar/use-toasts'
import Fuse from 'fuse.js'
import { computed, onBeforeMount, onBeforeUnmount, ref, watch } from 'vue'

import { Resize } from '@/v2/components/resize'
import { loadRegistryDocument } from '@/v2/features/app/helpers/load-registry-document'
import {
  useSidebarDocuments,
  type RegistryDocument,
  type SidebarDocumentItem,
} from '@/v2/features/app/hooks/use-sidebar-documents'
import { DocumentSearchModal } from '@/v2/features/search'

type FetchRegistryDocumentResult =
  | {
      message: string
      error: true
    }
  | {
      data: string
      error: false
    }

type FetchRegistryDocument = (params: {
  namespace: string
  slug: string
  version?: string
}) => Promise<FetchRegistryDocumentResult>

const {
  app,
  indent = 20,
  registryDocuments,
  fetchRegistryDocument,
} = defineProps<{
  /** The app state from @scalar/api-client. */
  app: AppState
  /** Horizontal indent applied to nested sidebar items, in pixels. */
  indent?: number
  /** The list of all available registry documents */
  registryDocuments: RegistryDocument[]
  /** A function to fetch a registry document */
  fetchRegistryDocument?: FetchRegistryDocument
}>()

const { toast } = useToasts()

const { rest } = useSidebarDocuments({
  app,
  managedDocs: () => registryDocuments,
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
 * `SidebarItem` validates `isDroppable` as a Function at runtime (despite the
 * types allowing a boolean). We never want drag-and-drop in this sidebar, so
 * a stable function that always returns `false` disables dropping safely.
 */
const isDroppable = () => false

function handleCreate() {
  app.eventBus.emit('ui:open:command-palette')
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
const activeDocument = computed(
  () => app.store.value?.workspace.activeDocument,
)

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
                          label="Add document"
                          size="sm"
                          @click="handleCreate" />
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
                          :isDraggable="false"
                          :isDroppable="isDroppable"
                          :isExpanded="isExpanded"
                          :isSelected="isSelected"
                          :item="child"
                          layout="client"
                          @selectItem="handleSelectItem"
                          @toggleGroup="handleToggleGroup" />
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
    </template>
  </Resize>
</template>
