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
import { ScalarButton, ScalarFormError } from '@scalar/components'
import { ScalarIconArrowLeft, ScalarIconFloppyDisk } from '@scalar/icons'
import { LibraryIcon } from '@scalar/icons/library'
import { computed } from 'vue'
import { RouterView } from 'vue-router'

import IconSelector from '@/components/IconSelector.vue'
import type { RouteProps } from '@/v2/features/app/helpers/routes'

import LabelInput from './components/LabelInput.vue'
import Tabs from './components/Tabs.vue'

const props = defineProps<RouteProps>()

/** Snag the title from the info object */
const title = computed(() => props.document?.info?.title || 'Untitled Document')

/** Default to the folder icon */
const icon = computed(
  () => props.document?.['x-scalar-icon'] || 'interface-content-folder',
)

const undoChanges = () => {
  props.workspaceStore.revertDocumentChanges(props.documentSlug)
}

const saveChanges = () => {
  props.workspaceStore.saveDocument(props.documentSlug)
}
</script>

<template>
  <div class="custom-scroll h-full">
    <div
      v-if="document"
      class="w-full md:mx-auto md:max-w-[720px]">
      <!-- Header -->
      <div
        :aria-label="`title: ${title}`"
        class="mx-auto flex h-fit w-full flex-col gap-2 pt-6 pb-3 md:mx-auto md:max-w-[720px]">
        <ScalarFormError
          v-if="document['x-scalar-is-dirty']"
          variant="warning">
          <div>
            You have unsaved changes. Save your work to keep your changes, or
            undo to revert them.
          </div>
          <div class="flex-1"></div>
          <div class="flex">
            <ScalarButton
              size="sm"
              variant="ghost"
              @click="undoChanges">
              <ScalarIconArrowLeft />
              <span>Undo</span>
            </ScalarButton>
            <ScalarButton
              size="sm"
              variant="ghost"
              @click="saveChanges">
              <ScalarIconFloppyDisk />
              <span>Save</span>
            </ScalarButton>
          </div>
        </ScalarFormError>
        <div class="flex flex-row items-center gap-2">
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
        </div>

        <div class="group relative ml-1.25">
          <LabelInput
            class="text-xl font-bold"
            inputId="documentName"
            :modelValue="title"
            @update:modelValue="
              (title) => eventBus.emit('document:update:info', { title })
            " />
        </div>
      </div>

      <!-- Tabs -->
      <Tabs type="document" />

      <!-- Router views -->
      <div class="px-1.5 py-8">
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
