<script lang="ts">
/**
 * Main entry point for the API client for electron and web.
 *
 * This component handles all events and store business logic for the application.
 */
export default {}
</script>

<script setup lang="ts">
import { ScalarTeleportRoot, useModal } from '@scalar/components'
import { isHttpMethod } from '@scalar/helpers/http/is-http-method'
import { getThemeStyles } from '@scalar/themes'
import { ScalarToasts } from '@scalar/use-toasts'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { computed, ref } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'

import CreateWorkspaceModal from '@/v2/features/app/components/CreateWorkspaceModal.vue'
import SplashScreen from '@/v2/features/app/components/SplashScreen.vue'
import type { RouteProps } from '@/v2/features/app/helpers/routes'
import { useAppSidebar } from '@/v2/features/app/hooks/use-app-sidebar'
import { useDocumentWatcher } from '@/v2/features/app/hooks/use-document-watcher'
import { useSyncPath } from '@/v2/features/app/hooks/use-sync-path'
import { useWorkspaceSelector } from '@/v2/features/app/hooks/use-workspace-selector'
import TheCommandPalette from '@/v2/features/command-palette/components/TheCommandPalette.vue'
import { useCommandPaletteState } from '@/v2/features/command-palette/hooks/use-command-palette-state'
import { getActiveEnvironment } from '@/v2/helpers/get-active-environment'
import type { ClientPlugin } from '@/v2/helpers/plugins'
import { useColorMode } from '@/v2/hooks/use-color-mode'
import { useGlobalHotKeys } from '@/v2/hooks/use-global-hot-keys'
import type { ClientLayout } from '@/v2/types/layout'

import AppSidebar from './components/AppSidebar.vue'
import DesktopTabs from './components/DesktopTabs.vue'
import WebTopNav from './components/WebTopNav.vue'
import { useTabs } from './hooks/use-tabs'
import { useWorkspaceClientAppEvents } from './hooks/use-workspace-client-app-events'

const { layout, plugins } = defineProps<{
  layout: Exclude<ClientLayout, 'modal'>
  plugins: ClientPlugin[]
}>()

/** Expose workspace store to window for debugging purposes. */
if (typeof window !== 'undefined') {
  window.dataDumpWorkspace = () => store.value
}

/** Workspace event bus for handling workspace-level events. */
const eventBus = createWorkspaceEventBus({
  debug: import.meta.env.DEV,
})

/** Controls the visibility of the sidebar. */
const isSidebarOpen = ref(true)

const route = useRoute()
const router = useRouter()

/** Extracts a string parameter from the route */
const getRouteParam = (paramName: string): string | undefined => {
  const param = route.params[paramName]
  return typeof param === 'string' ? param : undefined
}

/** Current workspace slug from the route, defaults to 'default'. */
const workspaceSlug = computed(() => getRouteParam('workspaceSlug'))

/** Current document slug from the route. */
const documentSlug = computed(() => getRouteParam('documentSlug'))

/**
 * The active document from the workspace store.
 * Returns null if no document is selected or the document does not exist.
 */
const document = computed(() => {
  if (!documentSlug.value || store.value === null) return null
  return store.value.workspace.documents[documentSlug.value] ?? null
})

/** Decoded path parameter from the route. */
const path = computed(() => {
  const pathEncoded = getRouteParam('pathEncoded')
  return pathEncoded ? decodeURIComponent(pathEncoded) : undefined
})

/** HTTP method from the route, validated against known HTTP methods */
const method = computed(() => {
  const methodParam = getRouteParam('method')
  return methodParam && isHttpMethod(methodParam) ? methodParam : undefined
})

/** Example name from the route. */
const exampleName = computed(() => getRouteParam('exampleName'))

// Workspace-related state and utilities derived from the workspaceSlug route param.
const workspaceSelectorState = useWorkspaceSelector()

const { store, workspaces, activeWorkspace, setWorkspaceId, createWorkspace } =
  workspaceSelectorState

/** Initialize color mode to ensure it is set on mount. */
useColorMode({ workspaceStore: store })

/** Sidebar state and selection handling. */
const sidebarState = useAppSidebar({
  workspaceStore: store,
  documentSlug,
  path,
  method,
  exampleName,
})

/** Desktop tabs state and actions (only used in desktop layout) */
const tabsState = useTabs({
  workspaceStore: store,
  getEntryByLocation: sidebarState.getEntryByLocation,
  eventBus,
  workspaceSlug,
  documentSlug,
  path,
  method,
})

const { isLoading: isSyncPathLoading } = useSyncPath({
  workspaceSelectorState,
  tabsState,
  eventBus,
})

/** Command palette state and actions */
const commandPaletteState = useCommandPaletteState()

/** Register workspace client event bus listeners and handlers (navigation, sidebar, etc.) */
useWorkspaceClientAppEvents({
  eventBus,
  document,
  workspaceStore: store,
  isSidebarOpen,
  commandPaletteState,
  sidebarState,
})

