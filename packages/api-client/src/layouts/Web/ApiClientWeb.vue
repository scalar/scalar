<script setup lang="ts">
import {
  addScalarClassesToHeadless,
  ScalarTeleportRoot,
} from '@scalar/components'
import { getThemeStyles } from '@scalar/themes'
import { useBreakpoints } from '@scalar/use-hooks/useBreakpoints'
import { useColorMode } from '@scalar/use-hooks/useColorMode'
import { ScalarToasts } from '@scalar/use-toasts'
import { computed, onBeforeMount, onBeforeUnmount, onMounted, watch } from 'vue'
import { RouterView } from 'vue-router'

import { ImportCollectionListener } from '@/components/ImportCollection'
import { useSidebar } from '@/hooks/useSidebar'
import MainLayout from '@/layouts/App/MainLayout.vue'
import { handleHotKeyDown, type HotKeyEvent } from '@/libs'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'

// Initialize color mode state globally
useColorMode()

const { activeWorkspace } = useActiveEntities()
const { events } = useWorkspace()

// Ensure we add our scalar wrapper class to the headless ui root
onBeforeMount(() => addScalarClassesToHeadless())

/** Handles the hotkey events, we will pass in custom hotkeys here */
const handleKeyDown = (ev: KeyboardEvent) =>
  handleHotKeyDown(ev, events.hotKeys)

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
    <!-- Listen for paste and drop events, and look for `url` query parameters to import collections -->
    <ImportCollectionListener>
      <div v-html="themeStyleTag" />

      <!-- Ensure we have the workspace loaded from localStorage above -->
      <MainLayout v-if="activeWorkspace?.uid">
        <RouterView v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </RouterView>
      </MainLayout>

      <ScalarToasts />
    </ImportCollectionListener>
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
