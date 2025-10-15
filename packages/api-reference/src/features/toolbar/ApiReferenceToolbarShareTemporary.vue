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
import ApiReferenceToolbarBlurb from '@/features/toolbar/ApiReferenceToolbarBlurb.vue'
import { uploadTempDocument } from '@/v2/helpers/upload-temp-document'

const { workspace } = defineProps<{
  workspace: WorkspaceStore
}>()

const { toast } = useToasts()
const loading = useLoadingState()

const tempDocUrl = defineModel<string>('url')

async function generateTemporaryLink() {
  if (loading.isLoading || !workspace || !!tempDocUrl.value) {
    return
  }

  loading.startLoading()

  const document = workspace.exportActiveDocument('json')

  if (!document) {
    toast('Unable to export active document', 'error')
    loading.invalidate()
    return
  }

  try {
    tempDocUrl.value = await uploadTempDocument(document)
    copyToClipboard(tempDocUrl.value)
    loading.validate()
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'An unknown error occurred'
    toast(message, 'error')
    loading.invalidate()
  }
}

const { copyToClipboard } = useClipboard()
</script>
<template>
  <ScalarTextInput
    :modelValue="tempDocUrl"
    :placeholder="`${REGISTRY_SHARE_URL}/apis/...`"
    readonly
    @click="tempDocUrl && copyToClipboard(tempDocUrl)">
    <template
      v-if="tempDocUrl"
      #aside>
      <ScalarIconButton
        class="-m-1.5 -ml-1"
        :icon="ScalarIconCopy"
        label="Copy link to clipboard"
        size="sm"
        @click="copyToClipboard(tempDocUrl)" />
    </template>
  </ScalarTextInput>
  <ScalarButton
    class="h-auto p-2.5"
    :disabled="!!tempDocUrl"
    :loading
    variant="outlined"
    @click="generateTemporaryLink">
    Generate
  </ScalarButton>
  <ApiReferenceToolbarBlurb class="-mt-1">
    Shared documents will automatically be deleted after 7 days.
  </ApiReferenceToolbarBlurb>
</template>
