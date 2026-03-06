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
import { ScalarIconFloppyDisk } from '@scalar/icons'
import { LibraryIcon } from '@scalar/icons/library'
import type { Difference } from '@scalar/json-magic/diff'
import { unpackProxyObject } from '@scalar/workspace-store/helpers/unpack-proxy'
import { computed, ref } from 'vue'
import { RouterView } from 'vue-router'

import IconSelector from '@/components/IconSelector.vue'
import Callout from '@/v2/components/callout/Callout.vue'
import type { RouteProps } from '@/v2/features/app/helpers/routes'

import LabelInput from './components/LabelInput.vue'
import SyncConflictResolutionEditor from './components/SyncConflictResolutionEditor.vue'
import Tabs from './components/Tabs.vue'

const props = defineProps<RouteProps>()

type SyncStatus =
  | 'idle'
  | 'running'
  | 'success'
  | 'no-changes'
  | 'conflicts'
  | 'error'

/** Snag the title from the info object */
const title = computed(() => props.document?.info?.title || 'Untitled Document')

/** Default to the folder icon */
const icon = computed(
  () => props.document?.['x-scalar-icon'] || 'interface-content-folder',
)

const syncModal = useModal()
const syncStatus = ref<SyncStatus>('idle')
const syncMessage = ref(
  'Run a sync test to check this document against its source URL.',
)
const syncConflicts = ref<
  Array<[Difference<unknown>[], Difference<unknown>[]]>
>([])
const syncBaseDocument = ref<Record<string, unknown>>({})
const syncCurrentDocument = ref<Record<string, unknown>>({})
const isApplyingConflictResolutions = ref(false)
const applyConflictResolutions = ref<
  ((resolvedConflicts: Difference<unknown>[]) => Promise<void>) | null
>(null)
const hasRemoteSource = computed(() =>
  Boolean(props.document?.['x-scalar-original-source-url']),
)

const undoChanges = () => {
  props.workspaceStore.revertDocumentChanges(props.documentSlug)
}

const saveChanges = () => {
  props.workspaceStore.saveDocument(props.documentSlug)
}

const runSyncTest = async () => {
  if (!props.documentSlug || !props.document) {
    syncStatus.value = 'error'
    syncMessage.value = 'No active document is available for sync testing.'
    return
  }

  const sourceUrl = props.document['x-scalar-original-source-url']
  if (!sourceUrl) {
    syncStatus.value = 'error'
    syncMessage.value =
      'This document has no source URL, so sync testing is unavailable.'
    return
  }

  syncStatus.value = 'running'
  syncMessage.value = `Testing document sync against ${sourceUrl}...`
  syncConflicts.value = []
  applyConflictResolutions.value = null

  try {
    const result = await props.workspaceStore.rebaseDocument({
      name: props.documentSlug,
      url: sourceUrl,
    })

    if (result?.ok) {
      if (result.conflicts.length > 0) {
        const workspaceSnapshot = props.workspaceStore.exportWorkspace()
        syncBaseDocument.value =
          unpackProxyObject(
            workspaceSnapshot.originalDocuments[props.documentSlug],
            { depth: 1 },
          ) ?? {}
        syncCurrentDocument.value = JSON.parse(
          JSON.stringify(unpackProxyObject(props.document, { depth: 1 })),
        ) as Record<string, unknown>
        syncConflicts.value = result.conflicts
        applyConflictResolutions.value = result.applyChanges
        syncStatus.value = 'conflicts'
        syncMessage.value = `Sync test found ${result.conflicts.length} conflict${result.conflicts.length === 1 ? '' : 's'}.`
        return
      }

      syncStatus.value = 'success'
      syncMessage.value =
        'Sync test passed. Remote changes can be merged automatically.'
      return
    }

    if (result?.ok === false && result.type === 'NO_CHANGES_DETECTED') {
      syncStatus.value = 'no-changes'
      syncMessage.value = 'Sync test passed. No remote changes were detected.'
      return
    }

    syncStatus.value = 'error'
    syncMessage.value =
      result?.message ?? 'Sync test failed due to an unexpected error.'
  } catch (error) {
    syncStatus.value = 'error'
    syncMessage.value =
      error instanceof Error
        ? error.message
        : 'Sync test failed due to an unexpected error.'
  }
}

const handleApplyConflictResolutions = async (
  resolvedConflicts: Difference<unknown>[],
) => {
  const apply = applyConflictResolutions.value
  if (!apply) {
    return
  }

  try {
    isApplyingConflictResolutions.value = true
    await apply(resolvedConflicts)
    syncStatus.value = 'success'
    syncMessage.value = 'Conflict resolution applied and document synced.'
    syncConflicts.value = []
    applyConflictResolutions.value = null
  } catch (error) {
    syncStatus.value = 'error'
    syncMessage.value =
      error instanceof Error
        ? error.message
        : 'Failed to apply conflict resolutions.'
  } finally {
    isApplyingConflictResolutions.value = false
  }
}

const openSyncModal = () => {
  syncModal.show()
  void runSyncTest()
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
            data-testid="document-sync-button"
            :disabled="!hasRemoteSource"
            size="xs"
            type="button"
            variant="outlined"
            @click="openSyncModal">
            Sync
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
    :bodyClass="
      syncStatus === 'conflicts'
        ? 'sync-conflict-modal-root flex h-dvh flex-col p-4'
        : undefined
    "
    :maxWidth="syncStatus === 'conflicts' ? 'calc(100dvw - 32px)' : undefined"
    :size="syncStatus === 'conflicts' ? 'full' : 'md'"
    :state="syncModal">
    <div
      class="flex min-h-0 flex-col gap-4"
      :class="
        syncStatus === 'conflicts'
          ? 'h-full overflow-hidden'
          : 'max-h-[75vh] overflow-auto'
      ">
      <p class="text-c-2 text-sm">
        {{ syncMessage }}
      </p>
      <SyncConflictResolutionEditor
        v-if="syncStatus === 'conflicts' && syncConflicts.length > 0"
        :baseDocument="syncBaseDocument"
        :conflicts="syncConflicts"
        :document="syncCurrentDocument"
        :isApplying="isApplyingConflictResolutions"
        @apply="handleApplyConflictResolutions" />
      <div class="flex shrink-0 justify-end gap-2">
        <ScalarButton
          size="xs"
          type="button"
          variant="ghost"
          @click="syncModal.hide()">
          Close
        </ScalarButton>
        <ScalarButton
          :disabled="
            syncStatus === 'running' ||
            syncStatus === 'conflicts' ||
            isApplyingConflictResolutions
          "
          size="xs"
          type="button"
          variant="outlined"
          @click="runSyncTest">
          {{ syncStatus === 'running' ? 'Testing...' : 'Run Again' }}
        </ScalarButton>
      </div>
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
