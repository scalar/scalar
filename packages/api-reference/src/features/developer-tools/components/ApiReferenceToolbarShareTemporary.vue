<script lang="ts" setup>
import { ScalarButton } from '@scalar/components/button'
import { useLoadingState } from '@scalar/components/loading'
import { ScalarTextInputCopy } from '@scalar/components/text-input'
import type { ExternalUrls } from '@scalar/types/api-reference'
import { useToasts } from '@scalar/use-toasts'
import type { WorkspaceStore } from '@scalar/workspace-store/client'

import { useApiReferenceLocalization } from '@/features/localization'
import { uploadTempDocument } from '@/helpers/upload-temp-document'

import ApiReferenceToolbarBlurb from './ApiReferenceToolbarBlurb.vue'

const { workspace, externalUrls } = defineProps<{
  workspace: WorkspaceStore
  externalUrls: ExternalUrls
}>()

const { toast } = useToasts()
const loader = useLoadingState()
const { translate } = useApiReferenceLocalization()

const tempDocUrl = defineModel<string>('url')

async function generateTemporaryLink() {
  if (loader.isLoading || !workspace || !!tempDocUrl.value) {
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
    const url = await uploadTempDocument(document, externalUrls)
    await loader.validate({ duration: 900, persist: true }) // Wait to show the success state
    tempDocUrl.value = url
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
      {{ translate('developerTools.uploadDocument') }}
    </ScalarButton>
  </template>
  <ApiReferenceToolbarBlurb class="-mt-1">
    {{ translate('developerTools.temporaryLinkExpiration') }}
  </ApiReferenceToolbarBlurb>
</template>
