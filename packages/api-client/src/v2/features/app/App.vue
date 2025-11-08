<script lang="ts">
/**
 * Main entry point for the API client for electron and web.
 *
 * This component handles all events and store business logic for the application.
 */
export default {}
</script>

<script setup lang="ts">
import { ScalarTeleportRoot, useModal } from '@scalar/components'
import { isHttpMethod } from '@scalar/helpers/http/is-http-method'
import { getThemeStyles } from '@scalar/themes'
import { useColorMode } from '@scalar/use-hooks/useColorMode'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import {
  xScalarEnvironmentSchema,
  type XScalarEnvironment,
} from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { computed, ref } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'

import CreateWorkspaceModal from '@/v2/features/app/components/CreateWorkspaceModal.vue'
import type { RouteProps } from '@/v2/features/app/helpers/routes'
import { useSidebarState } from '@/v2/hooks/use-sidebar-state'
import { useWorkspaceClientEvents } from '@/v2/hooks/use-workspace-client-events'
import { useWorkspaceSelector } from '@/v2/hooks/use-workspace-selector'
import type { ClientLayout } from '@/v2/types/layout'

import AppSidebar from './components/AppSidebar.vue'
import DesktopTabs from './components/DesktopTabs.vue'
import WebTopNav from './components/WebTopNav.vue'

const { layout } = defineProps<{
  layout: Exclude<ClientLayout, 'modal'>
}>()

const route = useRoute()
const router = useRouter()

/** Extracts a string parameter from the route */
const getRouteParam = (paramName: string): string | undefined => {
  const param = route.params[paramName]
  return typeof param === 'string' ? param : undefined
}

/** Default sidebar width in pixels. */
const DEFAULT_SIDEBAR_WIDTH = 288

/** Initialize color mode to ensure it is set on mount. */
useColorMode()

/** Expose workspace store to window for debugging purposes. */
if (typeof window !== 'undefined') {
  // @ts-expect-error - For debugging purposes expose the store
  window.dataDumpWorkspace = () => store.value
}

/** Workspace event bus for handling workspace-level events. */
const eventBus = createWorkspaceEventBus()

/** Controls the visibility of the sidebar. */
const isSidebarOpen = ref(true)

/** Current workspace slug from the route, defaults to 'default'. */
const workspaceSlug = computed(() => getRouteParam('workspaceSlug'))

/** Current document slug from the route. */
const documentSlug = computed(() => getRouteParam('documentSlug'))

/**
 * The active document from the workspace store.
 * Returns null if no document is selected or the document does not exist.
 */
const document = computed(() => {
  if (!documentSlug.value || store.value === null) return null
  return store.value.workspace.documents[documentSlug.value] ?? null
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

// Workspace-related state and utilities derived from the workspaceSlug route param.
const { store, workspaces, activeWorkspace, setWorkspaceId, createWorkspace } =
  useWorkspaceSelector({
    workspaceId: workspaceSlug,
  })

/** Sidebar state and selection handling. */
const { handleSelectItem, sidebarState } = useSidebarState({
  workspaceStore: store,
  workspaceSlug,
  documentSlug,
  path,
  method,
  exampleName,
})

useWorkspaceClientEvents(eventBus, document, store)

/**
 * Merged environment variables from workspace and document levels.
 * Variables from both sources are combined, with document variables
 * taking precedence in case of naming conflicts.
 */
const environment = computed<XScalarEnvironment>(() => {
  if (store.value === null) {
    return coerceValue(xScalarEnvironmentSchema, {})
  }
  const activeEnv = store.value.workspace['x-scalar-active-environment']

  if (!activeEnv) {
    return coerceValue(xScalarEnvironmentSchema, {})
  }

  const workspaceEnv = store.value.workspace['x-scalar-environments']?.[
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
  if (store.value === null) {
    return ''
  }

  const themeId = store.value.workspace['x-scalar-theme']

  if (!themeId) return ''

  return `<style>${getThemeStyles(themeId)}</style>`
})

/** Width of the sidebar, with fallback to default. */
const sidebarWidth = computed(() => {
  if (store.value === null) {
    return DEFAULT_SIDEBAR_WIDTH
  }
  return (
    store.value.workspace['x-scalar-sidebar-width'] ?? DEFAULT_SIDEBAR_WIDTH
  )
})

/** Check if the workspace overview is currently open. */
const isWorkspaceOpen = computed(() =>
  Boolean(workspaceSlug.value && !documentSlug.value),
)

/** Handler for sidebar width changes. */
const handleSidebarWidthUpdate = (width: number) => {
  if (store.value === null) {
    return
  }

  store.value.update('x-scalar-sidebar-width', width)
}

/** Handler for workspace navigation. */
const handleWorkspaceClick = () =>
  router.push({
    name: 'workspace',
    params: { workspaceSlug: workspaceSlug.value },
  })

/**
 * Handler for selecting a workspace.
 * Sets the current workspace ID if provided.
 */
const handleSelectWorkspace = (id?: string) => {
  if (!id) {
    return
  }
  setWorkspaceId(id)
}

/** Props to pass to the RouterView component. */
const routerViewProps = computed(
  () =>
    ({
      document: document.value,
      environment: environment.value,
      eventBus,
      exampleName: exampleName.value,
      layout,
      method: method.value,
      path: path.value,
      workspaceStore: store.value!,
    }) satisfies RouteProps,
)

const createWorkspaceModalState = useModal()
</script>

<template>
  <template v-if="store !== null && activeWorkspace !== null">
    <div v-html="themeStyleTag" />
    <ScalarTeleportRoot>
      <!-- Desktop App Tabs -->
      <DesktopTabs v-if="layout === 'desktop'" />

      <!-- Web App Top Nav -->
      <WebTopNav
        v-else
        :activeWorkspace="activeWorkspace"
        :workspaces="workspaces"
        @select:workspace="handleSelectWorkspace"
        @create:workspace="createWorkspaceModalState.show()" />

      <!-- min-h-0 is required here for scrolling, do not remove it -->
      <main class="flex min-h-0 flex-1">
        <!-- App sidebar -->
        <AppSidebar
          v-show="isSidebarOpen"
          v-model:isSidebarOpen="isSidebarOpen"
          :activeWorkspace="activeWorkspace"
          :isWorkspaceOpen="isWorkspaceOpen"
          :layout="layout"
          :sidebarState="sidebarState"
          :sidebarWidth="sidebarWidth"
          :workspaces="workspaces"
          @click:workspace="handleWorkspaceClick"
          @select:workspace="handleSelectWorkspace"
          @selectItem="handleSelectItem"
          @update:sidebarWidth="handleSidebarWidthUpdate"
          @create:workspace="createWorkspaceModalState.show()" />

        <!-- Create workspace modal -->
        <CreateWorkspaceModal
          :state="createWorkspaceModalState"
          @create:workspace="(payload) => createWorkspace(payload)" />

        <!-- Popup command palette to add resources from anywhere -->
        <!-- <TheCommandPalette /> -->

        <!-- <ImportCollectionListener></ImportCollectionListener> -->

        <div class="bg-b-1 flex-1">
          <RouterView v-bind="routerViewProps" />
        </div>
      </main>
    </ScalarTeleportRoot>
  </template>
  <template v-else> Application is loading... </template>
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
