<script lang="ts">
export type ModalProps = {
  activeEntities: ActiveEntities
  workspaceStore: WorkspaceStore
  modalState: ModalState
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
} from '@scalar/components'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap'
import {
  nextTick,
  onBeforeMount,
  onBeforeUnmount,
  ref,
  useId,
  watch,
} from 'vue'

import { Sidebar } from '@/v2/components/sidebar'
import TempReplaceMe from '@/v2/components/TempReplaceMe.vue'
import type { ActiveEntities } from '@/v2/features/modal/helpers/create-api-client-modal'

const { workspaceStore, activeEntities, modalState } = defineProps<ModalProps>()

const client = ref<HTMLElement | null>(null)
const id = useId()

const { activate: activateFocusTrap, deactivate: deactivateFocusTrap } =
  useFocusTrap(client, {
    allowOutsideClick: true,
    fallbackFocus: `#${id}`,
  })

/**
 * Close the modal on escape
 *
 * We must add a global listener here becuase sometimes the focus will be shifted to the body
 */
const onEscape = (ev: KeyboardEvent) => ev.key === 'Escape' && modalState.hide()

/** Clean up listeners on modal close and unmount */
const cleanUpListeners = () => {
  window.removeEventListener('keydown', onEscape)
  document.documentElement.style.removeProperty('overflow')
  deactivateFocusTrap()
}

watch(
  () => modalState.open,
  (open) => {
    if (open) {
      // Add the escape key listener
      window.addEventListener('keydown', onEscape)

      // Disable scrolling
      document.documentElement.style.overflow = 'hidden'

      // Focus trap the modal
      activateFocusTrap({ checkCanFocusTrap: () => nextTick() })
    } else {
      cleanUpListeners()
    }
  },
)

// Ensure we add our scalar wrapper class to the headless ui root
onBeforeMount(() => addScalarClassesToHeadless())

onBeforeUnmount(() => {
  cleanUpListeners()
})

/** Controls the visibility of the sidebar */
const isSidebarOpen = ref(true)
</script>

<template>
  <div
    v-show="modalState.open"
    class="scalar scalar-app">
    <div class="scalar-container">
      <div
        :id="id"
        ref="client"
        aria-label="API Client"
        aria-modal="true"
        class="scalar-app-layout scalar-client flex"
        role="dialog"
        tabindex="-1">
        <ScalarTeleportRoot>
          <main class="flex flex-1 flex-row">
            <Sidebar
              v-show="isSidebarOpen"
              v-model:isSidebarOpen="isSidebarOpen"
              :documents="workspaceStore.workspace.documents"
              layout="modal"
              :sidebarWidth="
                workspaceStore.workspace['x-scalar-sidebar-width'] ?? 288
              "
              @update:sidebarWidth="
                (width) =>
                  workspaceStore.update('x-scalar-sidebar-width', width)
              " />

            <!-- Insert the operation page here -->
            <TempReplaceMe
              :documentSlug="activeEntities.documentSlug"
              :example="activeEntities.example"
              layout="modal"
              :method="activeEntities.method"
              :path="activeEntities.path"
              :workspaceStore="workspaceStore"
              workspaceSlug="default" />
          </main>
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
.scalar .scalar-app-exit:before {
  font-family: sans-serif;
  position: absolute;
  top: 0;
  right: 0;
  font-size: 30px;
  font-weight: 100;
  line-height: 50px;
  right: 12px;
  text-align: center;
  color: white;
  opacity: 0.6;
}
.scalar .scalar-app-exit:hover:before {
  opacity: 1;
}
@keyframes scalardrawerexitfadein {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.scalar-container {
  overflow: hidden;
  visibility: visible;
  position: fixed;
  bottom: 0;
  left: 0;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  @apply z-overlay;
}

.scalar .url-form-input {
  min-height: auto !important;
}

.scalar .scalar-container {
  line-height: normal;
}
.scalar .scalar-app-header span {
  color: var(--scalar-color-3);
}
.scalar .scalar-app-header a {
  color: var(--scalar-color-1);
}
.scalar .scalar-app-header a:hover {
  text-decoration: underline;
}
.scalar-activate {
  width: fit-content;
  margin: 0px 0.75rem 0.75rem auto;
  line-height: 24px;
  font-size: 0.75rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}
.scalar-activate-button {
  display: flex;
  gap: 6px;
  align-items: center;
  color: var(--scalar-color-blue);
  appearance: none;
  outline: none;
  border: none;
  background: transparent;
}
.scalar-activate-button {
  padding: 0 0.5rem;
}
.scalar-activate:hover .scalar-activate-button {
  background: var(--scalar-background-3);
  border-radius: 3px;
}
</style>
