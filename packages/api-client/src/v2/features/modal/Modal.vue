<script lang="ts">
export type ModalProps = {
  /** The workspace store must be initialized and passed in */
  workspaceStore: WorkspaceStore
  /** The document must be initialized and passed in */
  document: ComputedRef<WorkspaceDocument | null>
  /** The path must be initialized and passed in */
  path: ComputedRef<string | undefined>
  /** The event bus for handling all events */
  eventBus: WorkspaceEventBus
  /** The method must be initialized and passed in */
  method: ComputedRef<HttpMethod | undefined>
  /** The example name must be initialized and passed in */
  exampleName: ComputedRef<string | undefined>
  /** Controls the visibility of the modal */
  modalState: ModalState
  /** The sidebar state must be initialized and passed in */
  sidebarState: UseModalSidebarReturn
  /** Api client plugins to include in the modal */
  plugins: ClientPlugin[]
  /** Subset of the configuration options for the modal */
  options: MaybeRefOrGetter<
    Partial<
      Pick<
        ApiReferenceConfigurationRaw,
        | 'authentication'
        | 'baseServerURL'
        | 'hideClientButton'
        | 'hiddenClients'
        | 'servers'
      >
    >
  >
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
import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'
import { ScalarToasts } from '@scalar/use-toasts'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { type WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas'
import {
  computed,
  onBeforeUnmount,
  ref,
  toValue,
  watch,
  type ComputedRef,
  type MaybeRefOrGetter,
} from 'vue'

import { mergeSecurity } from '@/v2/blocks/scalar-auth-selector-block/helpers/merge-security'
import ModalClientContainer from '@/v2/components/modals/ModalClientContainer.vue'
import { Sidebar, SidebarToggle } from '@/v2/components/sidebar'
import { type UseModalSidebarReturn } from '@/v2/features/modal/hooks/use-modal-sidebar'
import { initializeModalEvents } from '@/v2/features/modal/modal-events'
import Operation from '@/v2/features/operation/Operation.vue'
import { getActiveEnvironment } from '@/v2/helpers/get-active-environment'
import type { ClientPlugin } from '@/v2/helpers/plugins'
import { useGlobalHotKeys } from '@/v2/hooks/use-global-hot-keys'
import { useScrollLock } from '@/v2/hooks/use-scroll-lock'

const {
  document,
  eventBus,
  modalState,
  options,
  plugins,
  sidebarState,
  workspaceStore,
} = defineProps<ModalProps>()

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
  sidebarState,
  modalState,
  store: workspaceStore,
})

/** Register global hotkeys for the app, passing the workspace event bus and layout state */
useGlobalHotKeys(eventBus, 'modal')

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
const environment = computed(() =>
  getActiveEnvironment(workspaceStore, document.value),
)

/** Merge authentication config with the document security schemes */
const securitySchemes = computed(() =>
  mergeSecurity(
    document.value?.components?.securitySchemes,
    toValue(options)?.authentication?.securitySchemes,
    workspaceStore.auth,
    document.value?.['x-scalar-navigation']?.name ?? '',
  ),
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
      class="relative flex flex-1">
      <SidebarToggle
        v-model="isSidebarOpen"
        class="absolute top-2 left-3 z-[10001]" />
      <Sidebar
        v-show="isSidebarOpen"
        v-model:sidebarWidth="sidebarWidth"
        :activeWorkspace="activeWorkspace"
        class="z-[10000] h-full max-md:absolute! max-md:w-full!"
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
        :securitySchemes
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
