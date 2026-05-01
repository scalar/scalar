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
import {
  type AppState,
  ClientApp,
  type useCommandPaletteState,
} from '@scalar/api-client/v2/features/app'
import { fetchRegistryDocument } from './helpers/fetch-registry-document'
import { PostHogClientPlugin } from '@scalar/api-client/plugins/posthog'
import { ScalarHeaderButton, useModal } from '@scalar/components'
import { useAuth } from '@/hooks/use-auth'
import { useToasts } from '@scalar/use-toasts'
import { computed, onMounted, ref, watch } from 'vue'
import { CreateWorkspaceModal } from '@scalar/api-client/app'
import { ImportListener } from '@/features/import-listener'
import { RebaseSyncModal } from '@/features/rebase-sync'
import { type LoaderPlugin } from '@scalar/json-magic/bundle'
import { loginUrl, registerUrl } from '@/helpers/auth/login-url'
import { isObject } from '@scalar/helpers/object/is-object'
import { requestScriptsPlugin } from '@scalar/pre-post-request-scripts/plugins'
import AppMenuItems from '@/features/header/AppMenuItems.vue'
import { useRegistryDocuments } from '@/hooks/use-registry-documents'
import { useCurrentUser } from '@/hooks/use-current-user'

const { getAppState, getCommandPaletteState, fileLoader } =
  defineProps<AppProps>()

const app = getAppState()
const { toast } = useToasts()
const { isLoggedIn, setTokens } = useAuth()
const { user } = useCurrentUser()
const { documents } = useRegistryDocuments()

/** Registry documents surfaced to the client app sidebar */
const registryDocuments = computed(
  () =>
    ({
      status: 'success',
      documents: documents.value.map(({ namespace, slug, title }) => ({
        namespace,
        slug,
        title: title ?? 'Default Title',
      })),
    }) as const,
)

/** Whether the app is running on electron */
const isDesktop = window.electron === true

//--------------------------------------------------
// Login
//--------------------------------------------------
async function handleLogin() {
  // If we're on the web version, redirect to the dashboard login
  if (!isDesktop) {
    window.location.href = loginUrl
    return
  }

  // For desktop/electron, use the exchange token flow
  const result = await window.api.getExchangeToken()
  if (!result) {
    toast('Unable to login. Please try again or contact support.', 'error', {
      timeout: 10000,
    })
  } else {
    toast('Logged in successfully', 'info')
    setTokens(result.accessToken, result.refreshToken)
  }

  return
}

//--------------------------------------------------
// Workspace handling
//--------------------------------------------------
/** Modal instance for creating a new workspace */
const createWorkspaceModal = useModal()

/** Handles the creation of a new workspace */
const handleCreateWorkspace = async (payload: {
  name: string
  namespace?: string
}) => {
  const result = await app.workspace.create({
    teamUid: user.value?.activeTeamId ?? undefined,
    namespace: isLoggedIn.value ? payload.namespace : undefined,
    slug: payload.name,
    name: payload.name,
  })

  if (!result) {
    return toast(
      'Unable to create workspace. Please try again or contact support.',
      'error',
      {
        timeout: 10000,
      },
    )
  }
}

const setActiveWorkspaceById = (id?: string) => {
  if (!id) {
    return
  }
  const workspace = app.workspace.filteredWorkspaceList.value?.find(
    (workspace) => workspace.id === id,
  )
  if (!workspace) {
    return
  }
  app.workspace.navigateToWorkspace(workspace.namespace, workspace.slug)
}

//--------------------------------------------------
// Rebase + Registry sync flow

/** Rebase sync modal – shown when a registry-imported document is rebased */
const rebaseSyncModal = useModal()
const rebaseSyncPayload = ref<{
  registryMeta: { namespace: string; slug: string }
  documentTitle: string
  currentVersion: string
  documentContent: string
  documentName: string
} | null>(null)

