<script lang="ts">
/**
 * Main entry point for the API client for electron and web
 *
 * This will be the brains of the client, should handle all events and store business logic
 */
export default {}
</script>

<script setup lang="ts">
import { ScalarTeleportRoot } from '@scalar/components'
import { getThemeStyles } from '@scalar/themes'
import { useColorMode } from '@scalar/use-hooks/useColorMode'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { computed, ref } from 'vue'
import { RouterView } from 'vue-router'

import type { ClientLayout } from '@/v2/types/layout'

import DesktopTabs from './DesktopTabs.vue'
import Sidebar from './Sidebar.vue'
import WebTopNav from './WebTopNav.vue'

const { layout, workspaceStore } = defineProps<{
  layout: Exclude<ClientLayout, 'modal'>
  workspaceStore: WorkspaceStore
}>()

// To set the initial color mode as the switch isn't showing
useColorMode()

if (typeof window !== 'undefined') {
  // @ts-expect-error - For debugging purposes expose the store
  window.dataDumpWorkspace = () => workspaceStore
}

/** Generate the theme style tag */
const themeStyleTag = computed(() => {
  const themeId = workspaceStore.workspace['x-scalar-theme']
  if (!themeId) {
    return ''
  }

  return `<style>${getThemeStyles(themeId)}</style>`
})

// Temp until we have workspaces in the store
const workspaceModel = ref('default')
</script>

<template>
  <div v-html="themeStyleTag" />
  <ScalarTeleportRoot>
    <!-- Desktop App Tabs -->
    <DesktopTabs v-if="layout === 'desktop'" />

    <!-- Web App Top Nav -->
    <WebTopNav
      v-else
      v-model="workspaceModel" />

    <!-- min-h-0 is to allow scrolling of individual flex children, do not remove it -->
    <main class="flex min-h-0 flex-1 flex-row items-stretch">
      <!-- Global sidebar -->
      <Sidebar
        v-model="workspaceModel"
        :documents="workspaceStore.workspace.documents"
        :layout="layout" />

      <!-- Popup command palette to add resources from anywhere -->
      <!-- <TheCommandPalette /> -->

      <!-- <ImportCollectionListener></ImportCollectionListener> -->

      <div class="flex min-h-0 min-w-0 flex-1 flex-col">
        <RouterView v-slot="{ Component }">
          <keep-alive>
            <component
              :is="Component"
              :layout="layout" />
          </keep-alive>
        </RouterView>
      </div>
    </main>
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
