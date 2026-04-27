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
  ScalarMenuWorkspacePicker,
  ScalarTeleportRoot,
  useModal,
  type ModalState,
} from '@scalar/components'
import type { ClientPlugin } from '@scalar/oas-utils/helpers'
import { ScalarToasts } from '@scalar/use-toasts'
import { extensions } from '@scalar/workspace-store/schemas/extensions'
import { isOpenApiDocument } from '@scalar/workspace-store/schemas/type-guards'
import { computed, onBeforeUnmount, toValue, watch } from 'vue'
import { RouterView } from 'vue-router'

import { SidebarToggle } from '@/v2/components/sidebar'
import AppHeader from '@/v2/features/app/components/AppHeader.vue'
import AppSidebar from '@/v2/features/app/components/AppSidebar.vue'
import CreateWorkspaceModal from '@/v2/features/app/components/CreateWorkspaceModal.vue'
import SplashScreen from '@/v2/features/app/components/SplashScreen.vue'
import type { RouteProps } from '@/v2/features/app/helpers/routes'
import { useDocumentWatcher } from '@/v2/features/app/hooks/use-document-watcher'
import type { RegistryDocumentsState } from '@/v2/features/app/hooks/use-sidebar-documents'
import type { CommandPaletteState } from '@/v2/features/command-palette/hooks/use-command-palette-state'
import TheCommandPalette from '@/v2/features/command-palette/TheCommandPalette.vue'
import { useMonacoEditorConfiguration } from '@/v2/features/editor'
import { useColorMode } from '@/v2/hooks/use-color-mode'
import { useGlobalHotKeys } from '@/v2/hooks/use-global-hot-keys'
import type { ImportDocumentFromRegistry } from '@/v2/types/configuration'
import type { ClientLayout } from '@/v2/types/layout'

import { type AppState } from './app-state'
import DesktopTabs from './components/DesktopTabs.vue'

const {
  layout,
  plugins = [],
  getAppState,
  getCommandPaletteState,
  fetchRegistryDocument,
  registryDocuments = { status: 'success', documents: [] },
} = defineProps<{
  layout: Exclude<ClientLayout, 'modal'>
  plugins?: ClientPlugin[]
  getAppState: () => AppState
  getCommandPaletteState: () => CommandPaletteState
  /** Fetches the full document from registry by meta. Passed through to route props for sync. */
  fetchRegistryDocument?: ImportDocumentFromRegistry
  /**
   * The list of all available registry documents, with a loading status so the
   * sidebar can render skeleton placeholders until the real list is ready.
   */
  registryDocuments?: RegistryDocumentsState
}>()

defineSlots<{
  /**
   * Slot for customizing the create workspace modal.
   * This slot is used to render custom actions or components within the create workspace modal.
   */
  'create-workspace'?: (payload: { state: ModalState }) => unknown
  /**
   * Slot for customizing the menu items section of the app header.
   * Defaults to a workspace picker bound to the current app state. Overriding this slot
   * replaces the default picker entirely, so the consumer is responsible for rendering
   * any workspace switcher (or other menu content) they need.
   */
  'header-menu-items'?: () => unknown
  /**
   * Slot for customizing the end section of the app header.
   * Typically used for user menus, action buttons, or other trailing controls.
   */
  'header-end'?: () => unknown
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

/** Call lifecycle hooks on plugins and subscribe to event bus events */
const pluginUnsubscribes: (() => void)[] = []

for (const plugin of plugins) {
  plugin.lifecycle?.onInit?.({ config: { telemetry: app.telemetry.value } })

  if (plugin.on) {
    for (const [event, handler] of Object.entries(plugin.on)) {
      pluginUnsubscribes.push(app.eventBus.on(event as any, handler as any))
    }
  }
}

/** Notify plugins when telemetry config changes */
watch(app.telemetry, () => {
  for (const plugin of plugins) {
    plugin.lifecycle?.onConfigChange?.({
      config: { telemetry: app.telemetry.value },
    })
  }
})

onBeforeUnmount(() => {
  for (const unsub of pluginUnsubscribes) {
    unsub()
  }
  for (const plugin of plugins) {
    plugin.lifecycle?.onDestroy?.()
  }
})

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

/** Color mode */
useColorMode({ workspaceStore: app.store })

const currentTheme = computed(() => app.theme.styles.value.themeStyles)
const isDarkMode = computed(() => app.isDarkMode.value)

/** Setup monaco editor configuration */
useMonacoEditorConfiguration({
  theme: currentTheme,
  darkMode: isDarkMode,
})

const navigateToWorkspaceOverview = (namespace?: string, slug?: string) => {
  app.eventBus.emit('ui:navigate', {
    page: 'workspace',
    path: 'environment',
    namespace,
    workspaceSlug: slug,
  })
}

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

  navigateToWorkspaceOverview(workspace.namespace, workspace.slug)
}

