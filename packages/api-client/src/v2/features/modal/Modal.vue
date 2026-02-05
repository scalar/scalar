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
import {
  addScalarClassesToHeadless,
  ScalarTeleportRoot,
  type ModalState,
  type ScalarListboxOption,
} from '@scalar/components'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'
import { ScalarToasts } from '@scalar/use-toasts'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { type WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas'
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap'
import {
  computed,
  nextTick,
  onBeforeMount,
  onBeforeUnmount,
  ref,
  toValue,
  useId,
  watch,
  type ComputedRef,
  type MaybeRefOrGetter,
} from 'vue'

import { mergeSecurity } from '@/v2/blocks/scalar-auth-selector-block/helpers/merge-security'
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

const client = ref<HTMLElement | null>(null)
const id = useId()

const { activate: activateFocusTrap, deactivate: deactivateFocusTrap } =
  useFocusTrap(client, {
    allowOutsideClick: true,
    fallbackFocus: `#${id}`,
  })

/** Clean up on close */
const cleanUp = () => {
  deactivateFocusTrap()
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

    if (open) {
      // Focus trap the modal
      activateFocusTrap({ checkCanFocusTrap: () => nextTick() })
    } else {
      cleanUp()
    }
  },
)

// Ensure we add our scalar wrapper class to the headless ui root
onBeforeMount(() => addScalarClassesToHeadless())
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
  <div
    v-show="modalState.open"
    class="scalar scalar-app">
    <div class="scalar-container">
      <!-- 
      adding v-show also here to ensure proper rendering in Safari.
      @see https://github.com/scalar/scalar/issues/7983
      -->
      <div
        v-show="modalState.open"
        :id="id"
        ref="client"
        aria-label="API Client"
        aria-modal="true"
        class="scalar-app-layout scalar-client flex"
        role="dialog"
        tabindex="-1">
        <ScalarTeleportRoot>
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
        </ScalarTeleportRoot>
      </div>
      <div
        class="scalar-app-exit"
        @click="modalState.hide()"></div>
    </div>
  </div>
</template>
<style scoped>
@reference "@/style.css";

.scalar .scalar-app-layout {
  background: var(--scalar-background-1);
  height: calc(100% - 120px);
  max-width: 1390px;
  width: 100%;
  margin: auto;
  opacity: 0;
  animation: scalarapiclientfadein 0.35s forwards;
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  border: var(--scalar-border-width) solid var(--scalar-border-color);
}
/**
 * Allow the modal to fill more space on
 * very short (or very zoomed in) screens
 */
@variant zoomed {
  .scalar .scalar-app-layout {
    height: 100%;
    max-height: 90svh;
  }
}
@keyframes scalarapiclientfadein {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.scalar .scalar-app-exit {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #00000038;
  transition: all 0.3s ease-in-out;
  cursor: pointer;
  animation: scalardrawerexitfadein 0.35s forwards;
  z-index: -1;
}
.dark-mode .scalar .scalar-app-exit {
  background: rgba(0, 0, 0, 0.45);
}
@keyframes scalardrawerexitfadein {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.scalar .scalar-app-exit:before {
  font-family: sans-serif;
  position: absolute;
  top: 0;
  right: 12px;
  font-size: 30px;
  font-weight: 100;
  line-height: 50px;
  text-align: center;
  color: white;
  opacity: 0.6;
}
.scalar .scalar-app-exit:hover:before {
  opacity: 1;
}
.scalar-container {
  overflow: hidden;
  visibility: visible;
  position: fixed;
  bottom: 0;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  @apply z-overlay;
}
.scalar .scalar-container {
  line-height: normal;
}

.scalar .url-form-input {
  min-height: auto !important;
}
</style>
