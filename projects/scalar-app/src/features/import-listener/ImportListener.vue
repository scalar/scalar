<script lang="ts" setup>
import {
  useModal,
  type ScalarListboxOption,
  type WorkspaceGroup,
} from '@scalar/components'
import { type LoaderPlugin } from '@scalar/json-magic/bundle'
import { useToasts } from '@scalar/use-toasts'
import {
  createWorkspaceStore,
  type WorkspaceStore,
} from '@scalar/workspace-store/client'
import type { InMemoryWorkspace } from '@scalar/workspace-store/schemas/inmemory-workspace'
import { onMounted, ref } from 'vue'

import { loadDocumentFromSource } from '@/features/import-listener/helpers/load-document-from-source'
import {
  type CreateWorkspacePayload,
  type ImportEventData,
} from '@/features/import-listener/types'

import DropEventListener from './components/DropEventListener.vue'
import ImportModal from './components/ImportModal.vue'
import { getUrlQueryParameter } from './helpers/get-url-query-parameter'
import { importDocumentToWorkspace } from './helpers/import-document-to-workspace'
import { waitForCondition } from './helpers/wait-for-condition'

const { workspaceStore, darkMode, fileLoader, isOnlyOneWorkspace } =
  defineProps<{
    /**
     * Whether the user have only one workspace on the app.
     * This is used to determine if the import listener should direct import the document.
     */
    isOnlyOneWorkspace: boolean
    /**
     * The workspace store instance.
     * This is null during initialization until the store is ready.
     */
    workspaceStore: WorkspaceStore | null
    /**
     * The dark mode setting.
     * This is used to determine the color mode of the import modal.
     */
    darkMode: boolean
    /**
     * The file loader.
     * This is used to load files from the disk (for examole when you are on an Electron app).
     */
    fileLoader?: LoaderPlugin
    /** List of workspace groups */
    workspaceGroups: WorkspaceGroup[]
    /** The active workspace */
    activeWorkspace: ScalarListboxOption | null
  }>()

const emit = defineEmits<{
  /** Emitted when the user wants to navigate to a document. */
  (e: 'navigateToDocument', slug: string): void
  /** Emitted when the user wants to set the active workspace */
  (e: 'set:workspace', id: string): void
  /** Emitted when the user wants to create a new workspace */
  (e: 'create:workspace', payload: CreateWorkspacePayload): void
}>()

/**
 * Holds information about the import event,
 * such as the source (URL, file content, etc.) and an optional company logo.
 * This is set when the user provides input via url query parameter or drop.
 */
const data = ref<ImportEventData | null>(null)

const modalState = useModal()
const { toast } = useToasts()

/**
 * Shows an error toast and hides the modal.
 * Used to handle import failures consistently across handlers.
 */
const handleImportError = (errorMessage: string): void => {
  console.error(errorMessage)
  toast('Failed to import document', 'error')
  modalState.hide()
}

/**
 * Directly imports a document into the workspace without showing the modal.
 * This is used when there is only one workspace and it is empty.
 */
const directImport = async (
  importEventData: ImportEventData,
): Promise<void> => {
  toast('Importing document to the workspace...', 'info')

  if (!workspaceStore) {
    handleImportError('Workspace store is not available')
    return
  }

  // First load the document into a draft store
  // This is to get the title of the document so we can generate a unique slug for store
  const draftStore = createWorkspaceStore({
    fileLoader,
  })
  const success = await loadDocumentFromSource(
    draftStore,
    importEventData,
    'drafts',
    false,
  )

  if (!success) {
    handleImportError('Failed to import document')
    return
  }

  await handleImportDocument(draftStore.exportWorkspace(), 'drafts')
}

/**
 * Handles input from paste events or drop events.
 * If conditions allow, directly imports the document. Otherwise, shows the import modal.
 */
const handleInput = async (importEventData: ImportEventData): Promise<void> => {
  // Wait for the workspace store to be ready
  const isWorkspaceStoreReady = await waitForCondition(
    () => workspaceStore !== null,
  )

  const workspaceDocuments = new Set(
    Object.keys(workspaceStore?.workspace.documents ?? {}),
  )
  const isWorkspaceEmpty = () => {
    const documents = workspaceDocuments
    const hasNoDocs = documents.size === 0
    const hasOnlyDraft = documents.size === 1 && documents.has('drafts')

    return hasNoDocs || hasOnlyDraft
  }

  const shouldDirectImport = isOnlyOneWorkspace && isWorkspaceEmpty()

  // Only direct import if the workspace store is ready and the workspace is empty
  // Otherwise, show the modal
  if (shouldDirectImport && isWorkspaceStoreReady) {
    await directImport(importEventData)
    return
  }

  data.value = importEventData
  modalState.show()
}

/**
 * Handles the import document event from the modal.
 * Imports the document into the selected workspace and navigates to it on success.
 */
const handleImportDocument = async (
  workspaceState: InMemoryWorkspace,
  name: string,
): Promise<void> => {
  const result = await importDocumentToWorkspace({
    workspaceStore,
    workspaceState,
    name,
  })

  if (!result.ok) {
    handleImportError(result.error)
    return
  }

  emit('navigateToDocument', result.slug)
  modalState.hide()
}

/**
 * Checks URL query parameters for an import URL on mount.
 * If a URL is found, automatically triggers the import flow.
 */
onMounted(() => {
  const urlQueryParameter = getUrlQueryParameter('url')

  const logo = darkMode
    ? getUrlQueryParameter('dark_logo')
    : getUrlQueryParameter('light_logo')

  if (urlQueryParameter) {
    void handleInput({
      source: urlQueryParameter,
      type: 'url',
      companyLogo: logo,
    })
  }

  if (window.electron === true) {
    // Open… menu listener
    window.ipc.addEventListener('import-file', (filePath: string) => {
      void handleInput({ source: filePath, type: 'file' })
    })
  }
})
</script>

<template>
  <!-- Import modal for workspace and document selection -->
  <ImportModal
    :activeWorkspace="activeWorkspace"
    :fileLoader="fileLoader"
    :importEventData="data"
    :isLoading="workspaceStore === null"
    :modalState="modalState"
    :workspaceGroups="workspaceGroups"
    @create:workspace="(payload) => emit('create:workspace', payload)"
    @importDocument="handleImportDocument"
    @set:workspace="(id) => emit('set:workspace', id)" />

  <!-- Listens for drag and drop events -->
  <DropEventListener
    @input="({ source, type }) => handleInput({ source, type: type })" />

  <!-- Default slot for wrapped content -->
  <slot />
</template>