const createWorkspaceModalState = useModal()

/** Props to pass to the RouterView component. */
const routerViewProps = computed<RouteProps>(() => {
  // The API client is OpenAPI-native; AsyncAPI docs surface as `null` here so operation /
  // collection views render their empty state instead of trying to read `.paths`.
  const activeDocument = app.store.value?.workspace.activeDocument
  return {
    documentSlug: app.activeEntities.documentSlug.value ?? '',
    document: isOpenApiDocument(activeDocument) ? activeDocument : null,
    environment: app.environment.value,
    eventBus: app.eventBus,
    exampleName: app.activeEntities.exampleName.value,
    fetchRegistryDocument,
    layout,
    method: app.activeEntities.method.value,
    path: app.activeEntities.path.value,
    workspaceStore: app.store.value!,
    activeWorkspace: app.workspace.activeWorkspace.value!,
    plugins,
    isDarkMode: app.isDarkMode.value,
    currentTheme: app.theme.styles.value.themeStyles,
    customThemes: toValue(app.theme.customThemes),
    telemetry: app.telemetry.value,
    onUpdateTelemetry: (value: boolean) => {
      app.telemetry.value = value
    },
    options: app.options,
  }
})
</script>

<template>
  <ScalarTeleportRoot>
    <!-- Theme style tag -->
    <div v-html="app.theme.themeStyleTag.value" />

    <!-- Toasts -->
    <ScalarToasts />

    <!-- Main content -->
    <main
      v-if="
        app.store.value !== null &&
        app.workspace.activeWorkspace.value !== null &&
        !app.loading.value
      ">
      <div class="relative flex h-dvh w-dvw flex-col">
        <SidebarToggle
          v-model="app.sidebar.isOpen.value"
          class="absolute z-60 md:hidden"
          :class="layout === 'desktop' ? 'top-14 left-4' : 'top-4 left-4'" />
        <AppHeader
          @navigate:to:settings="
            app.eventBus.emit('ui:navigate', {
              page: 'workspace',
              path: 'settings',
            })
          ">
          <template #menuItems>
            <slot name="header-menu-items">
              <ScalarMenuWorkspacePicker
                :modelValue="app.workspace.activeWorkspace.value?.id"
                :workspaceOptions="app.workspace.workspaceGroups.value"
                @createWorkspace="createWorkspaceModalState.show()"
                @update:modelValue="(value) => setActiveWorkspace(value)" />
            </slot>
          </template>
          <template #end>
            <slot name="header-end" />
          </template>
        </AppHeader>
        <div class="flex min-h-0 flex-1 flex-row">
          <!-- App sidebar -->
          <AppSidebar
            :app="app"
            :fetchRegistryDocument="fetchRegistryDocument"
            :registryDocuments="registryDocuments"
            :sidebarWidth="app.sidebar.width.value"
            @update:sidebarWidth="app.sidebar.handleSidebarWidthUpdate" />

          <div class="flex min-h-0 flex-1 flex-col">
            <!-- App Tabs -->
            <DesktopTabs
              v-if="layout === 'desktop'"
              :activeTabIndex="app.tabs.activeTabIndex.value"
              :eventBus="app.eventBus"
              :tabs="app.tabs.state.value" />

            <!-- Router view min-h-0 is required for scrolling, do not remove it -->
            <div class="bg-b-1 relative min-h-0 flex-1">
              <RouterView v-bind="routerViewProps" />
            </div>
          </div>
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
  position: relative;
  background-color: var(--scalar-background-2);
}
.dark-mode #scalar-client {
  background-color: color-mix(in srgb, var(--scalar-background-1) 65%, black);
}
</style>
