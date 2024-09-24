<script lang="ts" setup>
import { isDocument } from '@/components/ImportCollection/utils/isDocument'
import { isUrl } from '@/components/ImportCollection/utils/isUrl'
import { useWorkspace } from '@/store'
import { ScalarButton, ScalarIcon } from '@scalar/components'
import type { Collection } from '@scalar/oas-utils/entities/spec'
import { useToasts } from '@scalar/use-toasts'
import { useRouter } from 'vue-router'

const props = defineProps<{
  source?: string | null
}>()

const emit = defineEmits<{
  (e: 'importFinished'): void
}>()

const router = useRouter()

const { importSpecFromUrl, importSpecFile, activeWorkspace } = useWorkspace()
const { toast } = useToasts()

async function importCollection() {
  try {
    if (props.source) {
      if (isUrl(props.source)) {
        const collection = await importSpecFromUrl(
          props.source,
          undefined,
          undefined,
          activeWorkspace.value.uid,
        )
        redirectToFirstRequestInCollection(collection)
      } else {
        const collection = await importSpecFile(
          props.source,
          activeWorkspace.value.uid,
        )
        redirectToFirstRequestInCollection(collection)
      }

      toast('Import successful', 'info')
      emit('importFinished')
    }
  } catch (error) {
    console.error('[importCollection]', error)

    const errorMessage = (error as Error)?.message || 'Unknown error'
    toast(`Import failed: ${errorMessage}`, 'error')
  }
}

function redirectToFirstRequestInCollection(collection?: Collection) {
  if (!collection) {
    return
  }

  router.push({
    name: 'request',
    params: {
      workspace: activeWorkspace.value.uid,
      request: collection?.requests[0],
    },
  })
}
</script>

<template>
  <ScalarButton
    v-if="source"
    class="px-6 max-h-8 gap-2"
    size="md"
    type="button"
    :variant="isDocument(source) ? 'solid' : 'outlined'"
    @click="importCollection">
    <ScalarIcon
      icon="Import"
      size="md" />
    Import in the browser
  </ScalarButton>
</template>
