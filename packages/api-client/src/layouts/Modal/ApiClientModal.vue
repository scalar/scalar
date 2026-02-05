<script setup lang="ts">
import {
  addScalarClassesToHeadless,
  ScalarTeleportRoot,
} from '@scalar/components'
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap'
import {
  nextTick,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  ref,
  useId,
  watch,
} from 'vue'
import { RouterView } from 'vue-router'

import { handleHotKeyDown, type HotKeyEvent } from '@/libs'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'

const { activeWorkspace } = useActiveEntities()
const { modalState, events } = useWorkspace()
const client = ref<HTMLElement | null>(null)
const id = useId()

const { activate: activateFocusTrap, deactivate: deactivateFocusTrap } =
  useFocusTrap(client, {
    allowOutsideClick: true,
    fallbackFocus: `#${id}`,
  })

/** Handles the hotkey events as well as custom config */
const handleKeyDown = (ev: KeyboardEvent) =>
  handleHotKeyDown(ev, events.hotKeys, activeWorkspace.value?.hotKeyConfig)

watch(
  () => modalState.open,
  (open) => {
    if (open) {
      // Add the global hotkey listener
      window.addEventListener('keydown', handleKeyDown)
      // Disable scrolling
      document.documentElement.style.overflow = 'hidden'

      // Focus trap the modal
      activateFocusTrap({ checkCanFocusTrap: () => nextTick() })
    } else {
      // Remove the global hotkey listener
      window.removeEventListener('keydown', handleKeyDown)
      // Restore scrolling
      document.documentElement.style.removeProperty('overflow')
      // Remove the focus trap
      deactivateFocusTrap()
    }
  },
)

// Ensure we add our scalar wrapper class to the headless ui root
onBeforeMount(() => addScalarClassesToHeadless())

// Close on escape
const onCloseModal = (event?: HotKeyEvent) =>
  event?.closeModal && modalState.open && modalState.hide()
onMounted(() => events.hotKeys.on(onCloseModal))

onBeforeUnmount(() => {
  // Make sure scrolling is back!
  document.documentElement.style.removeProperty('overflow')
  events.hotKeys.off(onCloseModal)
})
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
        class="scalar-app-layout scalar-client"
        role="dialog"
        tabindex="-1">
        <ScalarTeleportRoot>
          <RouterView key="$route.fullPath" />
        </ScalarTeleportRoot>
      </div>
      <div
        class="scalar-app-exit"
        @click="modalState.hide()" />
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
/*
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
</style>
