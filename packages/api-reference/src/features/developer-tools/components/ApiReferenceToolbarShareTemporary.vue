<script lang="ts" setup>
import {
  ScalarButton,
  ScalarTextInputCopy,
  useLoadingState,
} from '@scalar/components'
import type { ExternalUrls } from '@scalar/types/api-reference'
import { useToasts } from '@scalar/use-toasts'
import type { WorkspaceStore } from '@scalar/workspace-store/client'

import { uploadTempDocument } from '@/helpers/upload-temp-document'

import ApiReferenceToolbarBlurb from './ApiReferenceToolbarBlurb.vue'

const { workspace, externalUrls } = defineProps<{
  workspace: WorkspaceStore
  externalUrls: ExternalUrls
}>()

const { toast } = useToasts()
const loader = useLoadingState()

const tempDocUrl = defineModel<string>('url')

async function generateTemporaryLink() {
  if (loader.isLoading || !workspace || !!tempDocUrl.value) {
    return
  }

  loader.start()

  const document = workspace.exportActiveDocument('json')

  if (!document) {
    toast('Unable to export active document', 'error')
    await loader.invalidate()
    return
  }

  try {
    const url = await uploadTempDocument(document, externalUrls)
    await loader.validate({ duration: 900, persist: true }) // Wait to show the success state
    tempDocUrl.value = url
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'An unknown error occurred'
    toast(message, 'error')
    await loader.invalidate()
  }
}
</script>
<template>
  <template v-if="tempDocUrl">
    <ScalarTextInputCopy
      immediate
      :modelValue="tempDocUrl"
      name="temporary-link"
      :placeholder="`${externalUrls.registryUrl}/share/apis/…`">
    </ScalarTextInputCopy>
  </template>
  <template v-else>
    <ScalarButton
      class="h-auto p-2.5"
      :loader
      variant="gradient"
      @click="generateTemporaryLink">
      Upload Document
    </ScalarButton>
  </template>
  <ApiReferenceToolbarBlurb class="-mt-1">
    Your document will automatically be deleted after 7 days.
  </ApiReferenceToolbarBlurb>
</template>
