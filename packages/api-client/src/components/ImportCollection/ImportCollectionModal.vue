<script setup lang="ts">
import { useUrlPrefetcher } from '@/components/ImportCollection/hooks/useUrlPrefetcher'
import { getOpenApiDocumentVersion } from '@/components/ImportCollection/utils/getOpenApiDocumentVersion'
import { isDocument } from '@/components/ImportCollection/utils/isDocument'
import { isUrl } from '@/components/ImportCollection/utils/isUrl'
import { useWorkspace } from '@/store'
import {
  ScalarCodeBlock,
  ScalarIcon,
  ScalarModal,
  useModal,
} from '@scalar/components'
import { watch } from 'vue'

import DownloadLink from './DownloadLink.vue'
import ImportNowButton from './ImportNowButton.vue'
import LoadingScreen from './LoadingScreen.vue'
import OpenApiDocumentPreview from './OpenApiDocumentPreview.vue'
import OpenAppButton from './OpenAppButton.vue'

const props = defineProps<{
  source: string | null
  title?: string | null
}>()

defineEmits<{
  (e: 'importFinished'): void
}>()

const { activeWorkspace } = useWorkspace()

const { prefetchResult, prefetchUrl } = useUrlPrefetcher()

const modalState = useModal()

watch(
  () => props.source,
  (value) => {
    prefetchUrl(value, activeWorkspace.value.proxyUrl)

    if (!value) {
      modalState.hide()
    } else if (isUrl(value)) {
      modalState.show()
    } else if (isDocument(value) && getOpenApiDocumentVersion(value)) {
      modalState.show()
    } else {
      modalState.hide()
    }
  },
)
</script>

<template>
  <ScalarModal
    size="md"
    :state="modalState"
    :title="title ? `Import ${title} Collection` : 'Import Collection'">
    <div class="flex flex-col gap-2">
      <!-- Preview -->
      <div class="flex gap-2 flex-col pb-4">
        <!-- Document preview -->
        <template v-if="source && isDocument(source)">
          <OpenApiDocumentPreview :content="source" />
        </template>

        <!-- URL preview -->
        <template v-else-if="source && isUrl(source)">
          <!-- URL -->
          <div class="mb-4">
            <div class="flex flex-col gap-2">
              <div class="text-sm">URL</div>
              <ScalarCodeBlock
                class="border bg-b-2 rounded overflow-hidden"
                :content="source"
                :copy="false" />
            </div>
          </div>
          <!-- Loading -->
          <template v-if="prefetchResult.state === 'loading'">
            <LoadingScreen />
          </template>
          <template v-else>
            <!-- Prefetch error -->
            <template v-if="prefetchResult.error">
              <div class="flex gap-2 items-center text-sm">
                <ScalarIcon
                  class="text-red"
                  icon="Error"
                  size="sm" />
                <div>
                  {{ prefetchResult.error }}
                </div>
              </div>
            </template>
            <template v-else>
              <!-- Content preview -->
              <OpenApiDocumentPreview :content="prefetchResult.content" />
            </template>
          </template>
        </template>
      </div>

      <!-- Actions -->
      <div class="flex gap-2 mt-4">
        <OpenAppButton :source="source" />
        <ImportNowButton
          class="w-auto"
          :source="source"
          @importFinished="() => $emit('importFinished')" />
      </div>

      <!-- Download App -->
      <DownloadLink />
    </div>
  </ScalarModal>
</template>
