<script setup lang="ts">
import { useUrlPrefetcher } from '@/components/ImportCollection/hooks/useUrlPrefetcher'
import { getOpenApiDocumentVersion } from '@/components/ImportCollection/utils/getOpenApiDocumentVersion'
import { isDocument } from '@/components/ImportCollection/utils/isDocument'
import { isUrl } from '@/components/ImportCollection/utils/isUrl'
import { useWorkspace } from '@/store'
import {
  // ScalarCodeBlock,
  ScalarIcon,
  ScalarModal,
  useModal,
} from '@scalar/components'
import { normalize } from '@scalar/openapi-parser'
import type { OpenAPI } from '@scalar/openapi-types'
import { computed, watch } from 'vue'

import DownloadLink from './DownloadLink.vue'
import ImportNowButton from './ImportNowButton.vue'
import LoadingScreen from './LoadingScreen.vue'
// import OpenApiDocumentPreview from './OpenApiDocumentPreview.vue'
import OpenAppButton from './OpenAppButton.vue'
import OpenApiDocumentPreview from './PlayfulOpenApiDocumentPreview.vue'

const props = defineProps<{
  source: string | null
}>()

defineEmits<{
  (e: 'importFinished'): void
}>()

const { activeWorkspace } = useWorkspace()

const { prefetchResult, prefetchUrl } = useUrlPrefetcher()

const modalState = useModal()

/** Try to make the retrieved content an OpenAPI document */
const openApiDocument = computed(() => {
  return normalize(
    prefetchResult.content || props.source || '',
  ) as OpenAPI.Document
})

/** Title from the OpenAPI document */
const title = computed(() => openApiDocument.value.info?.title)

/** Open/close modal on events  */
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
    :state="modalState">
    <div class="flex flex-col gap-2">
      <!-- Title -->
      <div class="text-center text-xl font-medium mb-4 mt-8">
        <template v-if="title">Import {{ title }}</template>
        <template v-else>
          <!-- Keep the height -->
          &nbsp;
        </template>
      </div>
      <!-- Preview -->
      <div class="flex gap-2 flex-col pt-2 pb-4">
        <!-- Document preview -->
        <template v-if="source && isDocument(source)">
          <OpenApiDocumentPreview :content="openApiDocument" />
        </template>

        <!-- URL preview -->
        <template v-else-if="source && isUrl(source)">
          <!-- URL -->
          <!-- <div class="mb-4">
            <div class="flex flex-col gap-2">
              <div class="text-sm">URL</div>
              <ScalarCodeBlock
                class="border bg-b-2 rounded overflow-hidden"
                :content="source"
                :copy="false" />
            </div>
          </div> -->
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
              <OpenApiDocumentPreview
                class="-mx-3"
                :content="openApiDocument" />
            </template>
          </template>
        </template>
      </div>

      <!-- Actions -->
      <div class="inline-flex flex-col gap-2 mt-4 mb-8 items-center">
        <OpenAppButton :source="source" />
        <ImportNowButton
          :source="source"
          :variant="isDocument(source) ? 'button' : 'link'"
          @importFinished="() => $emit('importFinished')" />
      </div>

      <!-- Download App -->
      <DownloadLink />
    </div>
  </ScalarModal>
</template>
