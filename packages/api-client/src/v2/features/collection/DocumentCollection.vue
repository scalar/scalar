<script lang="ts">
/**
 * Document Collection Page
 *
 * Displays primary document editing and viewing interface, enabling users to:
 *   - Choose a document icon
 *   - Edit the document title
 *   - Navigate among Overview, Servers, Authentication, Environment, Cookies, and Settings tabs
 */
export default {
  name: 'DocumentCollection',
}
</script>

<script setup lang="ts">
import { ScalarButton } from '@scalar/components'
import { ScalarIconDownload } from '@scalar/icons'
import { LibraryIcon } from '@scalar/icons/library'
import { computed } from 'vue'
import { RouterView } from 'vue-router'

import IconSelector from '@/components/IconSelector.vue'
import type { RouteProps } from '@/v2/features/app/helpers/routes'
import { downloadAsFile } from '@/v2/helpers/download-document'

import LabelInput from './components/LabelInput.vue'
import Tabs from './components/Tabs.vue'

const props = defineProps<RouteProps>()

/** Snag the title from the info object */
const title = computed(() => props.document?.info?.title ?? '')

/** Default to the folder icon */
const icon = computed(
  () => props.document?.['x-scalar-icon'] || 'interface-content-folder',
)

/** Downloads the document as a JSON file using the last saved state. */
const downloadDocument = () => {
  const content = props.workspaceStore.exportDocument(
    props.documentSlug,
    'json',
    false,
  )
  if (!content) return
  const baseName = title.value.replace(/[^\w\s-]/g, '').trim() || 'document'
  downloadAsFile(content, `${baseName}.json`)
}
</script>

<template>
  <div class="custom-scroll h-full">
    <div
      v-if="document"
      class="md:max-w-content w-full px-3 md:mx-auto">
      <!-- Header -->
      <div
        :aria-label="`title: ${title}`"
        class="md:max-w-content mx-auto flex h-fit w-full flex-col gap-2 pt-14 pb-3 md:pt-6">
        <div class="flex flex-row items-center justify-between gap-2">
          <div class="flex min-w-0 items-center gap-2">
            <IconSelector
              :modelValue="icon"
              placement="bottom-start"
              @update:modelValue="
                (icon) => eventBus.emit('document:update:icon', icon)
              ">
              <ScalarButton
                class="hover:bg-b-2 aspect-square h-7 w-7 cursor-pointer rounded border border-transparent p-0 hover:border-inherit"
                variant="ghost">
                <LibraryIcon
                  class="text-c-2 size-5"
                  :src="icon"
                  stroke-width="2" />
              </ScalarButton>
            </IconSelector>

            <div class="group relative ml-1.25 min-w-0">
              <LabelInput
                class="text-xl font-bold"
                inputId="documentName"
                :modelValue="title"
                @update:modelValue="
                  (title) => eventBus.emit('document:update:info', { title })
                " />
            </div>
          </div>

          <ScalarButton
            class="text-c-2 hover:text-c-1 flex shrink-0 items-center gap-2"
            size="xs"
            type="button"
            variant="ghost"
            @click="downloadDocument">
            <ScalarIconDownload
              size="sm"
              thickness="1.5" />
            <span>Download document</span>
          </ScalarButton>
        </div>
      </div>

      <!-- Tabs -->
      <Tabs type="document" />

      <!-- Router views -->
      <div class="px-1.5 pt-8 pb-20">
        <RouterView v-slot="{ Component }">
          <component
            :is="Component"
            v-bind="props"
            collectionType="document" />
        </RouterView>
      </div>
    </div>

    <!-- Document not found -->
    <div
      v-else
      class="flex w-full flex-1 items-center justify-center">
      <div class="flex h-full flex-col items-center justify-center">
        <h1 class="text-2xl font-bold">Document not found</h1>
        <p class="text-gray-500">
          The document you are looking for does not exist.
        </p>
      </div>
    </div>
  </div>
</template>

<style>
.full-size-styles:has(.sync-conflict-modal-root) {
  width: 100dvw !important;
  max-width: 100dvw !important;
  border-right: none !important;
}

.full-size-styles:has(.sync-conflict-modal-root)::after {
  display: none;
}
</style>
