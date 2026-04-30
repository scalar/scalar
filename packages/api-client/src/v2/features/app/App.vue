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
  ScalarButton,
  ScalarTeleportRoot,
  useModal,
  type ModalState,
} from '@scalar/components'
import {
  ScalarIconArrowCounterClockwise,
  ScalarIconCloudArrowDown,
  ScalarIconCloudArrowUp,
  ScalarIconFloppyDisk,
} from '@scalar/icons'
import type { ClientPlugin } from '@scalar/oas-utils/helpers'
import { ScalarToasts } from '@scalar/use-toasts'
import { extensions } from '@scalar/workspace-store/schemas/extensions'
import { computed, onBeforeUnmount, toValue, watch } from 'vue'
import { RouterView } from 'vue-router'

import { SidebarToggle } from '@/v2/components/sidebar'
import AppHeader from '@/v2/features/app/components/AppHeader.vue'
import AppSidebar from '@/v2/features/app/components/AppSidebar.vue'
import CreateWorkspaceModal from '@/v2/features/app/components/CreateWorkspaceModal.vue'
import DocumentBreadcrumb from '@/v2/features/app/components/DocumentBreadcrumb.vue'
import SplashScreen from '@/v2/features/app/components/SplashScreen.vue'
import type { RouteProps } from '@/v2/features/app/helpers/routes'
import { useActiveDocumentVersion } from '@/v2/features/app/hooks/use-active-document-version'
import { useDocumentWatcher } from '@/v2/features/app/hooks/use-document-watcher'
import type { CommandPaletteState } from '@/v2/features/command-palette/hooks/use-command-palette-state'
import TheCommandPalette from '@/v2/features/command-palette/TheCommandPalette.vue'
import { useMonacoEditorConfiguration } from '@/v2/features/editor'
import { useColorMode } from '@/v2/hooks/use-color-mode'
import { useGlobalHotKeys } from '@/v2/hooks/use-global-hot-keys'
import type { RegistryAdapter, RegistryDocumentsState } from '@/v2/types/configuration'
import type { ClientLayout } from '@/v2/types/layout'

import type { AppState } from './app-state'
import DesktopTabs from './components/DesktopTabs.vue'

