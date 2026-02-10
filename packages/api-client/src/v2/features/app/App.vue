<script lang="ts">
/**
 * Main entry point for the API client for electron and web.
 *
 * This component handles all events and store business logic for the application.
 */
export default {}
</script>

<script setup lang="ts">
import {
  ScalarTeleportRoot,
  useModal,
  type ModalState,
} from '@scalar/components'
import { getThemeStyles } from '@scalar/themes'
import { ScalarToasts } from '@scalar/use-toasts'
import { extensions } from '@scalar/workspace-store/schemas/extensions'
import { computed } from 'vue'
import { RouterView } from 'vue-router'

import { mergeSecurity } from '@/v2/blocks/scalar-auth-selector-block'
import CreateWorkspaceModal from '@/v2/features/app/components/CreateWorkspaceModal.vue'
import SplashScreen from '@/v2/features/app/components/SplashScreen.vue'
import type { RouteProps } from '@/v2/features/app/helpers/routes'
import { useDocumentWatcher } from '@/v2/features/app/hooks/use-document-watcher'
import TheCommandPalette from '@/v2/features/command-palette/TheCommandPalette.vue'
import type { ClientPlugin } from '@/v2/helpers/plugins'
import { useGlobalHotKeys } from '@/v2/hooks/use-global-hot-keys'
import type { ClientLayout } from '@/v2/types/layout'

import type { CommandPaletteState } from '../command-palette/hooks/use-command-palette-state'
import { type AppState } from './app-state'
import AppSidebar from './components/AppSidebar.vue'
import DesktopTabs from './components/DesktopTabs.vue'
import WebTopNav from './components/WebTopNav.vue'

const {
  layout,
  plugins = [],
  getAppState,
  getCommandPaletteState,
} = defineProps<{
  layout: Exclude<ClientLayout, 'modal'>
  plugins?: ClientPlugin[]
  getAppState: () => AppState
  getCommandPaletteState: () => CommandPaletteState
}>()

defineSlots<{
  /**
   * Slot for customizing the actions section of the sidebar menu.
   * This slot is used to render custom actions or components within the actions section.
   */
  'sidebar-menu-actions': () => unknown
  /**
   * Slot for customizing the create workspace modal.
   * This slot is used to render custom actions or components within the create workspace modal.
   */
  'create-workspace'?: (payload: { state: ModalState }) => unknown
}>()

defineExpose({
  openCreateWorkspace: () => createWorkspaceModalState.show(),
})

const app = getAppState()
const paletteState = getCommandPaletteState()

/** Expose workspace store to window for debugging purposes. */
if (typeof window !== 'undefined') {
  window.dataDumpWorkspace = () => app.store.value
  window.dumpAppState = () => app
}

/** Register global hotkeys for the app, passing the workspace event bus and layout state */
useGlobalHotKeys(app.eventBus, layout)

const DEFAULT_DOCUMENT_WATCH_TIMEOUT = 5000

/** Watch the active document for changes and rebase it with its remote source */
useDocumentWatcher({
  documentName: () =>
    app.store.value?.workspace[extensions.workspace.activeDocument],
  store: app.store,
  initialTimeout: DEFAULT_DOCUMENT_WATCH_TIMEOUT,
})

/** Generate the theme style tag for dynamic theme application. */
const themeStyleTag = computed(() => {
  if (app.store.value === null) {
    return ''
  }

  const themeId = app.store.value.workspace['x-scalar-theme']

  if (!themeId) return ''

  return `<style>${getThemeStyles(themeId)}</style>`
})

/** Sets the active workspace by ID: finds the workspace in the list and updates app state & navigation. */
const setActiveWorkspace = (id?: string) => {
  if (!id) {
    return
  }
  const workspace = app.workspace.workspaceList.value?.find(
    (workspace) => workspace.id === id,
  )
  if (!workspace) {
    return
  }
  app.workspace.navigateToWorkspace(workspace.namespace, workspace.slug)
}

const createWorkspaceModalState = useModal()

/** Props to pass to the RouterView component. */
const routerViewProps = computed<RouteProps>(() => {
  /** Ensure we have the auth store */
  const securitySchemes = app.store.value?.auth
    ? mergeSecurity(
        app.document.value?.components?.securitySchemes ?? {},
        {},
        app.store.value.auth,
        app.activeEntities.documentSlug.value ?? '',
      )
    : {}

  return {
    documentSlug: app.activeEntities.documentSlug.value ?? '',
    document: app.store.value?.workspace.activeDocument ?? null,
    environment: app.environment.value,
    eventBus: app.eventBus,
    exampleName: app.activeEntities.exampleName.value,
    layout,
    method: app.activeEntities.method.value,
    path: app.activeEntities.path.value,
    workspaceStore: app.store.value!,
    activeWorkspace: app.workspace.activeWorkspace.value!,
    plugins,
    securitySchemes,
  }
})
</script>

<template>
  <ScalarTeleportRoot>
    <!-- Theme style tag -->
    <div v-html="themeStyleTag" />

    <!-- Toasts -->
    <ScalarToasts />

    <!-- Main content -->
    <main
      v-if="
        app.store.value !== null &&
        app.workspace.activeWorkspace.value !== null &&
        !app.loading.value
      "
      class="flex flex-1 flex-col">
      <!-- Desktop App Tabs -->
      <DesktopTabs
        v-if="layout === 'desktop'"
        :activeTabIndex="app.tabs.activeTabIndex.value"
        :eventBus="app.eventBus"
        :tabs="app.tabs.state.value" />

      <!-- Web App Top Nav -->
      <WebTopNav
        v-else
        :activeWorkspace="app.workspace.activeWorkspace.value!"
        :workspaces="app.workspace.workspaceGroups.value"
        @create:workspace="createWorkspaceModalState.show()"
        @select:workspace="setActiveWorkspace" />

      <!-- min-h-0 is required here for scrolling, do not remove it -->
      <div class="flex min-h-0 flex-1">
        <!-- App sidebar -->
        <AppSidebar
          v-model:isSidebarOpen="app.sidebar.isOpen.value"
          :activeWorkspace="app.workspace.activeWorkspace.value"
          :eventBus="app.eventBus"
          :isWorkspaceOpen="app.workspace.isOpen.value"
          :layout
          :sidebarState="app.sidebar.state"
          :sidebarWidth="app.sidebar.width.value"
          :store="app.store.value!"
          :workspaces="app.workspace.workspaceGroups.value"
          @click:workspace="app.workspace.navigateToWorkspace"
          @create:workspace="createWorkspaceModalState.show()"
          @select:workspace="setActiveWorkspace"
          @selectItem="app.sidebar.handleSelectItem"
          @update:sidebarWidth="app.sidebar.handleSidebarWidthUpdate">
          <template #sidebarMenuActions>
            <slot name="sidebar-menu-actions" />
          </template>
        </AppSidebar>

        <!-- Router view -->
        <div class="bg-b-1 flex-1">
          <RouterView v-bind="routerViewProps" />
        </div>
      </div>

      <slot
        name="create-workspace"
        :state="createWorkspaceModalState">
        <!-- Create workspace modal -->
        <CreateWorkspaceModal
          :state="createWorkspaceModalState"
          @create:workspace="(payload) => app.workspace.create(payload)" />
      </slot>

      <!-- Popup command palette to add resources from anywhere -->
      <TheCommandPalette
        :eventBus="app.eventBus"
        :paletteState="paletteState"
        :workspaceStore="app.store.value!" />
    </main>
    <!-- Splash screen -->
    <main v-else>
      <SplashScreen />
    </main>
  </ScalarTeleportRoot>
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
