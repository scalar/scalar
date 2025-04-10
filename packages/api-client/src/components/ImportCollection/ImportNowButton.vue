<script lang="ts" setup>
import { ScalarButton } from '@scalar/components'
import type { Collection } from '@scalar/oas-utils/entities/spec'
import { useToasts } from '@scalar/use-toasts'
import { useRouter } from 'vue-router'

import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'

import { importCollection } from './utils/import-collection'

const { source, watchMode = true } = defineProps<{
  source?: string | null
  variant?: 'button' | 'link'
  watchMode?: boolean
}>()

const emit = defineEmits<{
  (e: 'importFinished'): void
}>()

const router = useRouter()
const store = useWorkspace()
const { activeWorkspace } = useActiveEntities()
const { toast } = useToasts()

async function handleImportCollection() {
  importCollection({
    store,
    workspace: activeWorkspace.value,
    source: source,
    watchMode: watchMode,
    onSuccess(collection: Collection | undefined) {
      if (collection) {
        redirectToFirstRequestInCollection(collection)
        toast('Import successful', 'info')
        emit('importFinished')
      }
    },
    onError(error) {
      console.error('[importCollection]', error)

      const errorMessage = (error as Error)?.message || 'Unknown error'
      toast(`Import failed: ${errorMessage}`, 'error')
    },
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
  <template v-if="source">
    <!-- Button -->
    <ScalarButton
      v-if="variant === 'button'"
      class="mt-3 h-fit w-full rounded-lg px-6 py-2.5 font-bold"
      size="md"
      type="button"
      @click="handleImportCollection">
      Import Collection
    </ScalarButton>
    <!-- Link -->
    <ScalarButton
      v-else
      class="h-fit rounded-lg px-6 py-2.5 text-[21px] font-bold"
      size="md"
      type="button"
      variant="ghost"
      @click="handleImportCollection">
      Try it in the browser
    </ScalarButton>
    <!-- <a
      v-else
      class="no-underline text-sm"
      href="#"
      @click="importCollection">
      Try it in the browser
    </a> -->
  </template>
</template>
