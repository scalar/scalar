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
import { isHttpMethod } from '@scalar/helpers/http/is-http-method'
import { getThemeStyles } from '@scalar/themes'
import { useColorMode } from '@scalar/use-hooks/useColorMode'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { computed, ref } from 'vue'
import { RouterView, useRoute } from 'vue-router'

import { useWorkspaceClientEvents } from '@/v2/hooks/use-workspace-client-events'
import type { ClientLayout } from '@/v2/types/layout'

import AppSidebar from './components/AppSidebar.vue'
import DesktopTabs from './components/DesktopTabs.vue'
import WebTopNav from './components/WebTopNav.vue'

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

/** Controls the visibility of the sidebar */
const isSidebarOpen = ref(true)

/** Workspace event bus */
const eventBus = createWorkspaceEventBus()

const route = useRoute()

/** Grab the document from the slug */
const document = computed(
  () =>
    workspaceStore.workspace.documents[route.params.documentSlug as string] ??
    null,
)

const path = computed(() => {
  const pathEncoded = route.params.pathEncoded

  return pathEncoded && typeof pathEncoded === 'string'
    ? decodeURIComponent(pathEncoded)
    : undefined
})

const method = computed(() => {
  const methodParam = route.params.method

  return methodParam &&
    typeof methodParam === 'string' &&
    isHttpMethod(methodParam)
    ? methodParam
    : undefined
})

const exampleName = computed(() => {
  const exampleNameParam = route.params.exampleName

  return exampleNameParam && typeof exampleNameParam === 'string'
    ? exampleNameParam
    : undefined
})

/** Event handler */
useWorkspaceClientEvents(eventBus, document)
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
      <!-- App sidebar -->
      <AppSidebar
        v-show="isSidebarOpen"
        v-model:isSidebarOpen="isSidebarOpen"
        v-model:workspace="workspaceModel"
        :documents="workspaceStore.workspace.documents"
        :layout="layout"
        :sidebarWidth="
          workspaceStore.workspace['x-scalar-sidebar-width'] ?? 288
        "
        @update:sidebarWidth="
          (width) => workspaceStore.update('x-scalar-sidebar-width', width)
        " />

      <!-- Popup command palette to add resources from anywhere -->
      <!-- <TheCommandPalette /> -->

      <!-- <ImportCollectionListener></ImportCollectionListener> -->

      <div class="bg-b-1 flex min-h-0 min-w-0 flex-1 flex-col">
        <RouterView v-slot="{ Component }">
          <keep-alive>
            <component
              :is="Component"
              :document="document"
              :eventBus="eventBus"
              :layout="layout"
              :workspaceStore="workspaceStore"
              :path="path"
              :method="method"
              :exampleName="exampleName" />
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
