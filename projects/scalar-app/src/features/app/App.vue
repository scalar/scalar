<script lang="ts">
/**
 * Main entry point for the API client for electron and web.
 *
 * This component handles all events and store business logic for the application.
 */
export default {}
</script>

<script setup lang="ts">
import { SidebarToggle } from '@scalar/api-client/components/sidebar'
import type { ClientLayout } from '@scalar/api-client/types'
import { useGlobalHotKeys } from '@scalar/api-client/v2/hooks'
import {
  ScalarModal,
  ScalarTeleportRoot,
  useModal,
  type WorkspaceGroup,
} from '@scalar/components'
import {
  subscribePluginEvents,
  type ClientPlugin,
} from '@scalar/oas-utils/helpers'
import { ScalarToasts } from '@scalar/use-toasts'
import { extensions } from '@scalar/workspace-store/schemas/extensions'
import { isOpenApiDocument } from '@scalar/workspace-store/schemas/type-guards'
import { computed, onBeforeUnmount, watch } from 'vue'
import { RouterView } from 'vue-router'

import AppHeader from '@/features/app/components/AppHeader.vue'
import AppHeaderActions from '@/features/app/components/AppHeaderActions.vue'
import AppSidebar from '@/features/app/components/AppSidebar.vue'
import CreateWorkspaceModal from '@/features/app/components/CreateWorkspaceModal.vue'
import DocumentBreadcrumb from '@/features/app/components/DocumentBreadcrumb.vue'
import PublishDocumentModal from '@/features/app/components/PublishDocumentModal.vue'
import SplashScreen from '@/features/app/components/SplashScreen.vue'
import SyncConflictResolutionEditor from '@/features/app/components/SyncConflictResolutionEditor.vue'
import type { RouteProps } from '@/features/app/helpers/routes'
import { useDocumentSync } from '@/features/app/hooks/use-document-sync'
import { useDocumentWatcher } from '@/features/app/hooks/use-document-watcher'
import type { CommandPaletteState } from '@/features/command-palette/hooks/use-command-palette-state'
import TheCommandPalette from '@/features/command-palette/TheCommandPalette.vue'
import { useMonacoEditorConfiguration } from '@/features/editor'
import { useAuth } from '@/hooks/use-auth'
import { useColorMode } from '@/hooks/use-color-mode'
import { useTeams } from '@/hooks/use-teams'
import { useThemes } from '@/hooks/use-themes'
import type {
  RegistryAdapter,
  RegistryDocumentsState,
} from '@/types/configuration'

import type { AppState } from './app-state'
import DesktopTabs from './components/DesktopTabs.vue'

const {
  layout,
  plugins = [],
  getAppState,
  getCommandPaletteState,
  registry,
  workspaceGroups,
} = defineProps<{
  layout: Exclude<ClientLayout, 'modal'>
  plugins?: ClientPlugin[]
  getAppState: () => AppState
  getCommandPaletteState: () => CommandPaletteState
  /**
   * Adapter wiring the API client up to an external registry (Scalar
   * Cloud or a custom self-hosted setup). The adapter itself is optional
   * - omit it to opt out of registry features entirely - but every
   * field on it (`documents`, `namespaces`, `fetchDocument`,
   * `publishDocument`, `publishVersion`) is required when provided so
   * the client can rely on the full surface.
   */
  registry?: RegistryAdapter
  workspaceGroups: WorkspaceGroup[]
}>()

const emit = defineEmits<{
  (e: 'changed:team'): void
}>()

/**
 * Reactive view of the registry documents list with a sane default for
 * setups that did not wire an adapter up. The sidebar and breadcrumb
 * read this getter so they keep rendering skeletons / empty states even
 * when the host application has not provided a `registry` prop.
 */
const registryDocuments = computed<RegistryDocumentsState>(
  () => registry?.documents ?? { status: 'success', documents: [] },
)

