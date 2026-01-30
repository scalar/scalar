<script lang="ts" setup>
import { useModal, type ScalarListboxOption } from '@scalar/components'
import { useToasts } from '@scalar/use-toasts'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { InMemoryWorkspace } from '@scalar/workspace-store/schemas/inmemory-workspace'
import { onMounted, ref } from 'vue'

import { generateUniqueSlug } from '@/v2/features/import/helpers/generate-unique-slug'
import { getUrlQueryParameter } from '@/v2/features/import/helpers/get-url-query-parameter'
import { importDocumentToWorkspace } from '@/v2/features/import/helpers/import-document-to-workspace'
import { loadDocumentFromSource } from '@/v2/features/import/helpers/load-document-from-source'

import DropEventListener from './components/DropEventListener.vue'
import ImportModal from './components/ImportModal.vue'

const { workspaceStore, workspaces } = defineProps<{
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
 * The import source (URL, file content, etc.)
 * This gets populated when the user pastes or drops content to import.
 */
const source = ref<string | null>(null)

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
  newSource: string,
  workspaceDocuments: Set<string>,
): Promise<void> => {
  if (!workspaceStore) {
    handleImportError('Workspace store is not available')
    return
  }

  const slug = await generateUniqueSlug(newSource, workspaceDocuments)

  if (!slug) {
    handleImportError(
      'Failed to generate a unique slug for the imported document',
    )
    return
  }

  await loadDocumentFromSource(workspaceStore, newSource, slug, false)
}

/**
 * Handles input from paste events or drop events.
 * If conditions allow, directly imports the document. Otherwise, shows the import modal.
 */
const handleInput = async (newSource: string): Promise<void> => {
  const workspaceDocuments = new Set(
    Object.keys(workspaceStore?.workspace.documents ?? {}),
  )
  const isWorkspaceEmpty = () => {
    const documents = workspaceDocuments
    const hasNoDocs = documents.size === 0
    const hasOnlyDraft = documents.size === 1 && documents.has('draft')

    return hasNoDocs || hasOnlyDraft
  }

  const shouldDirectImport =
    workspaces.length === 1 && workspaceStore !== null && isWorkspaceEmpty()

  if (shouldDirectImport) {
    await directImport(newSource, workspaceDocuments)
    return
  }

  source.value = newSource
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

  if (urlQueryParameter) {
    void handleInput(urlQueryParameter)
  }
})
</script>

<template>
  <!-- Import modal for workspace and document selection -->
  <ImportModal
    :activeWorkspace="activeWorkspace"
    :isLoading="workspaceStore === null"
    :modalState="modalState"
    :source="source"
    :workspaces="workspaces"
    @create:workspace="(payload) => emit('create:workspace', payload)"
    @import:document="handleImportDocument"
    @select:workspace="(id) => emit('select:workspace', id)" />

  <!-- Listens for drag and drop events -->
  <DropEventListener @input="(source) => handleInput(source)" />

  <!-- Default slot for wrapped content -->
  <slot />
</template>
