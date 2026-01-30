<script lang="ts" setup>
import { useModal, type ScalarListboxOption } from '@scalar/components'
import { useToasts } from '@scalar/use-toasts'
import {
  createWorkspaceStore,
  type WorkspaceStore,
} from '@scalar/workspace-store/client'
import type { InMemoryWorkspace } from '@scalar/workspace-store/schemas/inmemory-workspace'
import { onMounted, ref } from 'vue'

import { getUrlQueryParameter } from '@/v2/features/import-listener/helpers/get-url-query-parameter'
import { importDocumentToWorkspace } from '@/v2/features/import-listener/helpers/import-document-to-workspace'
import { loadDocumentFromSource } from '@/v2/features/import-listener/helpers/load-document-from-source'
import { waitForCondition } from '@/v2/features/import-listener/helpers/wait-for-condition'

import DropEventListener from './components/DropEventListener.vue'
import ImportModal from './components/ImportModal.vue'

const { workspaceStore, workspaces, darkMode } = defineProps<{
  /**
   * The workspace store instance.
   * This is null during initialization until the store is ready.
   */
  workspaceStore: WorkspaceStore | null
  /**
   * The currently active workspace.
   * This represents the workspace that the user is currently working in.
   */
  activeWorkspace: { id: string; label: string } | null
  /**
   * The list of all available workspaces.
   * Used to render options for workspace switching and selection.
   */
  workspaces: ScalarListboxOption[]
  /**
   * The dark mode setting.
   * This is used to determine the color mode of the import modal.
   */
  darkMode: boolean
}>()

const emit = defineEmits<{
  /** Emitted when the user wants to navigate to a document. */
  (e: 'navigateTo:document', slug: string): void
  /** Emitted when the user selects a workspace. */
  (e: 'select:workspace', id?: string): void
  /** Emitted when the user wants to create a new workspace. */
  (e: 'create:workspace', payload: { name: string }): void
}>()

/**
 * Holds information about the import event,
 * such as the source (URL, file content, etc.) and an optional company logo.
 * This is set when the user provides input via url query parameter or drop.
 */
const data = ref<{
  source: string
  companyLogo: string | null
} | null>(null)

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
const directImport = async (newSource: string): Promise<void> => {
  toast('Importing document to the workspace...', 'info')

  if (!workspaceStore) {
    handleImportError('Workspace store is not available')
    return
  }

  // First load the document into a draft store
  // This is to get the title of the document so we can generate a unique slug for store
  const draftStore = createWorkspaceStore()
  const success = await loadDocumentFromSource(
    draftStore,
    newSource,
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
const handleInput = async (
  newSource: string,
  newCompanyLogo?: string | null,
): Promise<void> => {
  // Wait for the workspace store to be ready
  await waitForCondition(() => workspaceStore !== null)

  const workspaceDocuments = new Set(
    Object.keys(workspaceStore?.workspace.documents ?? {}),
  )
  const isWorkspaceEmpty = () => {
    const documents = workspaceDocuments
    const hasNoDocs = documents.size === 0
    const hasOnlyDraft = documents.size === 1 && documents.has('drafts')

    return hasNoDocs || hasOnlyDraft
  }

  const shouldDirectImport = workspaces.length === 1 && isWorkspaceEmpty()

  if (shouldDirectImport) {
    await directImport(newSource)
    return
  }

  data.value = {
    source: newSource,
    companyLogo: newCompanyLogo ?? null,
  }
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

  emit('navigateTo:document', result.slug)
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
    void handleInput(urlQueryParameter, logo ? decodeURIComponent(logo) : null)
  }
})
</script>

<template>
  <!-- Import modal for workspace and document selection -->
  <ImportModal
    :activeWorkspace="activeWorkspace"
    :companyLogo="data?.companyLogo || null"
    :isLoading="workspaceStore === null"
    :modalState="modalState"
    :source="data?.source || null"
    :workspaces="workspaces"
    @create:workspace="(payload) => emit('create:workspace', payload)"
    @import:document="handleImportDocument"
    @select:workspace="(id) => emit('select:workspace', id)" />

  <!-- Listens for drag and drop events -->
  <DropEventListener @input="handleInput" />

  <!-- Default slot for wrapped content -->
  <slot />
</template>
