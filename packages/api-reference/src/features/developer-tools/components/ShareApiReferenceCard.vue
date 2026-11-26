<script lang="ts" setup>
/**
 * Share in the localhost shell's side panel: uploads the active document for a temporary share
 * link, in the same card as the Generate SDK content. The upload works like the toolbar dropdown's.
 */
import { ScalarButton } from '@scalar/components/button'
import { useLoadingState } from '@scalar/components/loading'
import { ScalarTextInputCopy } from '@scalar/components/text-input'
import { ScalarIconShareNetwork } from '@scalar/icons'
import type { ExternalUrls } from '@scalar/types/api-reference'
import { useToasts } from '@scalar/use-toasts'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { ref } from 'vue'

import { useLocalization } from '@/features/localization'
import { uploadTempDocument } from '@/helpers/upload-temp-document'

import DeveloperToolsCard from './DeveloperToolsCard.vue'

const { workspace, externalUrls } = defineProps<{
  workspace: WorkspaceStore
  externalUrls: ExternalUrls
}>()

const emit = defineEmits<{
  (event: 'close'): void
}>()

const { toast } = useToasts()
const loader = useLoadingState()
const { translate } = useLocalization()

const shareUrl = ref<string>()

const upload = async (): Promise<void> => {
  if (loader.isLoading || shareUrl.value) {
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
    // Show the success state before the link replaces the button
    await loader.validate({ duration: 900, persist: true })
    shareUrl.value = url
  } catch (error) {
    toast(
      error instanceof Error
        ? error.message
        : translate('developerTools.unknownError'),
      'error',
    )
    await loader.invalidate()
  }
}
</script>
<template>
  <DeveloperToolsCard
    :description="translate('developerTools.shareDescription')"
    :title="translate('developerTools.shareTitle')"
    @close="emit('close')">
    <template #hero>
      <!-- A sticker-like tile, like the artwork on the other cards -->
      <span
        aria-hidden="true"
        class="share-card-tile bg-b-1 text-c-1 flex size-22 items-center justify-center rounded-2xl border shadow-lg">
        <ScalarIconShareNetwork class="size-10" />
      </span>
    </template>
    <div class="flex flex-col gap-3">
      <ScalarTextInputCopy
        v-if="shareUrl"
        immediate
        :modelValue="shareUrl"
        name="temporary-link" />
      <!-- The spinner hides the label, so the name is pinned while loading (the button is still announced as busy) -->
      <ScalarButton
        v-else
        :aria-busy="loader.isLoading"
        :aria-label="
          loader.isActive
            ? translate('developerTools.uploadDocument')
            : undefined
        "
        class="h-10 w-full rounded-full text-base"
        :loader
        variant="solid"
        @click="upload">
        {{ translate('developerTools.uploadDocument') }}
      </ScalarButton>
      <p class="text-c-2 m-0 text-center text-sm leading-relaxed text-balance">
        {{ translate('developerTools.temporaryLinkExpiration') }}
      </p>
    </div>
  </DeveloperToolsCard>
</template>
<style scoped>
.share-card-tile {
  rotate: 4deg;
}
</style>
