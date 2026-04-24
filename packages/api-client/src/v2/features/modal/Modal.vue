<script lang="ts">
import type { MaybeRefOrGetter } from 'vue'

import type { ApiClientOptions } from '@/v2/types/options'

export type ModalProps = {
  /** The workspace store must be initialized and passed in */
  workspaceStore: WorkspaceStore
  /** The document must be initialized and passed in. OpenAPI-only — the modal has no AsyncAPI path. */
  document: ComputedRef<OpenApiDocument | null>
  /** The path must be initialized and passed in */
  path: ComputedRef<string | undefined>
  /** The event bus for handling all events */
  eventBus: WorkspaceEventBus
  /** The method must be initialized and passed in */
  method: ComputedRef<HttpMethod | undefined>
  /** The example name must be initialized and passed in */
  exampleName: ComputedRef<string | undefined>
  /** Selected anyOf/oneOf request-body variants keyed by schema path */
  requestBodyCompositionSelection: Ref<Record<string, number>>
  /** Controls the visibility of the modal */
  modalState: ModalState
  /** The sidebar state must be initialized and passed in */
  sidebarState: UseModalSidebarReturn
  /** Api client plugins to include in the modal */
  plugins: ClientPlugin[]
  /** Subset of the configuration options for the modal */
  options: MaybeRefOrGetter<ApiClientOptions>
}

/**
 * Scalar Api Client Modal
 *
 * This component is used to render the API Client Modal
 */
export default {}
</script>

<script setup lang="ts">
import { type ModalState, type ScalarListboxOption } from '@scalar/components'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { ClientPlugin } from '@scalar/oas-utils/helpers'
import { ScalarToasts } from '@scalar/use-toasts'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { type WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getActiveEnvironment } from '@scalar/workspace-store/request-example'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import {
  computed,
  onBeforeUnmount,
  ref,
  watch,
  type ComputedRef,
  type Ref,
} from 'vue'

import ModalClientContainer from '@/v2/components/modals/ModalClientContainer.vue'
import { Sidebar, SidebarToggle } from '@/v2/components/sidebar'
import { type UseModalSidebarReturn } from '@/v2/features/modal/hooks/use-modal-sidebar'
import { initializeModalEvents } from '@/v2/features/modal/modal-events'
import Operation from '@/v2/features/operation/Operation.vue'
import { useGlobalHotKeys } from '@/v2/hooks/use-global-hot-keys'
import { useScrollLock } from '@/v2/hooks/use-scroll-lock'
import type { ApiClientOptionsRef } from '@/v2/types/options'

const {
  document,
  eventBus,
  modalState,
  options,
  plugins,
  requestBodyCompositionSelection,
  sidebarState,
  workspaceStore,
} = defineProps<
  Omit<ModalProps, 'options'> & { options: ApiClientOptionsRef }
>()

const activeWorkspace: ScalarListboxOption = {
  label: 'default',
  id: 'default',
}

/** Controls the visibility of the sidebar. */
const isSidebarOpen = ref(false)

/** Initialize modal events */
initializeModalEvents({
  eventBus,
  isSidebarOpen,
  requestBodyCompositionSelection,
  sidebarState,
  modalState,
  store: workspaceStore,
})

/** Register global hotkeys for the app, passing the workspace event bus and layout state */
useGlobalHotKeys(eventBus, 'modal', () => !modalState.open)

/** Clean up on close */
const cleanUp = () => {
  eventBus.emit('operation:cancel:request')
}

const isLocked = useScrollLock(() => {
  if (typeof window !== 'undefined') {
    return window.document.body
  }
  return null
})

watch(
  () => modalState.open,
  (open) => {
    // Make sure scrolling is locked or unlocked when the modal is opened or closed
    isLocked.value = open

    if (!open) {
      cleanUp()
    }
  },
)

// Ensure we add our scalar wrapper class to the headless ui root
onBeforeUnmount(() => cleanUp())

/** Default sidebar width in pixels. */
const DEFAULT_SIDEBAR_WIDTH = 288

/** Width of the sidebar, with fallback to default. */
const sidebarWidth = computed(
  () =>
    workspaceStore?.workspace?.['x-scalar-sidebar-width'] ??
    DEFAULT_SIDEBAR_WIDTH,
)

/** Handler for sidebar width changes. */
const handleSidebarWidthUpdate = (width: number) =>
  workspaceStore?.update('x-scalar-sidebar-width', width)

/**
 * Merged environment variables from workspace and document levels.
 * Variables from both sources are combined, with document variables
 * taking precedence in case of naming conflicts.
 */
const environment = computed(
  () => getActiveEnvironment(workspaceStore, document.value).environment,
)

defineExpose({
  sidebarWidth,
  environment,
})
</script>

<template>
  <ModalClientContainer :modalState>
    <!-- Toasts -->
    <ScalarToasts />

    <!-- If we have a document, path and method, render the operation -->
    <main
      v-if="document.value && path?.value && method?.value"
      class="relative flex h-full min-h-0 w-full flex-1">
      <SidebarToggle
        v-model="isSidebarOpen"
        class="absolute top-2 left-4 z-10 max-md:top-4" />
      <Sidebar
        v-show="isSidebarOpen"
        v-model:sidebarWidth="sidebarWidth"
        :activeWorkspace="activeWorkspace"
        class="h-full max-md:absolute! max-md:z-5 max-md:w-full!"
        :documents="[document.value]"
        :eventBus
        :isDroppable="() => false"
        layout="modal"
        :sidebarState="sidebarState.state"
        :workspaces="[]"
        @selectItem="sidebarState.handleSelectItem"
        @update:sidebarWidth="handleSidebarWidthUpdate" />
      <Operation
        :activeWorkspace="activeWorkspace"
        class="flex-1"
        :document="document.value"
        :documentSlug="document.value['x-scalar-navigation']?.id ?? ''"
        :environment
        :eventBus
        :exampleName="exampleName?.value"
        layout="modal"
        :method="method?.value"
        :options
        :path="path?.value"
        :plugins
        :requestBodyCompositionSelection="requestBodyCompositionSelection.value"
        :workspaceStore />
    </main>
    <!-- Empty state -->
    <div
      v-else
      class="flex h-full w-full items-center justify-center">
      <span class="text-c-3">No document selected</span>
    </div>
  </ModalClientContainer>
</template>
