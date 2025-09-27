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
import { ref } from 'vue'

import { REGISTRY_SHARE_URL } from '@/consts/urls'
import ApiReferenceToolbarBlurb from '@/features/toolbar/ApiReferenceToolbarBlurb.vue'

const { workspace } = defineProps<{
  workspace?: WorkspaceStore
}>()

const { toast } = useToasts()
const loading = useLoadingState()

const temporaryShareUrl = ref<string>('')

async function generateTemporaryLink() {
  if (loading.isLoading || !workspace || !!temporaryShareUrl.value) {
    return
  }

  loading.startLoading()

  const body = JSON.stringify({
    document: `{
  "openapi": "3.1.0",
  "info": {
    "title": "Hello World",
    "version": "1.0.0"
},
  "paths": {}
}`,
  })

  const response = await fetch(
    'https://staging.scalar.com/core/share/upload/apis',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    },
  )

  if (!response.ok) {
    toast(response.statusText, 'error')
    return
  }
  const data = await response.json()

  if (!data || !data.url || typeof data.url !== 'string') {
    toast('Failed to generate temporary link', 'error')
    return
  }

  loading.validate(1200, true)
  temporaryShareUrl.value = data.url
}

const { copyToClipboard } = useClipboard()
</script>
<template>
  <ScalarTextInput
    readonly
    :placeholder="`${REGISTRY_SHARE_URL}/apis/...`"
    :modelValue="temporaryShareUrl"
    @click="temporaryShareUrl && copyToClipboard(temporaryShareUrl)">
    <template
      v-if="temporaryShareUrl"
      #aside>
      <ScalarIconButton
        :icon="ScalarIconCopy"
        label="Copy link to clipboard"
        class="-m-1.5 -ml-1"
        size="sm"
        @click="copyToClipboard(temporaryShareUrl)" />
    </template>
  </ScalarTextInput>
  <ScalarButton
    class="h-auto p-2.5"
    :loading
    variant="outlined"
    :disabled="!!temporaryShareUrl"
    @click="generateTemporaryLink">
    Generate link
  </ScalarButton>
  <ApiReferenceToolbarBlurb class="-mt-1">
    Shared documents will automatically be deleted after 7 days.
  </ApiReferenceToolbarBlurb>
</template>
