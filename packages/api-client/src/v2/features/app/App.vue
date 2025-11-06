<script lang="ts">
/**
 * Main entry point for the API client for electron and web.
 *
 * This component handles all events and store business logic for the application.
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
import {
  xScalarEnvironmentSchema,
  type XScalarEnvironment,
} from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { computed, ref } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'

import { useSidebarState } from '@/v2/hooks/use-sidebar-state'
import { useWorkspaceClientEvents } from '@/v2/hooks/use-workspace-client-events'
import type { ClientLayout } from '@/v2/types/layout'

import AppSidebar from './components/AppSidebar.vue'
import DesktopTabs from './components/DesktopTabs.vue'
import WebTopNav from './components/WebTopNav.vue'

const { layout, workspaceStore } = defineProps<{
  layout: Exclude<ClientLayout, 'modal'>
  workspaceStore: WorkspaceStore
}>()

/** Default sidebar width in pixels. */
const DEFAULT_SIDEBAR_WIDTH = 288

/** Initialize color mode to ensure it is set on mount. */
useColorMode()

/** Expose workspace store to window for debugging purposes. */
if (typeof window !== 'undefined') {
  // @ts-expect-error - For debugging purposes expose the store
  window.dataDumpWorkspace = () => workspaceStore
}

/**
 * Extracts a string parameter from the route.
 * Returns undefined if the parameter is missing or not a string.
 */
const getRouteParam = (paramName: string): string | undefined => {
  const param = route.params[paramName]
  return typeof param === 'string' ? param : undefined
}

const route = useRoute()
const router = useRouter()

/** Workspace event bus for handling workspace-level events. */
const eventBus = createWorkspaceEventBus()

/** Temporary workspace model until workspaces are fully integrated. */
const workspaceModel = ref('default')

/** Controls the visibility of the sidebar. */
const isSidebarOpen = ref(true)

/** Current workspace slug from the route, defaults to 'default'. */
const workspaceSlug = computed(
  () => getRouteParam('workspaceSlug') ?? 'default',
)

/** Current document slug from the route. */
const documentSlug = computed(() => getRouteParam('documentSlug'))

/**
 * The active document from the workspace store.
 * Returns null if no document is selected or the document does not exist.
 */
const document = computed(() => {
  if (!documentSlug.value) return null
  return workspaceStore.workspace.documents[documentSlug.value] ?? null
})

/** Decoded path parameter from the route. */
const path = computed(() => {
  const pathEncoded = getRouteParam('pathEncoded')
  return pathEncoded ? decodeURIComponent(pathEncoded) : undefined
})

/** HTTP method from the route, validated against known HTTP methods */
const method = computed(() => {
  const methodParam = getRouteParam('method')
  return methodParam && isHttpMethod(methodParam) ? methodParam : undefined
})

/** Example name from the route. */
const exampleName = computed(() => getRouteParam('exampleName'))

/** Sidebar state and selection handling. */
const { handleSelectItem, sidebarState } = useSidebarState({
  workspaceStore,
  workspaceSlug,
  documentSlug,
  path,
  method,
  exampleName,
})

/** Initialize workspace client event handlers. */
useWorkspaceClientEvents(eventBus, document, workspaceStore)

/**
 * Merged environment variables from workspace and document levels.
 * Variables from both sources are combined, with document variables
 * taking precedence in case of naming conflicts.
 */
const environment = computed<XScalarEnvironment>(() => {
  const activeEnv = workspaceStore.workspace['x-scalar-active-environment']

  if (!activeEnv) {
    return coerceValue(xScalarEnvironmentSchema, {})
  }

  const workspaceEnv = workspaceStore.workspace['x-scalar-environments']?.[
    activeEnv
  ] ?? {
    variables: [],
  }
  const documentEnv = document.value?.['x-scalar-environments']?.[
    activeEnv
  ] ?? {
    variables: [],
  }

  return coerceValue(xScalarEnvironmentSchema, {
    ...workspaceEnv,
    ...documentEnv,
    variables: [...workspaceEnv.variables, ...documentEnv.variables],
  })
})

/** Generate the theme style tag for dynamic theme application. */
const themeStyleTag = computed(() => {
  const themeId = workspaceStore.workspace['x-scalar-theme']

  if (!themeId) return ''

  return `<style>${getThemeStyles(themeId)}</style>`
})

/** Width of the sidebar, with fallback to default. */
const sidebarWidth = computed(
  () =>
    workspaceStore.workspace['x-scalar-sidebar-width'] ?? DEFAULT_SIDEBAR_WIDTH,
)

/** Check if the workspace overview is currently open. */
const isWorkspaceOpen = computed(() =>
  Boolean(workspaceSlug.value && !documentSlug.value),
)

/** Handler for sidebar width changes. */
const handleSidebarWidthUpdate = (width: number) =>
  workspaceStore.update('x-scalar-sidebar-width', width)

/** Handler for workspace navigation. */
const handleWorkspaceClick = () =>
  router.push({
    name: 'workspace',
    params: { workspaceSlug: workspaceSlug.value },
  })

/** Props to pass to the RouterView component. */
const routerViewProps = computed(() => ({
  document: document.value,
  environment: environment.value,
  eventBus,
  exampleName: exampleName.value,
  layout,
  method: method.value,
  path: path.value,
  workspaceStore,
}))
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

    <!-- min-h-0 is required here for scrolling, do not remove it -->
    <main class="flex min-h-0 flex-1">
      <!-- App sidebar -->
      <AppSidebar
        v-show="isSidebarOpen"
        v-model:isSidebarOpen="isSidebarOpen"
        v-model:workspace="workspaceModel"
        :isWorkspaceOpen="isWorkspaceOpen"
        :layout="layout"
        :sidebarState="sidebarState"
        :sidebarWidth="sidebarWidth"
        @click:workspace="handleWorkspaceClick"
        @selectItem="handleSelectItem"
        @update:sidebarWidth="handleSidebarWidthUpdate" />

      <!-- Popup command palette to add resources from anywhere -->
      <!-- <TheCommandPalette /> -->

      <!-- <ImportCollectionListener></ImportCollectionListener> -->

      <div class="bg-b-1 flex-1">
        <RouterView v-bind="routerViewProps" />
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
