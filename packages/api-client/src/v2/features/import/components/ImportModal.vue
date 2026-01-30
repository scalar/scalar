<script setup lang="ts">
import {
  ScalarButton,
  ScalarIcon,
  ScalarModal,
  // useModal,
  type ModalState,
} from '@scalar/components'
import { normalize } from '@scalar/openapi-parser'
import type { UnknownObject } from '@scalar/types/utils'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import type { InMemoryWorkspace } from '@scalar/workspace-store/schemas/inmemory-workspace'
import { onUnmounted, ref, watch } from 'vue'

import WatchModeToggle from '@/components/CommandPalette/WatchModeToggle.vue'
import PrefetchError from '@/components/ImportCollection/PrefetchError.vue'
import { isUrl } from '@/v2/helpers/is-url'

const { source, modalState } = defineProps<{
  source: string | null
  modalState: ModalState
  companyLogo?: string | null
}>()

const emits = defineEmits<{
  (e: 'import:document', workspaceState: InMemoryWorkspace, name: string): void
}>()

const state = ref<'loading' | 'success' | 'error' | 'idle'>('idle')
const watchMode = ref(false)

const worksapceStore = createWorkspaceStore()

const DRAFT_DOCUMENT_NAME = 'draft'

const loadDocument = async () => {
  if (!source) {
    return false
  }

  // For url imports, we add the document to the workspace store
  if (isUrl(source)) {
    return await worksapceStore.addDocument({
      name: DRAFT_DOCUMENT_NAME,
      url: source,
    })
  }

  // For file imports, we need to normalize the content first
  // We can assert here cuz we know the content is a string
  const normalizedContent = normalize(source) as UnknownObject

  return await worksapceStore.addDocument({
    name: DRAFT_DOCUMENT_NAME,
    document: normalizedContent,
  })
}

// Function to add/remove class from body
const toggleBodyClass = (add: boolean) => {
  document.body.classList.remove('has-no-import-url')

  if (add && modalState.open) {
    document.body.classList.add('has-import-url')
  } else {
    document.body.classList.remove('has-import-url')
  }
}

/** Toggles the 'has-import-url' class on the body element */
const onModalClose = () => {
  document.body.classList.remove('has-import-url')
  document.body.classList.add('has-no-import-url')
}

const handleModalStateChange = async (isOpen: boolean) => {
  if (isOpen) {
    state.value = 'loading'

    const success = await loadDocument()

    if (!success) {
      state.value = 'error'
      return
    }

    state.value = 'success'
    return toggleBodyClass(true)
  }

  state.value = 'idle'
  return onModalClose()
}

// Watch for changes in the modal state
watch(() => modalState.open, handleModalStateChange)

// Cleanup
onUnmounted(onModalClose)
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
      <!-- Wait until the URL is fetched -->
      <div
        class="m-auto flex w-full max-w-[380px] flex-col items-center rounded-xl border px-8 py-8 transition-opacity"
        :class="{ 'opacity-0': state === 'loading' }">
        <!-- Prefetch error -->
        <!-- Or: Document doesn't even have an OpenAPI/Swagger version, something is probably wrong -->
        <template v-if="state === 'error'">
          <!-- Heading -->
          <div class="text-md mb-2 line-clamp-1 text-center font-bold">
            No OpenAPI document found
          </div>
          <PrefetchError :url="source" />
        </template>
        <!-- Success -->
        <template v-else>
          <!-- Company Logo -->
          <img
            v-if="companyLogo"
            alt="Logo"
            class="mb-2 w-full object-contain"
            :src="companyLogo" />

          <!-- Title -->
          <div
            v-if="!companyLogo"
            class="text-md mb-2 line-clamp-1 text-center font-bold">
            {{
              worksapceStore.workspace.activeDocument?.info.title ||
              'Untitled Document'
            }}
          </div>

          <div class="text-c-1 text-center text-sm font-medium text-balance">
            Import the OpenAPI document to instantly send API requests. No
            signup required.
          </div>

          <!-- Actions -->
          <template
            v-if="worksapceStore.workspace.activeDocument?.info.version">
            <div class="z-10 inline-flex w-full flex-col items-center gap-2">
              <!-- Button -->
              <ScalarButton
                class="mt-3 h-fit w-full rounded-lg px-6 py-2.5 font-bold"
                size="md"
                type="button"
                @click="
                  emits(
                    'import:document',
                    worksapceStore.exportWorkspace(),
                    DRAFT_DOCUMENT_NAME,
                  )
                ">
                Import Collection
              </ScalarButton>
            </div>
            <!-- Select the workspace -->
            <div class="flex justify-center">
              <div
                class="text-c-3 inline-flex items-center px-4 py-1 text-xs font-medium">
                Import to: {Placeholder (workspace selector)}
              </div>
            </div>
            <!-- Watch Mode -->
            <template v-if="source && isUrl(source)">
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
  .has-no-import-url,
  .has-import-url {
    max-width: 100dvw;
    overflow-x: hidden;
    contain: paint;
  }
  .has-no-import-url .scalar-client > main {
    opacity: 1;
    background: var(--scalar-background-1);
    animation: transform-restore-layout ease-in-out 0.3s forwards;
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
  .has-no-import-url .scalar-app,
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
