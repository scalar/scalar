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
import { normalize } from '@scalar/openapi-parser'
import type { OpenAPI } from '@scalar/openapi-types'
import { computed, watch } from 'vue'

import ImportNowButton from './ImportNowButton.vue'
import WorkspaceSelector from './WorkspaceSelector.vue'

// import OpenAppButton from './OpenAppButton.vue'

const props = defineProps<{
  source: string | null
}>()

defineEmits<{
  (e: 'importFinished'): void
}>()

const { activeWorkspace, events } = useWorkspace()

const { prefetchResult, prefetchUrl } = useUrlPrefetcher()

const modalState = useModal()

/** Close modal when a keyboard shortcut is pressed */
events.hotKeys.on(() => modalState.hide())

/** Try to make the retrieved content an OpenAPI document */
const openApiDocument = computed(() => {
  try {
    return normalize(
      prefetchResult.content || props.source || '',
    ) as OpenAPI.Document
  } catch {
    return undefined
  }
})

/** Title from the OpenAPI document */
const title = computed(() => openApiDocument.value?.info?.title)

/** The OpenAPI/Swagger version */
const version = computed(() =>
  getOpenApiDocumentVersion(prefetchResult.content || props.source || ''),
)

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
    size="full"
    :state="modalState">
    <div class="flex flex-col h-screen justify-center overflow-hidden relative">
      <div class="flex items-center flex-col m-auto">
        <!-- Wait until the URL is fetched -->
        <template v-if="prefetchResult.state === 'idle'">
          <!-- Title -->
          <div
            class="text-center text-[50px] tracking-[-3px] leading-tight font-medium text-pretty">
            {{ title ?? 'Untitled Collection' }}
          </div>

          <!-- Prefetch error -->
          <template v-if="prefetchResult.error">
            <div
              class="flex gap-2 items-center p-3 font-code text-sm border rounded break-words my-4">
              <ScalarIcon
                class="text-red flex-shrink-0"
                icon="Error"
                size="sm" />
              <div class="break-all">
                {{ prefetchResult.error }}
              </div>
            </div>
          </template>

          <!-- Document doesn’t even have an OpenAPI/Swagger version, something is probably wrong -->
          <template v-else-if="!version">
            <div class="flex flex-col gap-2">
              <div
                class="flex gap-2 items-center p-3 font-code text-sm border rounded">
                <ScalarIcon
                  class="text-red"
                  icon="Error"
                  size="sm" />
                <div>
                  This doesn’t look like a valid OpenAPI/Swagger document.
                </div>
              </div>

              <div class="bg-b-2 h-48 border rounded custom-scroll">
                <ScalarCodeBlock
                  :content="
                    prefetchResult.content?.trim() || props.source?.trim() || ''
                  "
                  :copy="false" />
              </div>
            </div>
          </template>
        </template>

        <!-- Actions -->
        <div
          v-if="version"
          class="inline-flex flex-col gap-2 items-center mt-2">
          <!-- <OpenAppButton :source="source" /> -->
          <ImportNowButton
            :source="source"
            variant="button"
            @importFinished="() => $emit('importFinished')" />
        </div>
        <!-- Select the workspace -->
        <template v-if="version">
          <div class="flex justify-center">
            <div class="inline-flex py-1 px-4 items-center text-sm">
              Import to: <WorkspaceSelector />
            </div>
          </div>
        </template>
      </div>
      <!-- Download Link -->
      <div class="flex flex-col justify-center items-center pb-8">
        <div class="text-center flex items-center flex-col">
          <div
            class="mb-2 w-10 h-10 border rounded-[10px] flex items-center justify-center">
            <a
              href="https://scalar.com/download"
              target="_blank">
              <ScalarIcon
                icon="Logo"
                size="xl" />
            </a>
          </div>
          <span class="text-c-2 leading-snug">
            <a
              class="hover:text-c-1 underline-offset-2"
              href="https://scalar.com/download"
              target="_blank">
              Download the Scalar App
            </a>
            <br />
            free · open-source · offline first
          </span>
        </div>
      </div>
    </div>
  </ScalarModal>
</template>
