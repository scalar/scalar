<script lang="ts" setup>
import {
  ScalarButton,
  ScalarIconButton,
  ScalarTextInput,
  useLoadingState,
} from '@scalar/components'
import { ScalarIconCopy } from '@scalar/icons'
import { useClipboard } from '@scalar/use-hooks/useClipboard'
import { useToasts } from '@scalar/use-toasts'
import type { WorkspaceStore } from '@scalar/workspace-store/client'

import { REGISTRY_SHARE_URL } from '@/consts/urls'
import { uploadTempDocument } from '@/helpers/upload-temp-document'

import ApiReferenceToolbarBlurb from './ApiReferenceToolbarBlurb.vue'

const { workspace } = defineProps<{
  workspace: WorkspaceStore
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
    tempDocUrl.value = await uploadTempDocument(document)
    await copyToClipboard(tempDocUrl.value)
    await loader.validate()
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'An unknown error occurred'
    toast(message, 'error')
    await loader.invalidate()
  }
}

const { copyToClipboard } = useClipboard()
</script>
<template>
  <template v-if="tempDocUrl">
    <label
      class="text-c-2 block font-medium"
      for="temporary-link">
      URL
    </label>
    <ScalarTextInput
      id="temporary-link"
      :modelValue="tempDocUrl"
      :placeholder="`${REGISTRY_SHARE_URL}/apis/…`"
      readonly
      @click="tempDocUrl && copyToClipboard(tempDocUrl)">
      <template #aside>
        <ScalarIconButton
          class="-m-1.5 -ml-1"
          :icon="ScalarIconCopy"
          label="Copy link to clipboard"
          size="sm"
          @click="copyToClipboard(tempDocUrl)" />
      </template>
    </ScalarTextInput>
  </template>
  <template v-else>
    <ScalarButton
      class="h-auto p-2.5"
      :disabled="!!tempDocUrl"
      :loader
      variant="solid"
      @click="generateTemporaryLink">
      Upload Document
    </ScalarButton>
  </template>
  <ApiReferenceToolbarBlurb class="-mt-1">
    Your document will automatically be deleted after 7 days.
  </ApiReferenceToolbarBlurb>
</template>
