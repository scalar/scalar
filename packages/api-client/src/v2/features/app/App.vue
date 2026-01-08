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
import { getThemeStyles } from '@scalar/themes'
import { ScalarToasts } from '@scalar/use-toasts'
import { extensions } from '@scalar/workspace-store/schemas/extensions'
import { computed } from 'vue'
import { RouterView } from 'vue-router'

import CreateWorkspaceModal from '@/v2/features/app/components/CreateWorkspaceModal.vue'
import SplashScreen from '@/v2/features/app/components/SplashScreen.vue'
import type { RouteProps } from '@/v2/features/app/helpers/routes'
import { useDocumentWatcher } from '@/v2/features/app/hooks/use-document-watcher'
import TheCommandPalette from '@/v2/features/command-palette/components/TheCommandPalette.vue'
import type { ClientPlugin } from '@/v2/helpers/plugins'
import { useColorMode } from '@/v2/hooks/use-color-mode'
import { useGlobalHotKeys } from '@/v2/hooks/use-global-hot-keys'
import type { ClientLayout } from '@/v2/types/layout'

import { useAppState } from './app-state'
import AppSidebar from './components/AppSidebar.vue'
import DesktopTabs from './components/DesktopTabs.vue'
import WebTopNav from './components/WebTopNav.vue'

const { layout, plugins = [] } = defineProps<{
  layout: Exclude<ClientLayout, 'modal'>
  plugins?: ClientPlugin[]
}>()

const app = useAppState()

/** Expose workspace store to window for debugging purposes. */
if (typeof window !== 'undefined') {
  window.dataDumpWorkspace = () => app.store.value
  window.dumpAppState = () => app
}

/** Initialize color mode to ensure it is set on mount. */
useColorMode({ workspaceStore: app.store })

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

/** Handler for workspace navigation. */
const handleWorkspaceClick = () =>
  app.router.value?.push({
    name: 'workspace.environment',
  })

const createWorkspaceModalState = useModal()

/** Props to pass to the RouterView component. */
const routerViewProps = computed<RouteProps>(() => ({
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
  securitySchemes: app.document.value?.components?.securitySchemes ?? {},
}))

//
</script>

<template>
  <template
    v-if="
      app.store.value !== null &&
      app.workspace.activeWorkspace.value !== null &&
      !app.loading.value
    ">
    <div v-html="themeStyleTag" />
    <ScalarTeleportRoot>
      <!-- Toasts -->
      <ScalarToasts />

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
        :workspaces="app.workspace.workspaceList.value!"
        @create:workspace="createWorkspaceModalState.show()"
        @select:workspace="app.workspace.setId" />

      <!-- min-h-0 is required here for scrolling, do not remove it -->
      <main class="flex min-h-0 flex-1">
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
          :workspaces="app.workspace.workspaceList.value"
          @click:workspace="handleWorkspaceClick"
          @create:workspace="createWorkspaceModalState.show()"
          @select:workspace="app.workspace.setId"
          @selectItem="app.sidebar.handleSelectItem"
          @update:sidebarWidth="app.sidebar.handleSidebarWidthUpdate" />

        <!-- Create workspace modal -->
        <CreateWorkspaceModal
          :state="createWorkspaceModalState"
          @create:workspace="(payload) => app.workspace.create(payload)" />

        <!-- Popup command palette to add resources from anywhere -->
        <TheCommandPalette
          :eventBus="app.eventBus"
          :paletteState="app.commandPalette"
          :workspaceStore="app.store.value!" />

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
