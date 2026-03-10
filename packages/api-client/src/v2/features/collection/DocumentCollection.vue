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
import { ScalarButton, ScalarModal, useModal } from '@scalar/components'
import {
  ScalarIconCloudArrowDown,
  ScalarIconFloppyDisk,
  ScalarIconWarning,
} from '@scalar/icons'
import { LibraryIcon } from '@scalar/icons/library'
import { apply, type Difference, type merge } from '@scalar/json-magic/diff'
import { useToasts } from '@scalar/use-toasts'
import { deepClone } from '@scalar/workspace-store/helpers/deep-clone'
import { computed, ref } from 'vue'
import { RouterView } from 'vue-router'

import IconSelector from '@/components/IconSelector.vue'
import Callout from '@/v2/components/callout/Callout.vue'
import type { RouteProps } from '@/v2/features/app/helpers/routes'

import LabelInput from './components/LabelInput.vue'
import SyncConflictResolutionEditor from './components/SyncConflictResolutionEditor.vue'
import Tabs from './components/Tabs.vue'

const props = defineProps<RouteProps>()

/** Snag the title from the info object */
const title = computed(() => props.document?.info?.title || 'Untitled Document')

/** Default to the folder icon */
const icon = computed(
  () => props.document?.['x-scalar-icon'] || 'interface-content-folder',
)

const syncModal = useModal()
const dirtyBeforeSyncModal = useModal()

const isDocumentDirty = computed(
  () => props.document?.['x-scalar-is-dirty'] === true,
)

const documentSourceUrl = computed(
  () => props.document?.['x-scalar-original-source-url'],
)

const { toast } = useToasts()

const undoChanges = () => {
  props.workspaceStore.revertDocumentChanges(props.documentSlug)
}

const saveChanges = () => {
  props.workspaceStore.saveDocument(props.documentSlug)
}

const handleSaveThenCloseDirtyModal = () => {
  saveChanges()
  dirtyBeforeSyncModal.hide()
}

const handleDiscardThenCloseDirtyModal = () => {
  undoChanges()
  dirtyBeforeSyncModal.hide()
}

const rebaseResult = ref<{
  originalDocument: Record<string, unknown>
  resolvedDocument: Record<string, unknown>
  conflicts: ReturnType<typeof merge>['conflicts']
  applyChanges: (
    applyChangesInput:
      | {
          resolvedConflicts: Difference<unknown>[]
        }
      | {
          resolvedDocument: Record<string, unknown>
        },
  ) => Promise<void>
} | null>(null)

const handleSyncFlow = async () => {
  if (isDocumentDirty.value) {
    dirtyBeforeSyncModal.show()
    return
  }

  if (!documentSourceUrl.value) {
    toast('Document source URL is not set', 'warn')
    return
  }

  const result = await props.workspaceStore.rebaseDocument({
    name: props.documentSlug,
    url: documentSourceUrl.value,
  })

  if (result?.ok) {
    const originalDocument =
      props.workspaceStore.getOriginalDocument(props.documentSlug) ?? {}
    rebaseResult.value = {
      conflicts: result.conflicts,
      applyChanges: result.applyChanges,
      resolvedDocument: apply(deepClone(originalDocument), result.changes),
      originalDocument,
    }

    if (rebaseResult.value.conflicts.length > 0) {
      syncModal.show()
    }
  } else if (result?.ok === false && result.type === 'NO_CHANGES_DETECTED') {
    toast('No changes detected. Your document is up to date.', 'info')
  } else {
    toast('Failed to sync document', 'error')
  }
}

const handleApplyChanges = async ({
  resolvedDocument,
}: {
  resolvedDocument: Record<string, unknown>
}) => {
  await rebaseResult.value?.applyChanges({ resolvedDocument })
  props.eventBus.emit('hooks:on:rebase:document:complete', {
    meta: {
      documentName: props.documentSlug,
    },
  })
  syncModal.hide()
}
</script>

