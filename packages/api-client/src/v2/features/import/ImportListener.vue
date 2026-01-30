<script lang="ts" setup>
import { useModal } from '@scalar/components'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { generateUniqueValue } from '@scalar/workspace-store/helpers/generate-unique-value'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas'
import type { InMemoryWorkspace } from '@scalar/workspace-store/schemas/inmemory-workspace'
import { onMounted, ref } from 'vue'

import { slugify } from '@/v2/helpers/slugify'

import DropEventListener from './components/DropEventListener.vue'
import ImportModal from './components/ImportModal.vue'

const { workspaceStore } = defineProps<{
  /** The workspace store */
  workspaceStore: WorkspaceStore
}>()

const emit = defineEmits<{
  (e: 'navigateTo:document', slug: string): void
}>()

const slots = defineSlots<{
  default(): unknown
}>()

/** Source to import from */
const source = ref<string | null>(null)

const modalState = useModal()

const generateUniqueSlug = async (
  document: WorkspaceDocument,
  currentDocuments: Set<string>,
) => {
  const name = document.info.title ?? 'default'

  return await generateUniqueValue({
    defaultValue: name,
    validation: (value) => !currentDocuments.has(value),
    maxRetries: 100,
    transformation: slugify,
  })
}

/** Receive data from the paste event listener */
const handleInput = (newSource: string) => {
  source.value = newSource
  modalState.show()
}

const handleImportDocument = async (
  workspaceState: InMemoryWorkspace,
  name: string,
) => {
  const importingDocument = workspaceState.documents[name]

  if (!importingDocument) {
    console.error('Importing document not found in workspace state:', name)
    return
  }

  const currentDocuments = new Set(
    Object.keys(workspaceStore.workspace.documents),
  )

  const slug = await generateUniqueSlug(importingDocument, currentDocuments)

  if (!slug) {
    console.error(
      'Failed to generate a unique slug for the importing document:',
      name,
    )
    return
  }

  // Load the workspace state into the store
  workspaceStore.loadWorkspace({
    meta: workspaceState.meta,
    documents: {
      [slug]: importingDocument,
    },
    intermediateDocuments: {
      [slug]: workspaceState.intermediateDocuments[name] ?? {},
    },
    originalDocuments: {
      [slug]: workspaceState.originalDocuments[name] ?? {},
    },
    overrides: {
      [slug]: workspaceState.overrides[name] ?? {},
    },
  })

  // Update the sidebar old internal slug
  workspaceStore.buildSidebar(slug)
  // Save the changes made to the document from rebuilding the sidebar
  await workspaceStore.saveDocument(slug)

  // Navigate to the new document
  emit('navigateTo:document', slug)

  // Close the modal
  modalState.hide()
}

const checkUrlQueryParameters = () => {
  const queryParameters = new URLSearchParams(window.location.search)

  const urlQueryParameter = queryParameters.get('url')

  if (urlQueryParameter) {
    handleInput(urlQueryParameter)
  }
}

// Check URL query parameters for 'url' and 'integration' values
onMounted(checkUrlQueryParameters)
</script>

<template>
  <!-- Modal -->
  <ImportModal
    :modalState="modalState"
    :source="source"
    @import:document="handleImportDocument" />

  <!-- Event listeners-->
  <DropEventListener @input="(source) => handleInput(source)" />
  <!-- <UrlQueryParameterChecker @input="handleInput" /> -->

  <!-- Wrapped content -->
  <slots.default />
</template>
