<script lang="ts">
export type AppProps = {
  /** The app state.
   */
  getAppState: () => AppState
  /** The command palette state.
   */
  getCommandPaletteState: () => ReturnType<typeof useCommandPaletteState>
  /** The file loader.
   * This is used to load files from the disk (for examole when you are on an Electron app).
   */
  fileLoader?: LoaderPlugin
}
</script>

<script setup lang="ts">
import { PostHogClientPlugin } from '@scalar/api-client/plugins/posthog'
import { ScalarHeaderButton } from '@scalar/components'
import { type LoaderPlugin } from '@scalar/json-magic/bundle'
import { requestScriptsPlugin } from '@scalar/pre-post-request-scripts/plugins'
import { computed, reactive } from 'vue'

import { ClientApp, type AppState } from '@/features/app'
import type { useCommandPaletteState } from '@/features/command-palette/hooks/use-command-palette-state'
import AppMenuItems from '@/features/header/AppMenuItems.vue'
import { ImportListener } from '@/features/import-listener'
import { deleteRegistryDocument } from '@/helpers/delete-registry-document'
import { deleteRegistryVersion } from '@/helpers/delete-registry-version'
import { fetchRegistryDocument } from '@/helpers/fetch-registry-document'
import { publishRegistryDocument } from '@/helpers/publish-registry-document'
import { publishRegistryVersion } from '@/helpers/publish-registry-version'
import { useAuth } from '@/hooks/use-auth'
import { useAuthHandlers } from '@/hooks/use-auth-handlers'
import { useRegistryDocuments } from '@/hooks/use-registry-documents'
import { useRegistryNamespaces } from '@/hooks/use-registry-namespaces'

const { getAppState, getCommandPaletteState, fileLoader } =
  defineProps<AppProps>()

const app = getAppState()
const { isLoggedIn } = useAuth()
const { handleLogin, handleRegister } = useAuthHandlers()
const {
  documents,
  isLoading: isDocumentsLoading,
  refetch: refetchRegistryDocuments,
} = useRegistryDocuments()
const { namespaces, isLoading: isNamespacesLoading } = useRegistryNamespaces()

/** Whether the app is running on electron */
const isDesktop = window.electron === true

//--------------------------------------------------
// Workspace handling
//--------------------------------------------------
/** Routes to the get-started page of the workspace identified by `id`. */
const setActiveWorkspaceById = (id?: string) => {
  if (!id) {
    return
  }
  app.workspace.navigateToWorkspaceGetStarted(id)
}

//--------------------------------------------------
// Navigation
//--------------------------------------------------
// Emits a navigation event to open the workspace settings page
const openSettings = () => {
  app.eventBus.emit('ui:navigate', {
    page: 'workspace',
    path: 'settings',
  })
}

/**
 * The create-workspace modal lives inside `ClientApp`, but the mobile
 * menu rendering its trigger lives in this outer shell. We bridge the
 * two through the workspace event bus rather than reaching into
 * `ClientApp` via a template ref, which keeps the inner component's
 * internals private and matches the existing `ui:open:*` pattern.
 */
const handleCreateWorkspaceFromMenu = () => {
  app.eventBus.emit('ui:open:create-workspace')
}

const navigateToDocument = (slug: string) => {
  app.eventBus.emit('ui:navigate', {
    page: 'document',
    path: 'overview',
    documentSlug: slug,
  })
}

const plugins = [
  requestScriptsPlugin(),
  PostHogClientPlugin({
    apiKey: 'phc_3elIjSOvGOo5aEwg6krzIY9IcQiRubsBtglOXsQ4Uu4',
    apiHost: 'https://magic.scalar.com',
    uiHost: 'https://us.posthog.com',
  }),
]

//--------------------------------------------------
// Registry
//--------------------------------------------------

/**
 * Registry documents surfaced to the client app sidebar. We forward the
 * query's pending state so the sidebar can render skeleton placeholders
 * until the first fetch resolves, while still streaming any cached
 * documents that are already in hand.
 */
const registryDocuments = computed(() => {
  const mapped = documents.value.map(
    ({ namespace, slug, title, versions }) => ({
      namespace,
      slug,
      title: title ?? 'Default Title',
      versions: versions.map(({ version, versionSha }) => ({
        version,
        commitHash: versionSha,
      })),
    }),
  )

  return isDocumentsLoading.value
    ? ({ status: 'loading', documents: mapped } as const)
    : ({ status: 'success', documents: mapped } as const)
})

/**
 * Namespaces the current team can publish documents into. Mirrors the
 * loading-aware shape of `registryDocuments` so the publish modal can
 * render its skeleton row until the namespaces list resolves.
 */
const registryNamespaces = computed(() => {
  const mapped = namespaces.value.map((namespace) => ({ namespace }))

  return isNamespacesLoading.value
    ? ({ status: 'loading', namespaces: mapped } as const)
    : ({ status: 'success', namespaces: mapped } as const)
})

/**
 * Registry adapter passed to the API client. We wrap it in `reactive` so
 * the inner refs (`documents`, `namespaces`) are auto-unwrapped on access
 * - the adapter shape expects the raw loading-aware state, but we still
 * want the values to update as the underlying queries refetch.
 */
/**
 * Forces the registry-documents query to refetch and waits for the new
 * listing. Used by the API client's sync flow after a `CONFLICT` push so
 * the next `computeVersionStatus` pass sees the new upstream commit
 * hash and flips the Pull button on naturally.
 */
const refreshRegistryDocuments = async (): Promise<void> => {
  await refetchRegistryDocuments()
}

const registry = reactive({
  documents: registryDocuments,
  namespaces: registryNamespaces,
  fetchDocument: fetchRegistryDocument,
  publishDocument: publishRegistryDocument,
  publishVersion: publishRegistryVersion,
  deleteDocument: deleteRegistryDocument,
  deleteVersion: deleteRegistryVersion,
  refreshDocuments: refreshRegistryDocuments,
})
</script>
<template>
  <ImportListener
    :activeWorkspace="app.workspace.activeWorkspace.value"
    :darkMode="app.isDarkMode.value"
    :fileLoader="fileLoader"
    :isOnlyOneWorkspace="app.workspace.filteredWorkspaceList.value.length <= 1"
    :workspaceGroups="app.workspace.workspaceGroups.value"
    :workspaceStore="app.store.value"
    @create:workspace="(payload) => app.workspace.create(payload)"
    @navigateToDocument="navigateToDocument"
    @set:workspace="(id) => setActiveWorkspaceById(id)">
    <ClientApp
      :getAppState
      :getCommandPaletteState
      :layout="isDesktop ? 'desktop' : 'web'"
      :plugins="plugins"
      :registry>
      <template #header-menu-items>
        <AppMenuItems
          :app="app"
          @createWorkspace="handleCreateWorkspaceFromMenu"
          @login="handleLogin"
          @openSettings="openSettings" />
      </template>
      <template
        v-if="!isLoggedIn"
        #header-end>
        <!--
          The mobile top bar is space-constrained, so we hide the secondary
          "Log in" affordance on small screens - it stays reachable from the
          menu - and keep only the primary "Register" call to action and
          the document save / discard cluster on the bar itself.
        -->
        <ScalarHeaderButton
          class="max-md:hidden"
          @click.prevent="handleLogin">
          Log in
        </ScalarHeaderButton>
        <ScalarHeaderButton
          cta
          @click.prevent="handleRegister">
          Register
        </ScalarHeaderButton>
      </template>
    </ClientApp>
  </ImportListener>
</template>
