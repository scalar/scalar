<script setup lang="ts">
// TODO: Disabled until we polished the UI.
// import { ImportCollectionListener } from '@/components/ImportCollection'
import TopNav from '@/components/TopNav/TopNav.vue'
import { useDarkModeState } from '@/hooks'
import MainLayout from '@/layouts/App/MainLayout.vue'
import { DEFAULT_HOTKEYS, handleHotKeyDown } from '@/libs'
import { useWorkspace } from '@/store'
import { addScalarClassesToHeadless } from '@scalar/components'
import { getThemeStyles } from '@scalar/themes'
import { ScalarToasts } from '@scalar/use-toasts'
import { computed, onBeforeMount, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterView } from 'vue-router'

import { APP_HOTKEYS } from './hotkeys'

defineEmits<{
  (e: 'newTab', item: { name: string; uid: string }): void
}>()

const hotKeys = { ...DEFAULT_HOTKEYS, ...APP_HOTKEYS }

const newTab = ref<{ name: string; uid: string } | null>(null)

const handleNewTab = (item: { name: string; uid: string }) => {
  newTab.value = item
}

// Initialize dark mode state globally
useDarkModeState()

const workspaceStore = useWorkspace()
const { events } = workspaceStore

// Ensure we add our scalar wrapper class to the headless ui root
onBeforeMount(() => addScalarClassesToHeadless())

/** Handles the hotkey events, we will pass in custom hotkeys here */
const handleKeyDown = (ev: KeyboardEvent) =>
  handleHotKeyDown(ev, events.hotKeys, { hotKeys })

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
  <TopNav :openNewTab="newTab" />

  <!-- Ensure we have the workspace loaded from localStorage above -->
  <MainLayout v-if="workspaceStore.activeWorkspace.value?.uid">
    <RouterView
      v-slot="{ Component }"
      @newTab="handleNewTab">
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
  background-color: color-mix(in srgb, var(--scalar-background-1) 60%, black);
}
</style>