/** Register global hotkeys for the app, passing the workspace event bus and layout state */
useGlobalHotKeys(eventBus, layout)

const DEFAULT_DOCUMENT_WATCH_TIMEOUT = 5000

/** Watch the active document for changes and rebase it with its remote source */
useDocumentWatcher({
  documentName: documentSlug,
  store,
  initialTimeout: DEFAULT_DOCUMENT_WATCH_TIMEOUT,
})

/**
 * Merged environment variables from workspace and document levels.
 * Variables from both sources are combined, with document variables
 * taking precedence in case of naming conflicts.
 */
const environment = computed(() =>
  getActiveEnvironment(store.value, document.value),
)

/** Generate the theme style tag for dynamic theme application. */
const themeStyleTag = computed(() => {
  if (store.value === null) {
    return ''
  }

  const themeId = store.value.workspace['x-scalar-theme']

  if (!themeId) return ''

  return `<style>${getThemeStyles(themeId)}</style>`
})

/** Default sidebar width in pixels. */
const DEFAULT_SIDEBAR_WIDTH = 288

/** Width of the sidebar, with fallback to default. */
const sidebarWidth = computed(
  () =>
    store.value?.workspace?.['x-scalar-sidebar-width'] ?? DEFAULT_SIDEBAR_WIDTH,
)

/** Check if the workspace overview is currently open. */
const isWorkspaceOpen = computed(() =>
  Boolean(workspaceSlug.value && !documentSlug.value),
)

/** Handler for sidebar width changes. */
const handleSidebarWidthUpdate = (width: number) =>
  store.value?.update('x-scalar-sidebar-width', width)

/** Handler for workspace navigation. */
const handleWorkspaceClick = () =>
  router.push({
    name: 'workspace.environment',
    params: { workspaceSlug: workspaceSlug.value },
  })

/**
 * Handler for selecting a workspace.
 * Sets the current workspace ID if provided.
 */
const handleSelectWorkspace = (id?: string) => {
  if (!id) {
    return
  }
  setWorkspaceId(id)
}

/** Props to pass to the RouterView component. */
const routerViewProps = computed(
  () =>
    ({
      documentSlug: documentSlug.value ?? '',
      document: document.value,
      environment: environment.value,
      eventBus,
      exampleName: exampleName.value,
      layout,
      method: method.value,
      path: path.value,
      workspaceStore: store.value!,
      activeWorkspace: activeWorkspace.value!,
      plugins,
    }) satisfies RouteProps,
)

const createWorkspaceModalState = useModal()
</script>

<template>
  <template
    v-if="store !== null && activeWorkspace !== null && !isSyncPathLoading">
    <div v-html="themeStyleTag" />
    <ScalarTeleportRoot>
      <!-- Toasts -->
      <ScalarToasts />

      <!-- Desktop App Tabs -->
      <DesktopTabs
        v-if="layout === 'desktop'"
        :eventBus="eventBus"
        :tabsState="tabsState" />

      <!-- Web App Top Nav -->
      <WebTopNav
        v-else
        :activeWorkspace="activeWorkspace"
        :workspaces="workspaces"
        @create:workspace="createWorkspaceModalState.show()"
        @select:workspace="handleSelectWorkspace" />

      <!-- min-h-0 is required here for scrolling, do not remove it -->
      <main class="flex min-h-0 flex-1">
        <!-- App sidebar -->

        <AppSidebar
          v-model:isSidebarOpen="isSidebarOpen"
          :activeWorkspace
          :eventBus
          :isWorkspaceOpen
          :layout
          :sidebarState="sidebarState.state"
          :sidebarWidth
          :store
          :workspaces
          @click:workspace="handleWorkspaceClick"
          @create:workspace="createWorkspaceModalState.show()"
          @select:workspace="handleSelectWorkspace"
          @selectItem="sidebarState.handleSelectItem"
          @update:sidebarWidth="handleSidebarWidthUpdate" />

        <!-- Create workspace modal -->
        <CreateWorkspaceModal
          :state="createWorkspaceModalState"
          @create:workspace="(payload) => createWorkspace(payload)" />

        <!-- Popup command palette to add resources from anywhere -->
        <TheCommandPalette
          :eventBus="eventBus"
          :paletteState="commandPaletteState"
          :workspaceStore="store" />

        <!-- <ImportCollectionListener></ImportCollectionListener> -->

        <div class="bg-b-1 flex-1">
          <RouterView v-bind="routerViewProps" />
        </div>
      </main>
    </ScalarTeleportRoot>
  </template>
  <template v-else>
    <SplashScreen />
  </template>
</template>

<style>
#scalar-client {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  width: 100dvw;
  position: relative;
  background-color: var(--scalar-background-2);
}
.dark-mode #scalar-client {
  background-color: color-mix(in srgb, var(--scalar-background-1) 65%, black);
}
</style>
