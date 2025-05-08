<script lang="ts" setup>
import type { Collection } from '@scalar/oas-utils/entities/spec'
import { useToasts } from '@scalar/use-toasts'
import { nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'

import { workspaceStoreIsEmpty } from '@/components/ImportCollection/utils/workspace-store-is-empty'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'

import DropEventListener from './DropEventListener.vue'
import ImportCollectionModal from './ImportCollectionModal.vue'
import PasteEventListener from './PasteEventListener.vue'
import UrlQueryParameterChecker from './UrlQueryParameterChecker.vue'
import { importCollection } from './utils/import-collection'

const store = useWorkspace()

/** Source to import from */
const source = ref<string | null>(null)

const integration = ref<string | null>(null)

const eventType = ref<'paste' | 'drop' | 'query' | null>(null)

/** Reset the data when the modal was closed */
async function resetData() {
  source.value = null
  integration.value = null
  eventType.value = null

  await nextTick()
}

/** Receive data from the paste event listener */
async function handleInput(
  newSource: string,
  newIntegration: string | null = null,
  newEventType: 'paste' | 'drop' | 'query',
) {
  // Reset, to trigger the modal to reopen
  await resetData()

  // We skip the modal and directly import if the store is empty.
  if (workspaceStoreIsEmpty(store)) {
    console.info('Workspace store is empty, directly importing:', newSource)

    if (await handleImportCollection(newSource)) {
      return
    }

    console.warn('Failed to import the collection from:', newSource)
  }

  // Open the modal
  source.value = newSource
  integration.value = newIntegration
  eventType.value = newEventType
}

const router = useRouter()
const { activeWorkspace } = useActiveEntities()
const { toast } = useToasts()

async function handleImportCollection(
  source: string | null | undefined,
): Promise<boolean> {
  if (!source) {
    return false
  }

  return new Promise<boolean>((resolve) => {
    importCollection({
      store,
      workspace: activeWorkspace.value,
      source,
      // Use watch mode by default.
      watchMode: true,
      onSuccess(collection: Collection | undefined) {
        if (collection) {
          redirectToFirstRequestInCollection(collection)
          toast('Import successful', 'info')
          resolve(true)

          return
        }

        // If collection is undefined, consider it a failure
        toast('Import failed: No collection was created', 'error')

        resolve(false)
      },
      onError(error) {
        console.error('[importCollection]', error)
        const errorMessage = (error as Error)?.message || 'Unknown error'
        toast(`Import failed: ${errorMessage}`, 'error')

        resolve(false)
      },
    })
  })
}

function redirectToFirstRequestInCollection(collection?: Collection) {
  if (!collection) {
    return
  }

  router.push({
    name: 'request',
    params: {
      workspace: activeWorkspace.value?.uid,
      request: collection?.requests[0],
    },
  })
}
</script>

<template>
  <!-- Modal -->
  <ImportCollectionModal
    :eventType="eventType"
    :integration="integration"
    :source="source"
    @importFinished="resetData" />

  <!-- Event listeners-->
  <PasteEventListener @input="handleInput" />
  <DropEventListener @input="handleInput" />
  <UrlQueryParameterChecker @input="handleInput" />

  <!-- Wrapped content -->
  <slot />
</template>
