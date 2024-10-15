<script lang="ts" setup>
import { isUrl } from '@/components/ImportCollection/utils/isUrl'
import { useWorkspace } from '@/store'
import { ScalarButton, ScalarIcon } from '@scalar/components'
import type { Collection } from '@scalar/oas-utils/entities/spec'
import { useToasts } from '@scalar/use-toasts'
import { useRouter } from 'vue-router'

const props = defineProps<{
  source?: string | null
  variant?: 'button' | 'link'
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
  <template v-if="source">
    <!-- Button -->
    <ScalarButton
      v-if="variant === 'button'"
      class="text-[21px] py-2.5 px-6 rounded-lg font-bold h-fit mt-3 mb-1.5"
      size="md"
      type="button"
      @click="importCollection">
      Import Collection
    </ScalarButton>
    <!-- Link -->
    <ScalarButton
      v-else
      class="text-[21px] py-2.5 px-6 rounded-lg font-bold h-fit"
      size="md"
      type="button"
      variant="ghost"
      @click="importCollection">
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
