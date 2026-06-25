<script lang="ts" setup>
import { ScalarButton } from '@scalar/components/button'
import { useLoadingState } from '@scalar/components/loading'
import type { ExternalUrls } from '@scalar/types/api-reference'
import { useToasts } from '@scalar/use-toasts'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { nextTick } from 'vue'

import { useLocalization } from '@/features/localization'
import { uploadTempDocument } from '@/helpers/upload-temp-document'

const {
  sdks = [],
  workspace,
  externalUrls,
} = defineProps<{
  workspace: WorkspaceStore
  externalUrls: ExternalUrls
  sdks?: string[]
}>()

const tempDocUrl = defineModel<string>('url')

const { toast } = useToasts()
const loader = useLoadingState()
const { translate } = useLocalization()

/** Open the registration link in a new tab */
function openRegisterLink(docUrl: string) {
  const url = new URL(`${externalUrls.dashboardUrl}/register`)
  url.searchParams.set('url', docUrl)
  sdks.forEach((sdk) => url.searchParams.append('sdk', sdk))

  window.open(url.toString(), '_blank')
}

/** Generate and open the registration link */
async function generateRegisterLink() {
  if (loader.isLoading || !workspace) {
    return
  }

  // If we have already have a temporary document URL, use it
  if (tempDocUrl.value) {
    openRegisterLink(tempDocUrl.value)
    return
  }

  loader.start()

  const document = workspace.exportActiveDocument('json')

  if (!document) {
    toast(translate('developerTools.unableToExportDocument'), 'error')
    await loader.invalidate()
    return
  }

  try {
    tempDocUrl.value = await uploadTempDocument(document, externalUrls)
    await loader.validate()
    openRegisterLink(tempDocUrl.value)

    await nextTick()

    await loader.clear()
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : translate('developerTools.unknownError')
    toast(message, 'error')
    await loader.invalidate()
  }
}
</script>
<template>
  <ScalarButton
    class="h-auto p-2.5"
    :loader
    @click="generateRegisterLink">
    <slot>{{ translate('developerTools.generate') }}</slot>
  </ScalarButton>
</template>
