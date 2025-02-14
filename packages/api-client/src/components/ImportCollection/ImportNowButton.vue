<script lang="ts" setup>
import { isUrl } from '@/components/ImportCollection/utils/isUrl'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import { ScalarButton } from '@scalar/components'
import type { Collection } from '@scalar/oas-utils/entities/spec'
import { useToasts } from '@scalar/use-toasts'
import { useRouter } from 'vue-router'

const props = defineProps<{
  source?: string | null
  variant?: 'button' | 'link'
  watchMode?: boolean
}>()

const emit = defineEmits<{
  (e: 'importFinished'): void
}>()

const router = useRouter()

const { activeWorkspace } = useActiveEntities()
const { importSpecFromUrl, importSpecFile } = useWorkspace()
const { toast } = useToasts()

async function importCollection() {
  try {
    if (props.source) {
      if (isUrl(props.source)) {
        const [error, entities] = await importSpecFromUrl(
          props.source,
          activeWorkspace.value?.uid ?? '',
          {
            proxyUrl: activeWorkspace.value?.proxyUrl,
            watchMode: props.watchMode,
          },
        )
        if (!error) redirectToFirstRequestInCollection(entities?.collection)
      } else {
        const entities = await importSpecFile(
          props.source,
          activeWorkspace.value?.uid ?? '',
        )
        redirectToFirstRequestInCollection(entities?.collection)
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
      class="py-2.5 px-6 rounded-lg font-bold h-fit mt-3 w-full"
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
