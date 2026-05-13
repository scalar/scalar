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
import { safeRun } from '@scalar/helpers/types/safe-run'
import { type LoaderPlugin } from '@scalar/json-magic/bundle'
import { requestScriptsPlugin } from '@scalar/pre-post-request-scripts/plugins'
import { computed, reactive } from 'vue'

import { ClientApp, type AppState } from '@/features/app'
import {
  DEFAULT_TEAM_WORKSPACE_NAME,
  DEFAULT_TEAM_WORKSPACE_SLUG,
} from '@/features/app/app-state'
import { filterWorkspacesByTeam } from '@/features/app/helpers/filter-workspaces'
import { groupWorkspacesByTeam } from '@/features/app/helpers/group-workspaces'
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
import { useTeams } from '@/hooks/use-teams'

const { getAppState, getCommandPaletteState, fileLoader } =
  defineProps<AppProps>()

const app = getAppState()
const { isLoggedIn } = useAuth()
const {
  currentTeam,
  currentTeamSlug,
  currentTeamUid,
  isLoading: isTeamsLoading,
  suspense: teamsSuspense,
} = useTeams()

const { handleLogin, handleRegister } = useAuthHandlers({
  // Lets go to the team workspace on login
  onAuthenticated: async () => {
    await teamsSuspense()
    await app.workspace.resumeOrGetStarted({
      teamUid: currentTeamUid.value,
      teamSlug: currentTeamSlug.value,
    })
  },
})

const {
  documents,
  isLoading: isDocumentsLoading,
  refetch: refetchRegistryDocuments,
} = useRegistryDocuments()
const { namespaces, isLoading: isNamespacesLoading } = useRegistryNamespaces()

/** Whether the app is running on electron */
const isDesktop = window.electron === true

//--------------------------------------------------
// Team
//--------------------------------------------------

/** Ensure we redirect to the team workspace on team change */
const handleTeamChange = async () =>
  await app.workspace.resumeOrGetStarted({
    teamUid: currentTeamUid.value,
    teamSlug: currentTeamSlug.value,
  })

//--------------------------------------------------
// Workspace handling
//--------------------------------------------------
/** Routes to the get-started page of the workspace identified by `id`. */
const setActiveWorkspaceById = (id?: string) => {
  if (!id) {
    return
  }
  app.workspace.navigateToWorkspaceGetStarted(id, currentTeamSlug.value)
}

const filteredWorkspaces = computed(() =>
  filterWorkspacesByTeam(
    app.workspace.workspaceList.value,
    currentTeamSlug.value,
  ),
)

/**
 * Groups workspaces into team and local categories for display in the workspace picker.
 * Team workspaces are shown first (when not on local team), followed by local workspaces.
 */
const workspaceGroups = computed(() =>
  groupWorkspacesByTeam(filteredWorkspaces.value, currentTeamSlug.value, {
    // Surface a fake default workspace for non-local teams so logged-in
    // users always see a team workspace entry in the picker. Clicking it
    // navigates to a normal workspace route; the route handler creates the
    // workspace on demand when it does not yet exist.
    placeholder: {
      slug: DEFAULT_TEAM_WORKSPACE_SLUG,
      label: DEFAULT_TEAM_WORKSPACE_NAME,
    },
  }),
)

//--------------------------------------------------
// Navigation/Routing
//--------------------------------------------------

/**
 * Waits for teams to finish loading, then forwards the route to
 * `handleRouteChange` with the resolved team context.
 *
 * The gate lives here (in `afterEach`) rather than in a `beforeEach`
 * because `afterEach` hooks fire even for the initial navigation that
 * is already in-flight when `app.mount()` runs `<script setup>`.
 * A `beforeEach` registered at this point would miss that first route
 * and `handleRouteChange` would see `currentTeamSlug` as `'local'`,
 * incorrectly bouncing team-workspace URLs to the local default.
 */
app.router.afterEach(async (to) => {
  if (isTeamsLoading.value) {
    await safeRun(() => teamsSuspense())
  }

  await app.handleRouteChange(to, {
    teamSlug: currentTeamSlug,
    teamUid: currentTeamUid,
    filteredWorkspaces: filteredWorkspaces,
  })
})

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
 * Forces the registry-documents query to refetch and waits for the new
 * listing. Used by the API client's sync flow after a `CONFLICT` push so
 * the next `computeVersionStatus` pass sees the new upstream commit
 * hash and flips the Pull button on naturally.
 */
const refreshRegistryDocuments = async (): Promise<void> => {
  await refetchRegistryDocuments()
}

/**
 * Registry adapter passed to the API client. We wrap it in `reactive` so
 * the inner refs (`documents`, `namespaces`) are auto-unwrapped on access
 * - the adapter shape expects the raw loading-aware state, but we still
 * want the values to update as the underlying queries refetch.
 */
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
    :isOnlyOneWorkspace="filteredWorkspaces.length <= 1"
    :workspaceGroups
    :workspaceStore="app.store.value"
    @create:workspace="(payload) => app.workspace.create(payload)"
    @navigateToDocument="navigateToDocument"
    @set:workspace="(id) => setActiveWorkspaceById(id)">
    <ClientApp
      :getAppState
      :getCommandPaletteState
      :layout="isDesktop ? 'desktop' : 'web'"
      :plugins="plugins"
      :registry
      :workspaceGroups
      @changed:team="handleTeamChange">
      <template #header-menu-items>
        <AppMenuItems
          :app="app"
          :workspaceGroups
          @createWorkspace="handleCreateWorkspaceFromMenu"
          @login="handleLogin"
          @openSettings="openSettings" />
      </template>

      <!-- Team Logo -->
      <template
        v-if="currentTeam?.imageUri"
        #header-logo>
        <img
          :alt="currentTeam.name"
          class="size-5 rounded"
          role="presentation"
          :src="currentTeam.imageUri" />
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
