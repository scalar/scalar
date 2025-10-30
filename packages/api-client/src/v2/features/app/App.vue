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
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import {
  xScalarEnvironmentSchema,
  type XScalarEnvironment,
} from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
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
    Object.values(workspaceStore.workspace.documents)[0] ??
    null,
)

/** Event handler */
useWorkspaceClientEvents(eventBus, document, workspaceStore)

/** Discriminated and merged environment variables by name */
const environment = computed<XScalarEnvironment>(() => {
  const activeEnv = workspaceStore.workspace['x-scalar-active-environment']
  if (!activeEnv) {
    return coerceValue(xScalarEnvironmentSchema, {})
  }

  // Grab the correct environment from the workspace and document
  const workspaceEnv = workspaceStore.workspace['x-scalar-environments']?.[
    activeEnv
  ] ?? { variables: {} }
  const documentEnv = document.value?.['x-scalar-environments']?.[
    activeEnv
  ] ?? { variables: {} }

  // Merge the workspace and document environments
  return coerceValue(xScalarEnvironmentSchema, {
    ...workspaceEnv,
    ...documentEnv,
    variables: { ...workspaceEnv.variables, ...documentEnv.variables },
  })
})
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
              :environment="environment"
              :eventBus="eventBus"
              :layout="layout"
              :workspaceStore="workspaceStore" />
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
