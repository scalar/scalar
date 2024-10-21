<script setup lang="ts">
// TODO: Disabled until we polished the UI.
// import { ImportCollectionListener } from '@/components/ImportCollection'
import { useDarkModeState } from '@/hooks'
import MainLayout from '@/layouts/App/MainLayout.vue'
import { handleHotKeyDown } from '@/libs'
import { useWorkspace } from '@/store'
import { addScalarClassesToHeadless } from '@scalar/components'
import { getThemeStyles } from '@scalar/themes'
import { ScalarToasts } from '@scalar/use-toasts'
import { computed, onBeforeMount, onBeforeUnmount, onMounted } from 'vue'
import { RouterView } from 'vue-router'

// Initialize dark mode state globally
useDarkModeState()

const workspaceStore = useWorkspace()
const { events } = workspaceStore

// Ensure we add our scalar wrapper class to the headless ui root
onBeforeMount(() => addScalarClassesToHeadless())

/** Handles the hotkey events, we will pass in custom hotkeys here */
const handleKeyDown = (ev: KeyboardEvent) =>
  handleHotKeyDown(ev, events.hotKeys)

// Hotkey listeners
onMounted(() => window.addEventListener('keydown', handleKeyDown))
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeyDown))

const themeStyleTag = computed(
  () =>
    workspaceStore.activeWorkspace.value &&
    `<style>${getThemeStyles(workspaceStore.activeWorkspace.value.themeId)}</style>`,
)
</script>
<template>
  <!-- Listen for paste and drop events, and look for `url` query parameters to import collections -->
  <!-- <ImportCollectionListener> -->
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
  <!-- </ImportCollectionListener> -->
</template>
<style>
@import '@scalar/components/style.css';
@import '@scalar/themes/style.css';
@import '@/assets/tailwind.css';
@import '@/assets/variables.css';

#scalar-client {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  position: relative;
  background-color: var(--scalar-background-2);
}
.dark-mode #scalar-client {
  background-color: color-mix(in srgb, var(--scalar-background-1) 30%, black);
}
</style>
