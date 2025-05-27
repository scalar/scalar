<script setup lang="ts">
// TODO: Disabled until we polished the UI.
// import { ImportCollectionListener } from '@/components/ImportCollection'
import {
  addScalarClassesToHeadless,
  ScalarTeleportRoot,
} from '@scalar/components'
import { getThemeStyles } from '@scalar/themes'
import { useBreakpoints } from '@scalar/use-hooks/useBreakpoints'
import { useColorMode } from '@scalar/use-hooks/useColorMode'
import { ScalarToasts } from '@scalar/use-toasts'
import {
  computed,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'
import { RouterView } from 'vue-router'

import TopNav from '@/components/TopNav/TopNav.vue'
import { useSidebar } from '@/hooks/useSidebar'
import MainLayout from '@/layouts/App/MainLayout.vue'
import { DEFAULT_HOTKEYS, handleHotKeyDown, type HotKeyEvent } from '@/libs'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'

import { APP_HOTKEYS } from './hotkeys'

defineEmits<{
  (e: 'newTab', item: { name: string; uid: string }): void
}>()

const hotKeys = { ...DEFAULT_HOTKEYS, ...APP_HOTKEYS }

const newTab = ref<{ name: string; uid: string } | null>(null)

const handleNewTab = (item: { name: string; uid: string }) => {
  newTab.value = item
}

// Initialize color mode state globally
useColorMode()

const { activeWorkspace } = useActiveEntities()
const { events } = useWorkspace()

// Ensure we add our scalar wrapper class to the headless ui root
onBeforeMount(() => addScalarClassesToHeadless())

/** Handles the hotkey events, we will pass in custom hotkeys here */
const handleKeyDown = (ev: KeyboardEvent) =>
  handleHotKeyDown(ev, events.hotKeys, { hotKeys })

const handleHotKey = (event?: HotKeyEvent) => {
  if (!event) {
    return
  }

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

const { mediaQueries } = useBreakpoints()
const { setSidebarOpen } = useSidebar()

// Single watcher instance for handling responsive behavior
watch(mediaQueries.xl, setSidebarOpen, {
  immediate: true,
})

const themeStyleTag = computed(
  () =>
    activeWorkspace.value &&
    `<style>${getThemeStyles(activeWorkspace.value?.themeId)}</style>`,
)
</script>
<template>
  <ScalarTeleportRoot>
    <div
      id="scalar-client-app"
      class="contents">
      <!-- Listen for paste and drop events, and look for `url` query parameters to import collections -->
      <!-- <ImportCollectionListener> -->
      <div v-html="themeStyleTag" />
      <TopNav :openNewTab="newTab" />

      <!-- Ensure we have the workspace loaded from localStorage above -->
      <MainLayout v-if="activeWorkspace?.uid">
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
    </div>
  </ScalarTeleportRoot>
</template>
<style>
#scalar-client {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  width: 100dvw;
  position: relative;
  background-color: var(--scalar-background-2);
}
.dark-mode #scalar-client {
  background-color: color-mix(in srgb, var(--scalar-background-1) 65%, black);
}
</style>
