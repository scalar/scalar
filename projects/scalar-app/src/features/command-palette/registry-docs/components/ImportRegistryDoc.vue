<script setup lang="ts">
import { CommandActionForm } from '@scalar/api-client/v2/features/app'
import { useToasts } from '@scalar/use-toasts'
import { type WorkspaceStore } from '@scalar/workspace-store/client'
import { type WorkspaceEventBus } from '@scalar/workspace-store/events'

import { generateUniqueSlug } from '@/features/import-listener/helpers/generate-unique-slug'
import { fetchRegistryDocument } from '@/helpers/fetch-registry-document'

import { useFilteredDocs } from '../hooks/use-filtered-docs'
import SelectRegistryDoc from './SelectRegistryDoc.vue'

const { inputValue, workspaceStore, eventBus } = defineProps<{
  /** The workspace store for adding documents */
  workspaceStore: WorkspaceStore
  /** Event bus for emitting operation creation events */
  eventBus: WorkspaceEventBus
  // Initial value passed from the command palette
  inputValue?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { toast } = useToasts()

const { query, completionOptions, handleSelect, selectedDocument } =
  useFilteredDocs(inputValue ?? '')

async function handleLoad() {
  if (!selectedDocument.value) {
    toast('No document selected', 'error')
    return
  }

  const { namespace, slug, version } = selectedDocument.value

  try {
    const res = await fetchRegistryDocument({ namespace, slug, version })
    if (!res.ok) {
      throw new Error(res.error)
    }

    const currentDocuments = new Set(
      Object.keys(workspaceStore.workspace.documents),
    )

    const parsed = res.data
    const info = parsed.info as Record<string, unknown> | undefined
    const baseName = (info?.title as string | undefined) ?? slug

    const generatedSlug = await generateUniqueSlug(baseName, currentDocuments)
    if (!generatedSlug) {
      toast('Failed to generate a unique name for the document', 'error')
      return
    }

    await workspaceStore.addDocument({
      name: generatedSlug,
      document: parsed,
      meta: {
        'x-scalar-registry-meta': {
          namespace: namespace,
          slug: slug,
        },
      },
    })

    eventBus.emit('ui:navigate', {
      page: 'document',
      path: 'overview',
      documentSlug: generatedSlug,
    })

    emit('close')
  } catch (e) {
    console.error(e)
    const message = e instanceof Error ? e.message : e
    toast(`Failed to import document: ${message}`, 'error')
  }
}
</script>
<template>
  <CommandActionForm @submit="handleLoad">
    <SelectRegistryDoc
      v-model="query"
      :completionOptions="completionOptions"
      @select="handleSelect" />
    <template #options>
      <span
        v-if="selectedDocument"
        class="text-c-accent flex flex-1 items-center justify-end">
        <span>@{{ selectedDocument.namespace }}</span
        >/<span class="font-bold">{{ selectedDocument.slug }}</span
        >@
        <span>{{ selectedDocument.version }}</span>
      </span>
    </template>
  </CommandActionForm>
</template>