/** Handle the completion of a rebase document (opens the sync modal) */
function handleRebaseDocumentComplete({
  meta: { documentName },
}: {
  meta: { documentName: string }
}) {
  const workspaceStore = app.store.value
  const registryMeta =
    workspaceStore?.workspace.documents[documentName]?.[
      'x-scalar-registry-meta'
    ]
  if (!registryMeta) return

  const documentContent = workspaceStore?.getIntermediateDocument(documentName)
  if (!documentContent) return

  const getDocumentInfo = (document: Record<string, unknown>) => {
    if (!isObject(document.info)) return { title: 'Untitled', version: '1.0.0' }
    const title =
      typeof document.info.title === 'string' ? document.info.title : 'Untitled'
    const version =
      typeof document.info.version === 'string'
        ? document.info.version
        : '1.0.0'

    return {
      title,
      version,
    }
  }

  const documentInfo = getDocumentInfo(documentContent)

  rebaseSyncPayload.value = {
    registryMeta,
    documentTitle: documentInfo.title,
    currentVersion: documentInfo.version,
    documentContent: JSON.stringify(documentContent, null, 2),
    documentName,
  }
  rebaseSyncModal.show()
}

onMounted(() => {
  app.eventBus.on(
    'hooks:on:rebase:document:complete',
    handleRebaseDocumentComplete,
  )
})

//--------------------------------------------------
// Watchers
//--------------------------------------------------

/** Sync teamUid in activeEntities whenever team uid or login state changes */
watch([() => user.value?.activeTeamId], ([teamUid]) => {
  app.activeEntities.setTeamUid(teamUid ?? 'local')
})

// Emits a navigation event to open the workspace settings page
const openSettings = () => {
  app.eventBus.emit('ui:navigate', {
    page: 'workspace',
    path: 'settings',
  })
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
</script>
<template>
  <RebaseSyncModal
    v-if="rebaseSyncPayload && app.store.value"
    :currentVersion="rebaseSyncPayload.currentVersion"
    :documentContent="rebaseSyncPayload.documentContent"
    :documentName="rebaseSyncPayload.documentName"
    :documentTitle="rebaseSyncPayload.documentTitle"
    :registryMeta="rebaseSyncPayload.registryMeta"
    :state="rebaseSyncModal"
    :workspaceStore="app.store.value"
    @close="rebaseSyncPayload = null" />
  <ImportListener
    :activeWorkspace="app.workspace.activeWorkspace.value"
    :darkMode="app.isDarkMode.value"
    :fileLoader="fileLoader"
    :isOnlyOneWorkspace="app.workspace.filteredWorkspaceList.value.length <= 1"
    :workspaceGroups="app.workspace.workspaceGroups.value"
    :workspaceStore="app.store.value"
    @create:workspace="(payload) => handleCreateWorkspace(payload)"
    @navigateToDocument="navigateToDocument"
    @set:workspace="(id) => setActiveWorkspaceById(id)">
    <ClientApp
      :fetchRegistryDocument
      :getAppState
      :getCommandPaletteState
      :layout="isDesktop ? 'desktop' : 'web'"
      :plugins="plugins"
      :registryDocuments>
      <template #create-workspace>
        <CreateWorkspaceModal
          :state="createWorkspaceModal"
          @create:workspace="(payload) => handleCreateWorkspace(payload)" />
      </template>
      <template #header-menu-items>
        <AppMenuItems
          :activeWorkspaceId="app.workspace.activeWorkspace.value?.id"
          :workspaceGroups="app.workspace.workspaceGroups.value"
          @createWorkspace="createWorkspaceModal.show()"
          @login="handleLogin"
          @openSettings="openSettings"
          @setWorkspace="setActiveWorkspaceById" />
      </template>
      <template #header-end>
        <ScalarHeaderButton
          is="a"
          v-if="!isLoggedIn"
          :href="loginUrl">
          Log in
        </ScalarHeaderButton>
        <ScalarHeaderButton
          is="a"
          v-if="!isLoggedIn"
          cta
          :href="registerUrl">
          Register
        </ScalarHeaderButton>
      </template>
    </ClientApp>
  </ImportListener>
</template>