defineSlots<{
  /**
   * Replaces the Scalar logo inside the header menu button. Typically used by
   * team-aware consumers (e.g. Scalar Cloud) to render a team avatar so the
   * left-most chrome reads as "this team's workspace" rather than the
   * generic Scalar wordmark.
   */
  'header-logo'?: () => unknown
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

const app = getAppState()
const paletteState = getCommandPaletteState()

const { currentTeam } = useTeams()

/** Expose workspace store to window for debugging purposes. */
if (typeof window !== 'undefined') {
  window.dataDumpWorkspace = () => app.store.value
  window.dumpAppState = () => app
}

// Allow the plugins to hook into the eventBus
const pluginUnsubscribes: (() => void)[] = []

for (const plugin of plugins) {
  plugin.lifecycle?.onInit?.({ config: { telemetry: app.telemetry.value } })

  pluginUnsubscribes.push(subscribePluginEvents(app.eventBus, plugin))
}

/** Notify plugins when telemetry config changes */
watch(app.telemetry, () => {
  for (const plugin of plugins) {
    plugin.lifecycle?.onConfigChange?.({
      config: { telemetry: app.telemetry.value },
    })
  }
})

const { tokenData } = useAuth()

/** Notify logging in/out */
watch(tokenData, async (newTokenData, oldTokenData) => {
  if (newTokenData && !oldTokenData) {
    app.eventBus.emit('log:user-login', {
      uid: newTokenData.userUid,
      email: newTokenData.email,
      teamUid: newTokenData.teamUid,
    })
  } else if (!newTokenData && oldTokenData) {
    app.eventBus.emit('log:user-logout')
  }
})

onBeforeUnmount(() => {
  for (const unsubscribe of pluginUnsubscribes) {
    unsubscribe()
  }
  for (const plugin of plugins) {
    plugin.lifecycle?.onDestroy?.()
  }
  unsubscribeOpenCreateWorkspace()
  unsubscribeSaveLocalDocumentHotkey()
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

/** Theme — resolved from custom themes, user/team preference, and workspace store */
const { customThemes, themeStyles, themeStyleTag } = useThemes({
  store: app.store,
})

const currentTheme = computed(() => themeStyles.value.themeStyles)
const isDarkMode = computed(() => app.isDarkMode.value)

/** Setup monaco editor configuration */
useMonacoEditorConfiguration({
  theme: currentTheme,
  darkMode: isDarkMode,
})

const createWorkspaceModalState = useModal()

/**
 * Bridge for surfaces outside this component (for example the outer app
 * shell's mobile menu) that need to open the create-workspace modal. We
 * subscribe to a UI event instead of exposing an imperative method, so
 * callers stay decoupled from this component's internals.
 */
const unsubscribeOpenCreateWorkspace = app.eventBus.on(
  'ui:open:create-workspace',
  () => createWorkspaceModalState.show(),
)

/**
 * Owns the document-level Save / Revert / Pull / Push / Publish flow.
 * Keeping it in a dedicated hook leaves this component focused on
 * routing, layout, and slot composition.
 */
const {
  showLocalSaveActions,
  showTeamSyncActions,
  showTeamPublishAction,
  hasHeaderActionCluster,
  isActiveDocumentDirty,
  isOffline,
  canPullActiveDocument,
  canPushActiveDocument,
  publishDocumentModalState,
  syncConflictModalState,
  pendingPullState,
  publishDefaultSlug,
  publishDefaultVersion,
  registryNamespaces,
  handleSaveDocument,
  handleRevertDocument,
  handlePullDocument,
  handlePushDocument,
  handlePublishDocument,
  handlePublishDocumentSubmit,
  handleSyncConflictApplyChanges,
  handleSyncConflictModalClose,
} = useDocumentSync({
  app,
  registry,
  registryDocuments: () => registryDocuments.value,
})

/** Cmd/Ctrl+S matches the header Save control for local workspaces (see AppHeaderActions). */
const unsubscribeSaveLocalDocumentHotkey = app.eventBus.on(
  'ui:save:local-document',
  (payload) => {
    if (!showLocalSaveActions.value) {
      return
    }
    payload.event.preventDefault()
    if (!isActiveDocumentDirty.value) {
      return
    }
    void handleSaveDocument()
  },
)

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
    registry,
    layout,
    method: app.activeEntities.method.value,
    path: app.activeEntities.path.value,
    workspaceStore: app.store.value!,
    activeWorkspace: app.workspace.activeWorkspace.value!,
    isTeamWorkspace: app.workspace.isTeamWorkspace.value,
    plugins,
    isDarkMode: app.isDarkMode.value,
    currentTheme: themeStyles.value.themeStyles,
    customThemes: customThemes.value,
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
    <div v-html="themeStyleTag" />

    <!-- Toasts -->
    <ScalarToasts />

    <!-- Main content -->
    <main
      v-if="
        app.store.value !== null &&
        app.workspace.activeWorkspace.value !== null &&
        !app.loading.value
      ">
      <div
        class="relative flex h-dvh w-dvw flex-col"
        :style="{
          '--app-desktop-tabs-height': layout === 'desktop' ? '2.5rem' : '0px',
        }">
        <!--
          Sits in the same visual slot as the operation Header gutter (size-8).
          Offset = desktop tab strip (layout desktop only) + ScalarHeader (min-h-header)
          + OperationBlock outer p-2 + Header pt-2 (1rem total) so we clear app chrome.
          `--app-desktop-tabs-height` is set on this shell so the mobile sidebar inset
          matches (see AppSidebar).
        -->
        <SidebarToggle
          v-model="app.sidebar.isOpen.value"
          class="app-no-drag-region absolute top-[calc(var(--app-desktop-tabs-height)+var(--spacing-header,48px)+1rem)] left-4 z-60 md:hidden" />
        <!-- App Tabs -->
        <DesktopTabs
          v-if="layout === 'desktop'"
          :activeTabIndex="app.tabs.activeTabIndex.value"
          :eventBus="app.eventBus"
          :tabs="app.tabs.state.value" />
        <AppHeader
          :menuTitle="currentTeam?.name"
          @changed:team="emit('changed:team')"
          @navigate:to:settings="
            app.eventBus.emit('ui:navigate', {
              page: 'workspace',
              path: 'settings',
            })
          ">
          <!--
            Only forward the consumer-provided logo (typically a team
            avatar from Scalar Cloud) while the user is actually inside a
            team workspace. Outside of a team context the avatar would be
            misleading, so we omit the `#logo` template entirely and let
            `ScalarMenuButton` fall back to its default Scalar wordmark.
          -->
          <template
            v-if="$slots['header-logo']"
            #logo>
            <slot name="header-logo" />
          </template>
          <template #menuItems>
            <!--
              The workspace picker used to live here as a submenu. It is now
              surfaced inline in the breadcrumb so the user reaches it in a
              single click. Consumers that want extra menu rows can still
              inject them through the `header-menu-items` slot.
            -->
            <slot name="header-menu-items" />
          </template>
          <template #breadcrumb>
            <!--
              The full breadcrumb is rendered alongside the menu trigger on
              tablet and up. On mobile we collapse the entire top bar down to
              just the menu trigger and the trailing action cluster, and the
              workspace picker is reachable from inside the menu instead -
              keeping the small-screen header readable without losing the
              ability to switch workspaces.
            -->
            <DocumentBreadcrumb
              :app="app"
              class="max-md:hidden"
              :fetchRegistryDocument="registry?.fetchDocument"
              :registryDocuments="registryDocuments"
              :workspaceGroups
              @createWorkspace="createWorkspaceModalState.show()" />
          </template>
          <!--
            Only forward the trailing `#end` cluster when it has actual
            content. The action clusters and the consumer slots all gate
            independently, so we mirror those conditions on the wrapper to
            avoid mounting an empty cluster that would otherwise leak a
            stray divider.
          -->
          <template
            v-if="
              hasHeaderActionCluster ||
              $slots['header-actions'] ||
              $slots['header-end']
            "
            #end>
            <div class="flex items-center gap-2">
              <AppHeaderActions
                :canPullActiveDocument="canPullActiveDocument"
                :canPushActiveDocument="canPushActiveDocument"
                :isActiveDocumentDirty="isActiveDocumentDirty"
                :isOffline="isOffline"
                :showLocalSaveActions="showLocalSaveActions"
                :showTeamPublishAction="showTeamPublishAction"
                :showTeamSyncActions="showTeamSyncActions"
                @publish="handlePublishDocument"
                @pull="handlePullDocument"
                @push="handlePushDocument"
                @revert="handleRevertDocument"
                @save="handleSaveDocument" />
              <!--
                Vertical divider. Only renders when the action cluster
                actually has buttons in it - on a fresh document with no
                pending changes the cluster is empty, and a lone divider
                between the menu trigger and the consumer's `#header-end`
                slot would read as visual noise.
              -->
              <span
                v-if="$slots['header-end'] && hasHeaderActionCluster"
                aria-hidden="true"
                class="bg-border h-4 w-px shrink-0" />
              <slot
                v-if="$slots['header-end']"
                name="header-end" />
            </div>
          </template>
        </AppHeader>
        <div class="flex min-h-0 flex-1 flex-row">
          <!-- App sidebar -->
          <AppSidebar
            :app="app"
            :fetchRegistryDocument="registry?.fetchDocument"
            :registryDocuments="registryDocuments"
            :sidebarWidth="app.sidebar.width.value"
            @update:sidebarWidth="app.sidebar.handleSidebarWidthUpdate" />

          <!-- Router view min-h/w-0 is required for scrolling, do not remove it -->
          <div class="bg-b-1 relative min-h-0 min-w-0 flex-1">
            <RouterView v-bind="routerViewProps" />
          </div>
        </div>
      </div>
      <!-- Create workspace modal -->
      <CreateWorkspaceModal
        :state="createWorkspaceModalState"
        @create:workspace="(payload) => app.workspace.create(payload)" />

      <!--
        First-time publish modal. Only mounted when a registry adapter
        is wired up - without one there is nothing meaningful to send,
        and the modal would never be opened anyway.
      -->
      <PublishDocumentModal
        v-if="registry"
        :defaultSlug="publishDefaultSlug"
        :defaultVersion="publishDefaultVersion"
        :namespaces="registryNamespaces"
        :state="publishDocumentModalState"
        @submit="handlePublishDocumentSubmit" />
      <!--
        Three-way merge editor for the Pull flow. We mount it lazily on
        `pendingPullState` so the heavy Monaco editors only spin up when
        a pull actually has conflicts to walk through. The full-size
        layout mirrors `DocumentCollection.vue`'s sync modal so the
        editor has enough room to render the local / remote / result
        panes side-by-side.
      -->
      <ScalarModal
        v-if="pendingPullState"
        bodyClass="sync-conflict-modal-root flex h-dvh flex-col p-4"
        maxWidth="calc(100dvw - 32px)"
        size="full"
        :state="syncConflictModalState"
        @close="handleSyncConflictModalClose">
        <div class="flex h-full w-full flex-col gap-4 overflow-hidden">
          <SyncConflictResolutionEditor
            :baseDocument="pendingPullState.rebaseResult.originalDocument"
            :conflicts="pendingPullState.rebaseResult.conflicts"
            :resolvedDocument="pendingPullState.rebaseResult.resolvedDocument"
            @applyChanges="handleSyncConflictApplyChanges" />
        </div>
      </ScalarModal>
      <!-- Popup command palette to add resources from anywhere -->
      <TheCommandPalette
        :app="app"
        :eventBus="app.eventBus"
        :paletteState="paletteState"
        :registryDocuments="registryDocuments"
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

/*
 * The three-way merge editor needs the full viewport to fit its three
 * Monaco panes. `DocumentCollection.vue` ships the same override for
 * its in-page Sync modal, but the pull flow can run without that view
 * being mounted, so we duplicate the rule here to keep the modal
 * full-bleed.
 */
.full-size-styles:has(.sync-conflict-modal-root) {
  width: 100dvw !important;
  max-width: 100dvw !important;
  border-right: none !important;
}

.full-size-styles:has(.sync-conflict-modal-root)::after {
  display: none;
}
</style>
