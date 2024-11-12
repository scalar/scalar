<script setup lang="ts">
import { ImportCollectionListener } from '@/components/ImportCollection'
import { useDarkModeState } from '@/hooks'
import MainLayout from '@/layouts/App/MainLayout.vue'
import { type HotKeyEvent, handleHotKeyDown } from '@/libs'
import { useWorkspace } from '@/store'
import { addScalarClassesToHeadless } from '@scalar/components'
import { getThemeStyles } from '@scalar/themes'
import { useGoodbye } from '@scalar/use-hooks/useGoodbye'
import { useHello } from '@scalar/use-hooks/useHello'
import { ScalarToasts } from '@scalar/use-toasts'
import { computed, onBeforeMount, onBeforeUnmount, onMounted } from 'vue'
import { RouterView } from 'vue-router'

// Initialize dark mode state globally
useDarkModeState()

// Test the useHello and useGoodbye hooks
useHello()
useGoodbye()

const workspaceStore = useWorkspace()
const { events } = workspaceStore

// Ensure we add our scalar wrapper class to the headless ui root
onBeforeMount(() => addScalarClassesToHeadless())

/** Handles the hotkey events, we will pass in custom hotkeys here */
const handleKeyDown = (ev: KeyboardEvent) =>
  handleHotKeyDown(ev, events.hotKeys)

const handleHotKey = (event?: HotKeyEvent) => {
  if (!event) return

  // We prevent default on open command so we can use it on the web
  if (event.openCommandPalette) {
    event.openCommandPalette.preventDefault()
    events.commandPalette.emit()
  }
}

// Hotkey listeners
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  events.hotKeys.on(handleHotKey)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
  events.hotKeys.off(handleHotKey)
})

const themeStyleTag = computed(
  () =>
    workspaceStore.activeWorkspace.value &&
    `<style>${getThemeStyles(workspaceStore.activeWorkspace.value.themeId)}</style>`,
)
</script>
<template>
  <!-- Listen for paste and drop events, and look for `url` query parameters to import collections -->
  <ImportCollectionListener>
    <div v-html="themeStyleTag"></div>

    <!-- Ensure we have the workspace loaded from localStorage above -->
    <MainLayout v-if="workspaceStore.activeWorkspace.value?.uid">
      <RouterView v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </RouterView>
    </MainLayout>

    <ScalarToasts />
  </ImportCollectionListener>
</template>
<style>
@import '@scalar/components/style.css';
@import '@scalar/themes/style.css';
@import '@/assets/tailwind.css';
@import '@/assets/variables.css';

/** Add background for iOS and Safari scroll overflow */
html,
body {
  background-color: var(--scalar-background-1);
  overscroll-behavior: none;
}

#scalar-client {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  width: 100dvw;
  position: relative;
  background-color: var(--scalar-background-2);
}
.dark-mode #scalar-client {
  background-color: color-mix(in srgb, var(--scalar-background-1) 30%, black);
}
</style>
