<script lang="ts" setup>
import { ScalarButton, useLoadingState } from '@scalar/components'
import { useToasts } from '@scalar/use-toasts'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { nextTick } from 'vue'

import { DASHBOARD_REGISTER_URL } from '@/consts/urls'
import { uploadTempDocument } from '@/features/toolbar/uploadTempDocument'

const { sdks = [], workspace } = defineProps<{
  workspace: WorkspaceStore
  sdks?: string[]
}>()

const tempDocUrl = defineModel<string>('url')

const { toast } = useToasts()
const loading = useLoadingState()

/** Open the registration link in a new tab */
function openRegisterLink(docUrl: string) {
  const url = new URL(DASHBOARD_REGISTER_URL)
  url.searchParams.set('url', docUrl)
  sdks.forEach((sdk) => url.searchParams.append('sdk', sdk))

  window.open(url.toString(), '_blank')
}

/** Generate and open the registration link */
async function generateRegisterLink() {
  if (loading.isLoading || !workspace) {
    return
  }

  // If we have already have a temporary document URL, use it
  if (tempDocUrl.value) {
    openRegisterLink(tempDocUrl.value)
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
    await loading.validate(600)
    openRegisterLink(tempDocUrl.value)

    await nextTick()

    loading.clear()
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'An unknown error occurred'
    toast(message, 'error')
    loading.invalidate()
  }
}
</script>
<template>
  <ScalarButton
    class="h-auto p-2.5"
    :loading
    @click="generateRegisterLink">
    <slot>Generate</slot>
  </ScalarButton>
</template>
