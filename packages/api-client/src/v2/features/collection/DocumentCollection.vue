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
  ScalarIconDownload,
  ScalarIconFloppyDisk,
  ScalarIconSpinner,
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
import { downloadAsFile } from '@/v2/helpers/download-document'

import LabelInput from './components/LabelInput.vue'
import SyncConflictResolutionEditor from './components/SyncConflictResolutionEditor.vue'
import Tabs from './components/Tabs.vue'

const props = defineProps<RouteProps>()

/** Snag the title from the info object */
const title = computed(() => props.document?.info?.title ?? '')

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
  () => props.document?.['x-scalar-original-source-url'] as string | undefined,
)

const documentRegistryMeta = computed(
  () =>
    props.document?.['x-scalar-registry-meta'] as
      | { namespace: string; slug: string }
      | undefined,
)

/** Show Sync when the document has a source URL or registry meta (registry can be used if fetchRegistryDocument is set). */
const canShowSyncButton = computed(
  () =>
    documentSourceUrl.value !== undefined ||
    documentRegistryMeta.value !== undefined,
)

const { toast } = useToasts()

const undoChanges = () => {
  props.workspaceStore.revertDocumentChanges(props.documentSlug)
}

const saveChanges = () => {
  props.workspaceStore.saveDocument(props.documentSlug)
}

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

const handleSaveThenCloseDirtyModal = async () => {
  await props.workspaceStore.saveDocument(props.documentSlug)
  dirtyBeforeSyncModal.hide()
  await handleSyncFlow()
}

const handleDiscardThenCloseDirtyModal = async () => {
  await props.workspaceStore.revertDocumentChanges(props.documentSlug)
  dirtyBeforeSyncModal.hide()
  await handleSyncFlow()
}

const isSyncInProgress = ref(false)

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

/**
 * Resolves the source for syncing. Registry meta has priority over x-scalar-original-source-url
 * when fetchRegistryDocument is provided. Returns either a URL or the full document object.
 */
const resolveSyncInput = async (): Promise<
  { url: string } | { document: Record<string, unknown> } | null
> => {
  const registryMeta = documentRegistryMeta.value
  if (registryMeta && props.fetchRegistryDocument) {
    try {
      const result = await props.fetchRegistryDocument(registryMeta)
      if (!result.ok) {
        toast(result.error, 'error')
        return null
      }
      return { document: result.data }
    } catch (err) {
      toast('Failed to resolve document from registry', 'error')
      return null
    }
  }
  const url = documentSourceUrl.value
  if (url) {
    return { url }
  }
  return null
}

/**
 * Handles actions to perform when synchronization is complete.
 * Hides the sync modal, resets the sync progress flag, and emits the
 * 'hooks:on:rebase:document:complete' event with document metadata.
 */
const onSyncComplete = () => {
  syncModal.hide()
  isSyncInProgress.value = false
  // Display the toast to show that the sync is complete
  toast(
    'Your document has been rebased with the latest version from the source.',
    'info',
  )
  // Emit the event to notify other components that the sync is complete
  props.eventBus.emit('hooks:on:rebase:document:complete', {
    meta: {
      documentName: props.documentSlug,
    },
  })
}

/**
 * Handles errors that occur during synchronization.
 * If an error string is provided, it displays the error via toast.
 * Always resets the sync progress flag.
 */
const onSyncError = (error: string | null) => {
  if (error !== null) {
    toast(error, 'error')
  }
  isSyncInProgress.value = false
}

/**
 * Handles the synchronization flow for a document.
 * Checks for unsaved changes, resolves source (registry over URL),
 * initiates rebasing, handles conflicts, and emits completion events.
 * If conflicts are detected, a modal dialog is shown for user resolution.
 */
const handleSyncFlow = async () => {
  if (isDocumentDirty.value) {
    dirtyBeforeSyncModal.show()
    return
  }

  if (isSyncInProgress.value) {
    return
  }

  isSyncInProgress.value = true

  const input = await resolveSyncInput()
  if (!input) {
    onSyncError(null)
    return
  }

  const result = await props.workspaceStore.rebaseDocument({
    name: props.documentSlug,
    ...input,
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
    } else {
      // If there is no conflict just rebase immediately
      await rebaseResult.value?.applyChanges({
        resolvedDocument: rebaseResult.value.resolvedDocument,
      })
      onSyncComplete()
    }
  } else if (result?.ok === false && result.type === 'NO_CHANGES_DETECTED') {
    // Emit the event either way even if there was no need to rebase the document
    onSyncComplete()
  } else {
    onSyncError('Failed to sync document')
  }
}

/*
 * Handles applying changes to the current document after conflict resolution.
 * Emits a completion event and hides the sync modal dialog.
 */
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

/**
 * Resets sync state when the sync conflict modal is closed (dismissed or after
 * applying changes). Ensures the Sync button is re-enabled and conflict state
 * is cleared.
 */
const onSyncModalClose = () => {
  isSyncInProgress.value = false
  rebaseResult.value = null
}
</script>

<template>
  <div class="custom-scroll h-full">
    <div
      v-if="document"
      class="w-full px-3 md:mx-auto md:max-w-180">
      <!-- Header -->
      <div
        :aria-label="`title: ${title}`"
        class="mx-auto flex h-fit w-full flex-col gap-2 pt-14 pb-3 md:max-w-180 md:pt-6">
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

          <ScalarButton
            v-if="canShowSyncButton"
            class="text-c-2 hover:text-c-1 shrink-0 gap-1.5"
            data-testid="document-sync-button"
            :disabled="isSyncInProgress"
            size="xs"
            :title="'Pull the latest version from the document source and merge with your local copy. Save your changes first if you have unsaved edits.'"
            type="button"
            variant="ghost"
            @click="handleSyncFlow">
            <ScalarIconSpinner
              v-if="isSyncInProgress"
              class="size-3.5 animate-spin"
              size="sm" />
            <ScalarIconCloudArrowDown
              v-else
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
    :state="syncModal"
    @close="onSyncModalClose">
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
