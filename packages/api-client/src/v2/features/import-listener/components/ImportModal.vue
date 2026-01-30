<script setup lang="ts">
import {
  ScalarButton,
  ScalarIcon,
  ScalarModal,
  type ModalState,
  type ScalarListboxOption,
} from '@scalar/components'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import type { InMemoryWorkspace } from '@scalar/workspace-store/schemas/inmemory-workspace'
import { computed, onUnmounted, ref, watch } from 'vue'

import WatchModeToggle from '@/components/CommandPalette/WatchModeToggle.vue'
import WorkspaceSelector from '@/v2/features/import-listener/components/WorkspaceSelector.vue'
import { loadDocumentFromSource } from '@/v2/features/import-listener/helpers/load-document-from-source'
import { isUrl } from '@/v2/helpers/is-url'

const {
  source,
  modalState,
  isLoading = false,
} = defineProps<{
  /** The source URL or content to import from (URL, file path, or raw content) */
  source: string | null
  /** Controls the visibility and state of the modal */
  modalState: ModalState
  /** Optional company logo URL to display in the import UI */
  companyLogo?: string | null
  /** Whether the workspace data is currently being loaded */
  isLoading?: boolean
  /**
   * The currently active workspace.
   * This represents the workspace that the user is currently working in.
   */
  activeWorkspace: { id: string; label: string } | null
  /**
   * The list of all available workspaces.
   * Used to render options for workspace switching and selection.
   */
  workspaces: ScalarListboxOption[]
}>()

const emits = defineEmits<{
  /** Emitted when the user wants to import a document */
  (e: 'import:document', workspaceState: InMemoryWorkspace, name: string): void
  /** Emitted when the user selects a workspace */
  (e: 'select:workspace', id?: string): void
  /** Emitted when the user wants to create a new workspace */
  (e: 'create:workspace', payload: { name: string }): void
}>()

/** The name used for imported documents */
const DRAFT_DOCUMENT_NAME = 'draft'

const state = ref<'loading' | 'success' | 'error' | 'idle'>('idle')
const watchMode = ref(false)
const workspaceStore = createWorkspaceStore()

/** The title of the active document or a fallback */
const documentTitle = computed(
  () =>
    workspaceStore.workspace.activeDocument?.info.title || 'Untitled Document',
)

/** Whether the document has a valid OpenAPI version */
const hasValidDocument = computed(
  () => !!workspaceStore.workspace.activeDocument?.info.version,
)

/** Whether the source is a URL that supports watch mode */
const supportsWatchMode = computed(() => source && isUrl(source))

/** Whether to show the loading state */
const isLoadingDocument = computed(() => state.value === 'loading')

/**
 * Manages body classes for modal state.
 * These classes are used to apply layout animations when the modal opens/closes.
 */
const updateBodyClasses = (add: boolean): void => {
  if (add && modalState.open) {
    document.body.classList.add('has-import-url')
  } else {
    document.body.classList.remove('has-import-url')
  }
}

/**
 * Handles modal state changes.
 * Loads the document when opening, and manages body classes.
 */
const handleModalStateChange = async (isOpen: boolean): Promise<void> => {
  if (!isOpen) {
    state.value = 'idle'
    updateBodyClasses(false)
  }

  // Add the class to the body
  updateBodyClasses(true)

  // Set the state to loading
  state.value = 'loading'

  const success = await loadDocumentFromSource(
    workspaceStore,
    source,
    DRAFT_DOCUMENT_NAME,
    watchMode.value,
  )

  // If the document failed to load, set the state to error
  if (!success) {
    state.value = 'error'
    return
  }

  // Set the state to success
  state.value = 'success'
  return
}

/**
 * Handles the import action.
 * Emits the document to the parent component.
 */
const handleImport = (): void => {
  emits(
    'import:document',
    workspaceStore.exportWorkspace(),
    DRAFT_DOCUMENT_NAME,
  )
}

watch(() => modalState.open, handleModalStateChange)

onUnmounted(() => updateBodyClasses(false))
</script>