<template>
  <div class="custom-scroll h-full">
    <div
      v-if="document"
      class="w-full md:mx-auto md:max-w-180">
      <!-- Header -->
      <div
        :aria-label="`title: ${title}`"
        class="mx-auto flex h-fit w-full flex-col gap-2 pt-6 pb-3 md:max-w-180">
        <Callout
          v-if="document?.['x-scalar-is-dirty']"
          class="mb-5"
          type="warning">
          <p>
            You have unsaved changes. Save your work to keep your changes, or
            undo to revert them.
          </p>
          <template #actions>
            <ScalarButton
              class="text-c-2 hover:text-c-1 flex items-center gap-2"
              size="xs"
              type="button"
              variant="outlined"
              @click="undoChanges">
              <span>Undo</span>
            </ScalarButton>
            <ScalarButton
              class="text-c-btn flex items-center gap-2"
              size="xs"
              type="button"
              variant="solid"
              @click="saveChanges">
              <ScalarIconFloppyDisk
                size="sm"
                thickness="1.5" />
              <span>Save</span>
            </ScalarButton>
          </template>
        </Callout>
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
            v-if="document?.['x-scalar-original-source-url'] !== undefined"
            class="text-c-2 hover:text-c-1 shrink-0 gap-1.5"
            data-testid="document-sync-button"
            size="xs"
            :title="'Pull the latest version from the document source and merge with your local copy. Save your changes first if you have unsaved edits.'"
            type="button"
            variant="ghost"
            @click="handleSyncFlow">
            <ScalarIconCloudArrowDown
              class="size-3.5"
              size="sm"
              thickness="1.5" />
            <span>Sync from source</span>
          </ScalarButton>
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
  <ScalarModal
    bodyClass="border-t-0 rounded-t-lg flex flex-col gap-5"
    size="xs"
    :state="dirtyBeforeSyncModal"
    title="Sync requires saved document"
    @close="dirtyBeforeSyncModal.hide()">
    <div class="flex flex-col gap-5">
      <div class="flex gap-3">
        <div
          aria-hidden="true"
          class="bg-b-3 text-c-2 flex size-10 shrink-0 items-center justify-center rounded-lg">
          <ScalarIconWarning class="size-5 text-[var(--scalar-color-yellow)]" />
        </div>
        <div class="min-w-0 flex-1 space-y-1">
          <p class="text-c-1 text-sm leading-snug font-medium">
            You have unsaved changes
          </p>
          <p class="text-c-2 text-sm leading-relaxed">
            Save your work to keep changes, or discard to revert to the last
            saved version. Then you can sync with the source.
          </p>
        </div>
      </div>
      <div
        class="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--scalar-border-color)] pt-4">
        <ScalarButton
          size="sm"
          type="button"
          variant="ghost"
          @click="dirtyBeforeSyncModal.hide()">
          Cancel
        </ScalarButton>
        <ScalarButton
          size="sm"
          type="button"
          variant="outlined"
          @click="handleDiscardThenCloseDirtyModal">
          Discard changes
        </ScalarButton>
        <ScalarButton
          class="flex items-center gap-2"
          size="sm"
          type="button"
          variant="solid"
          @click="handleSaveThenCloseDirtyModal">
          <ScalarIconFloppyDisk
            size="sm"
            thickness="1.5" />
          Save and continue
        </ScalarButton>
      </div>
    </div>
  </ScalarModal>
  <ScalarModal
    v-if="rebaseResult"
    bodyClass="sync-conflict-modal-root flex h-dvh flex-col p-4"
    maxWidth="calc(100dvw - 32px)"
    size="full"
    :state="syncModal">
    <div class="flex h-full w-full flex-col gap-4 overflow-hidden">
      <SyncConflictResolutionEditor
        :baseDocument="rebaseResult.originalDocument"
        :conflicts="rebaseResult.conflicts"
        :resolvedDocument="rebaseResult.resolvedDocument"
        @applyChanges="(payload) => handleApplyChanges(payload)" />
    </div>
  </ScalarModal>
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
