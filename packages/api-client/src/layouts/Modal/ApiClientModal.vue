<script setup lang="ts">
import { type HotKeyEvent, handleHotKeyDown } from '@/libs'
import { useWorkspace } from '@/store'
import { addScalarClassesToHeadless } from '@scalar/components'
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap'
import {
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  provide,
  useTemplateRef,
  watch,
} from 'vue'
import { RouterView } from 'vue-router'

const { activeWorkspace, modalState, events } = useWorkspace()
const client = useTemplateRef('client')
const { activate: activateFocusTrap, deactivate: deactivateFocusTrap } =
  useFocusTrap(client, {
    allowOutsideClick: true,
    initialFocus: () => client.value,
  })

// Provide the layout value
provide('layout', 'modal')

/** Handles the hotkey events as well as custom config */
const handleKeyDown = (ev: KeyboardEvent) =>
  handleHotKeyDown(ev, events.hotKeys, activeWorkspace.value.hotKeyConfig)

watch(
  () => modalState.open,
  (open) => {
    if (open) {
      // Add the global hotkey listener
      window.addEventListener('keydown', handleKeyDown)
      // Disable scrolling
      document.documentElement.style.overflow = 'hidden'
      // Wait for the animation to finish then focus trap the client
      setTimeout(() => activateFocusTrap(), 400)
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
    <div class="scalar-container z-overlay">
      <div
        ref="client"
        aria-label="API Client"
        aria-modal="true"
        class="scalar-app-layout scalar-client"
        role="dialog"
        tabindex="0">
        <RouterView key="$route.fullPath" />
      </div>
      <div
        class="scalar-app-exit -z-1"
        @click="modalState.hide()" />
    </div>
  </div>
</template>

<style>
@import '@scalar/components/style.css';
@import '@/assets/tailwind.css';
@import '@/assets/variables.css';
</style>

<style scoped>
.scalar .scalar-api-client {
  max-height: calc(100% - calc(var(--scalar-app-header-height)));
  border-radius: 8px;
}
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