<template>
  <ScalarModal
    size="full"
    :state="modalState">
    <div
      class="relative flex h-screen flex-col justify-center overflow-hidden px-6 md:px-0">
      <div class="section-flare">
        <div class="section-flare-item" />
        <div class="section-flare-item" />
        <div class="section-flare-item" />
        <div class="section-flare-item" />
        <div class="section-flare-item" />
        <div class="section-flare-item" />
        <div class="section-flare-item" />
        <div class="section-flare-item" />
      </div>
      <div
        class="m-auto flex w-full max-w-[380px] flex-col items-center rounded-xl border px-8 py-8 transition-opacity"
        :class="{ 'opacity-0': isLoadingDocument }">
        <!-- Error State -->
        <template v-if="state === 'error'">
          <div class="text-md mb-2 line-clamp-1 text-center font-bold">
            No OpenAPI document found
          </div>
          <div
            v-if="source && isUrl(source)"
            class="w-full text-center text-sm font-medium break-words">
            We couldn't find an OpenAPI document at the provided URL. Please
            download and import the
            <a
              :href="source"
              rel="noopener nofollow"
              target="_blank"
              v-text="'OpenAPI document manually'" />
          </div>
          <div
            v-else
            class="w-full text-center text-sm font-medium break-words">
            We can't import this document because it's not a valid OpenAPI
            document.
          </div>
        </template>

        <!-- Success State -->
        <template v-else>
          <img
            v-if="companyLogo"
            alt="Company Logo"
            class="mb-2 w-full object-contain"
            :src="companyLogo" />

          <div
            v-if="!companyLogo"
            class="text-md mb-2 line-clamp-1 text-center font-bold">
            {{ documentTitle }}
          </div>

          <div class="text-c-1 text-center text-sm font-medium text-balance">
            Import the OpenAPI document to instantly send API requests. No
            signup required.
          </div>

          <template v-if="hasValidDocument">
            <div class="z-10 inline-flex w-full flex-col items-center gap-2">
              <ScalarButton
                class="mt-3 h-fit w-full rounded-lg px-6 py-2.5 font-bold"
                :disabled="isLoading"
                size="md"
                type="button"
                @click="handleImport">
                Import Collection
              </ScalarButton>
            </div>

            <div class="flex justify-center">
              <div
                class="text-c-3 inline-flex items-center px-4 py-1 text-xs font-medium">
                Import to:
                <WorkspaceSelector
                  :activeWorkspace="activeWorkspace"
                  :workspaces="workspaces"
                  @create:workspace="
                    (payload) => emits('create:workspace', payload)
                  "
                  @select:workspace="(id) => emits('select:workspace', id)" />
              </div>
            </div>

            <template v-if="supportsWatchMode">
              <div class="mt-5 overflow-hidden border-t pt-4 text-sm">
                <div class="flex items-center justify-center">
                  <WatchModeToggle
                    v-model="watchMode"
                    :disableToolTip="true" />
                </div>
                <div
                  class="text-c-3 pt-0 text-center text-xs font-medium text-balance">
                  Automatically update your API client when the OpenAPI document
                  content changes.
                </div>
              </div>
            </template>
          </template>
        </template>
      </div>
      <!-- Download Link -->
      <div class="flex flex-col items-center justify-center pb-8">
        <div class="flex flex-col items-center text-center">
          <div
            class="mb-2 flex h-10 w-10 items-center justify-center rounded-[10px] border">
            <a
              href="https://scalar.com/download"
              target="_blank">
              <ScalarIcon
                icon="Logo"
                size="xl" />
            </a>
          </div>
          <span class="text-c-2 text-sm leading-snug font-medium">
            <a
              class="hover:text-c-1 mb-1 inline-block underline-offset-2"
              href="https://scalar.com/download"
              target="_blank">
              Download Desktop App
            </a>
            <br />
            free · open-source · offline first
          </span>
        </div>
      </div>
    </div>
  </ScalarModal>
</template>
<style>
@reference "@/style.css";

@variant md {
  .has-import-url {
    max-width: 100dvw;
    overflow-x: hidden;
    contain: paint;
  }

  .has-import-url .scalar-client > main {
    opacity: 0;
    transform: scale(0.85) translate3d(calc(50dvw + 80px), 0, 0);
    animation: transform-fade-layout ease-in-out 0.3s forwards;
    border: var(--scalar-border-width) solid var(--scalar-border-color);
    border-radius: 12px;
    overflow: hidden;
    z-index: 10000;
  }
  .has-import-url .scalar-client nav {
    display: none;
  }
  .has-import-url .scalar-app {
    background: var(--scalar-background-1) !important;
  }
}
@keyframes transform-fade-layout {
  0% {
    opacity: 0;
    transform: scale(0.85) translate3d(calc(50dvw + 80px), 10px, 0);
  }
  100% {
    opacity: 1;
    transform: scale(0.85) translate3d(calc(50dvw + 80px), 0, 0);
  }
}
@keyframes transform-restore-layout {
  0% {
    opacity: 1;
    transform: scale(0.85) translate3d(calc(50dvw + 80px), 0, 0);
  }
  100% {
    opacity: 1;
    transform: scale(1) translate3d(0, 0, 0);
  }
}
.openapi-color {
  color: var(--scalar-color-green);
}
.section-flare {
  position: fixed;
  top: 0;
  right: -50dvw;
}
</style>