const {
  layout,
  plugins = [],
  getAppState,
  getCommandPaletteState,
  registry,
} = defineProps<{
  layout: Exclude<ClientLayout, 'modal'>
  plugins?: ClientPlugin[]
  getAppState: () => AppState
  getCommandPaletteState: () => CommandPaletteState
  /**
   * Adapter wiring the API client up to an external registry (Scalar
   * Cloud or a custom self-hosted setup). The adapter itself is optional
   * - omit it to opt out of registry features entirely - but every
   * field on it (`documents`, `fetchDocument`, `publishDocument`) is
   * required when provided so the client can rely on the full surface.
   */
  registry?: RegistryAdapter
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
   * Slot for customizing the create workspace modal.
   * This slot is used to render custom actions or components within the create workspace modal.
   */
  'create-workspace'?: (payload: { state: ModalState }) => unknown
  /**
   * Replaces the Scalar logo inside the header menu button. Typically used by
   * team-aware consumers (e.g. Scalar Cloud) to render a team avatar so the
   * left-most chrome reads as "this team's workspace" rather than the
   * generic Scalar wordmark.
   *
   * Receives `isTeamWorkspace` so consumers can opt into rendering a team
   * image only when the active workspace actually belongs to a team, while
   * keeping the default Scalar logo for local workspaces.
   */
  'header-logo'?: (payload: { isTeamWorkspace: boolean }) => unknown
  /**
   * Slot for customizing the menu items section of the app header.
   * Defaults to a workspace picker bound to the current app state. Overriding this slot
   * replaces the default picker entirely, so the consumer is responsible for rendering
   * any workspace switcher (or other menu content) they need.
   */
  'header-menu-items'?: () => unknown
  /**
   * Slot rendered at the trailing edge of the header, immediately before the
   * `header-end` slot. Use this for context-specific action buttons (for
   * example a "Save" button) so they sit next to the document chrome rather
   * than getting mixed in with the user / account controls in `header-end`.
   *
   * When both this slot and `header-end` are provided, a vertical divider is
   * inserted between them so the two groups read as visually distinct
   * clusters.
   */
  'header-actions'?: () => unknown
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

const createWorkspaceModalState = useModal()

/**
 * Resolves the registry meta and sync status for the active document.
 * The breadcrumb already drives this composable for its version picker;
 * we reuse it here so the header action cluster reads from exactly the
 * same `pull` / `push` / `synced` source of truth that the picker rows
 * and the inline status icons do.
 */
const { activeRegistryMeta, activeVersion } = useActiveDocumentVersion({
  app,
  registryDocuments: () => registryDocuments.value,
})

/** Whether the route currently resolves to a document. */
const hasActiveDocument = computed(() =>
  Boolean(app.activeEntities.documentSlug.value),
)

/** Whether the active document has unsaved local edits. */
const isActiveDocumentDirty = computed(
  () =>
    app.store.value?.workspace.activeDocument?.['x-scalar-is-dirty'] === true,
)

/**
 * Save / Revert cluster for local workspaces. Mirrors the save-prompt UX
 * of the document collection page: Save is always mounted while a doc is
 * active and gets disabled when there is nothing to persist; Revert only
 * shows up while the document is dirty.
 */
const showLocalSaveActions = computed(
  () => !app.workspace.isTeamWorkspace.value && hasActiveDocument.value,
)

/**
 * Pull / Push cluster for team workspace documents that already have a
 * registry relationship. The same `Revert` button as local workspaces
 * sits in front of it so a dirty document can be discarded without going
 * through the registry round-trip.
 */
const showTeamSyncActions = computed(
  () =>
    app.workspace.isTeamWorkspace.value &&
    hasActiveDocument.value &&
    Boolean(activeRegistryMeta.value),
)

/**
 * Publish cluster for team workspace documents that do not yet have a
 * registry entry. We surface it as a single "Publish" affordance instead
 * of the Pull / Push pair because there is no upstream version to sync
 * against - the action is simply "create the registry version".
 */
const showTeamPublishAction = computed(
  () =>
    app.workspace.isTeamWorkspace.value &&
    hasActiveDocument.value &&
    !activeRegistryMeta.value,
)

/**
 * Pull is enabled while the registry advertises a different commit hash
 * than the local one, regardless of whether the local document is dirty.
 * `conflict` is treated the same as `pull` here so the user can always
 * reach the conflict-resolution flow from the header.
 */
const canPullActiveDocument = computed(() => {
  const status = activeVersion.value?.status
  return status === 'pull' || status === 'conflict'
})

/**
 * Push is only enabled when the document is dirty *and* there are no
 * upstream changes - mirroring `computeVersionStatus`'s `'push'` outcome,
 * which already encodes that combination. Pushing while upstream has
 * moved on would clobber the registry version, so we lock the button
 * until the user has pulled / resolved.
 */
const canPushActiveDocument = computed(
  () => activeVersion.value?.status === 'push',
)

/**
 * Truthy when *any* trailing action cluster is renderable. Used to gate
 * the leading edge of the header end slot (and the divider against the
 * consumer-provided `header-end` cluster) without re-deriving the same
 * conditions in the template.
 */
const hasHeaderActionCluster = computed(
  () =>
    showLocalSaveActions.value ||
    showTeamSyncActions.value ||
    showTeamPublishAction.value,
)

const handleHeaderSaveDocument = async () => {
  const slug = app.activeEntities.documentSlug.value
  if (!slug || !app.store.value) {
    return
  }
  await app.store.value.saveDocument(slug)
}

const handleHeaderRevertDocument = async () => {
  const slug = app.activeEntities.documentSlug.value
  if (!slug || !app.store.value) {
    return
  }
  await app.store.value.revertDocumentChanges(slug)
}

/**
 * Placeholder for the registry pull flow. The wiring (workspace store
 * call, conflict handling, toast feedback) will be implemented in a
 * follow-up - this component just owns the affordance so the header
 * surface can ship in parallel.
 */
const handleHeaderPullDocument = (): void => {
  // TODO: hook up to the registry pull flow.
}

/**
 * Placeholder for the registry push flow. The wiring will eventually
 * read the active document's `x-scalar-registry-meta` (namespace, slug,
 * version, commitHash) and call `registry?.publishVersion({ ... })`,
 * routing `CONFLICT` outcomes through the pull / merge UX. See
 * `handleHeaderPullDocument`.
 */
const handleHeaderPushDocument = (): void => {
  // TODO: hook up to `registry?.publishVersion` with the active commitHash.
}

/**
 * Placeholder for the "publish to registry" flow used when a team
 * workspace document has no registry entry yet. The actual UI - asking
 * the user for a namespace and slug, surfacing `CONFLICT` /
 * `FETCH_FAILED` / `UNAUTHORIZED` outcomes, etc - lands in a follow-up.
 * Once the user has confirmed the coordinates the handler is expected to
 * call `registry.publishDocument({ namespace, slug })` and react to the
 * returned `Result`.
 */
const handleHeaderPublishDocument = (): void => {
  // TODO: surface the publish modal, then call `registry?.publishDocument`.
}

/** Props to pass to the RouterView component. */
const routerViewProps = computed<RouteProps>(() => {
  return {
    documentSlug: app.activeEntities.documentSlug.value ?? '',
    document: app.store.value?.workspace.activeDocument ?? null,
    environment: app.environment.value,
    eventBus: app.eventBus,
    exampleName: app.activeEntities.exampleName.value,
    fetchRegistryDocument: registry?.fetchDocument,
    layout,
    method: app.activeEntities.method.value,
    path: app.activeEntities.path.value,
    workspaceStore: app.store.value!,
    activeWorkspace: app.workspace.activeWorkspace.value!,
    isTeamWorkspace: app.workspace.isTeamWorkspace.value,
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
          :menuTitle="app.workspace.isTeamWorkspace.value ? 'Team' : 'Local'"
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
            v-if="$slots['header-logo'] && app.workspace.isTeamWorkspace.value"
            #logo>
            <slot
              :isTeamWorkspace="app.workspace.isTeamWorkspace.value"
              name="header-logo" />
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
            <DocumentBreadcrumb
              :app="app"
              :fetchRegistryDocument="registry?.fetchDocument"
              :registryDocuments="registryDocuments"
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
              <!--
                Local workspace cluster: Save is always mounted while a
                document is active so the affordance does not jump around,
                and gets disabled when the document is clean. Revert only
                joins it once there is something to revert.
              -->
              <template v-if="showLocalSaveActions">
                <ScalarButton
                  v-if="isActiveDocumentDirty"
                  aria-label="Revert changes"
                  class="text-c-2 hover:text-c-1 size-6 shrink-0 p-0"
                  data-testid="app-header-revert-button"
                  size="xs"
                  type="button"
                  variant="ghost"
                  @click="handleHeaderRevertDocument">
                  <ScalarIconArrowCounterClockwise
                    class="size-3.5"
                    size="sm"
                    thickness="1.5" />
                </ScalarButton>
                <ScalarButton
                  class="shrink-0 gap-1.5"
                  data-testid="app-header-save-button"
                  :disabled="!isActiveDocumentDirty"
                  size="xs"
                  type="button"
                  variant="solid"
                  @click="handleHeaderSaveDocument">
                  <ScalarIconFloppyDisk
                    class="size-3.5"
                    size="sm"
                    thickness="1.5" />
                  <span>Save</span>
                </ScalarButton>
              </template>
              <!--
                Team workspace cluster for registry-backed documents. The
                same Revert affordance as local workspaces sits in front of
                the Pull / Push pair so dirty edits can be discarded
                without going through the registry. Pull / Push enablement
                tracks the cached `VersionStatus` so only one of them is
                actionable at a time.
              -->
              <template v-if="showTeamSyncActions">
                <ScalarButton
                  v-if="isActiveDocumentDirty"
                  aria-label="Revert changes"
                  class="text-c-2 hover:text-c-1 size-6 shrink-0 p-0"
                  data-testid="app-header-revert-button"
                  size="xs"
                  type="button"
                  variant="ghost"
                  @click="handleHeaderRevertDocument">
                  <ScalarIconArrowCounterClockwise
                    class="size-3.5"
                    size="sm"
                    thickness="1.5" />
                </ScalarButton>
                <ScalarButton
                  class="shrink-0 gap-1.5"
                  data-testid="app-header-pull-button"
                  :disabled="!canPullActiveDocument"
                  size="xs"
                  type="button"
                  variant="solid"
                  @click="handleHeaderPullDocument">
                  <ScalarIconCloudArrowDown
                    class="size-3.5"
                    size="sm"
                    thickness="1.5" />
                  <span>Pull</span>
                </ScalarButton>
                <ScalarButton
                  class="shrink-0 gap-1.5"
                  data-testid="app-header-push-button"
                  :disabled="!canPushActiveDocument"
                  size="xs"
                  type="button"
                  variant="solid"
                  @click="handleHeaderPushDocument">
                  <ScalarIconCloudArrowUp
                    class="size-3.5"
                    size="sm"
                    thickness="1.5" />
                  <span>Push</span>
                </ScalarButton>
              </template>
              <!--
                Team workspace cluster for documents that have not been
                published yet. A single Publish button kicks off the
                first-time push to the registry; once that succeeds the
                document gets a registry meta and switches over to the
                Pull / Push cluster above on the next render.
              -->
              <ScalarButton
                v-if="showTeamPublishAction"
                class="shrink-0 gap-1.5"
                data-testid="app-header-publish-button"
                size="xs"
                type="button"
                variant="solid"
                @click="handleHeaderPublishDocument">
                <ScalarIconCloudArrowUp
                  class="size-3.5"
                  size="sm"
                  thickness="1.5" />
                <span>Publish</span>
              </ScalarButton>
              <slot
                v-if="$slots['header-actions']"
                name="header-actions" />
              <!--
                Vertical divider between the document-scoped action cluster
                (workspace-mode buttons + `header-actions`) and the trailing
                `header-end` cluster. Only rendered when both sides have
                content so single-cluster headers do not get an orphaned
                separator.
              -->
              <span
                v-if="
                  (hasHeaderActionCluster || $slots['header-actions']) &&
                  $slots['header-end']
                "
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
