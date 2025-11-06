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
import { isDefined } from '@scalar/helpers/array/is-defined'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { isHttpMethod } from '@scalar/helpers/http/is-http-method'
import { createSidebarState, type SidebarState } from '@scalar/sidebar'
import { getThemeStyles } from '@scalar/themes'
import { useColorMode } from '@scalar/use-hooks/useColorMode'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import {
  xScalarEnvironmentSchema,
  type XScalarEnvironment,
} from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { computed, ref, watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'

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
const router = useRouter()

const workspaceSlug = computed(
  () => (route.params.workspaceSlug as string | undefined) ?? 'default',
)

const documentSlug = computed(
  () => route.params.documentSlug as string | undefined,
)

/** Grab the document from the slug */
const document = computed(() =>
  documentSlug.value
    ? (workspaceStore.workspace.documents[documentSlug.value] ?? null)
    : null,
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

//-------------------------------------------------------------------------------------------------------
// SIDEBAR STATE AND SELECTION HANDLING
//-------------------------------------------------------------------------------------------------------
/** Generate the sidebar state based on the current workspace */
const sidebarState = computed(() => {
  const entries = Object.values(workspaceStore.workspace.documents)
    .map((doc) => doc['x-scalar-navigation'])
    .filter(isDefined)
  return createSidebarState(entries) as SidebarState<TraversedEntry>
})

/** Keep the router and the sidebar state in sync */
watch(
  [workspaceSlug, documentSlug, path, method, exampleName],
  ([newWorkspace, newDocument, newPath, newMethod, newExample]) => {
    const entry = sidebarState.value.getEntryByLocation({
      documentName: newDocument as string,
      path: newPath as string,
      method: newMethod as HttpMethod,
      example: newExample as string,
    })

    console.log({ newWorkspace })

    if (entry) {
      sidebarState.value.setSelected(entry.id)
      sidebarState.value.setExpanded(entry.id, true)
    }
  },
  {
    immediate: true,
  },
)

const handleSelectItem = (id: string) => {
  const state = sidebarState.value
  const entry = state.getEntryById(id)

  if (!entry) {
    console.warn(`Could not find sidebar entry with id ${id} to select`)
    return
  }

  // Navigate to the document overview page
  if (entry.type === 'document') {
    state.setSelected(id)
    state.setExpanded(id, !state.isExpanded(id))
    return router.push({
      name: 'document.overview',
      params: { documentSlug: entry.name },
    })
  }

  // Navigate to the example page
  // TODO: temporary until we have the operation overview page
  if (entry.type === 'operation') {
    // If we are already in the operation, just toggle expansion
    if (state.isSelected(id)) {
      state.setExpanded(id, !state.isExpanded(id))
      return
    }

    const firstExample = entry.children?.find(
      (child) => child.type === 'example',
    )

    if (firstExample) {
      state.setSelected(firstExample.id)
      state.setExpanded(firstExample.id, true)
    } else {
      state.setSelected(id)
    }

    return router.push({
      name: 'example',
      params: {
        documentSlug: state.getParent('document', entry)?.name,
        pathEncoded: encodeURIComponent(entry.path),
        method: entry.method,
        exampleName: firstExample?.name ?? 'default',
      },
    })
  }

  // Navigate to the example page
  if (entry.type === 'example') {
    state.setSelected(id)
    state.setExpanded(id, true)
    const operation = state.getParent('operation', entry)
    return router.push({
      name: 'example',
      params: {
        documentSlug: state.getParent('document', entry)?.name,
        pathEncoded: encodeURIComponent(operation?.path ?? ''),
        method: operation?.method,
        exampleName: entry.name,
      },
    })
  }

  state.setExpanded(id, !state.isExpanded(id))
  return
}

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
  ] ?? { variables: [] }
  const documentEnv = document.value?.['x-scalar-environments']?.[
    activeEnv
  ] ?? { variables: [] }

  // Merge the workspace and document environments
  return coerceValue(xScalarEnvironmentSchema, {
    ...workspaceEnv,
    ...documentEnv,
    variables: [...workspaceEnv.variables, ...documentEnv.variables],
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

    <main class="flex flex-1">
      <!-- App sidebar -->
      <AppSidebar
        v-show="isSidebarOpen"
        v-model:isSidebarOpen="isSidebarOpen"
        v-model:workspace="workspaceModel"
        :sidebarState="sidebarState"
        :isWorkspaceOpen="Boolean(workspaceSlug && !documentSlug)"
        @click:workspace="
          router.push({
            name: 'workspace.cookies',
            params: { workspaceSlug },
          })
        "
        :layout
        :sidebarWidth="
          workspaceStore.workspace['x-scalar-sidebar-width'] ?? 288
        "
        @update:sidebarWidth="
          (width) => workspaceStore.update('x-scalar-sidebar-width', width)
        "
        @selectItem="handleSelectItem" />

      <!-- Popup command palette to add resources from anywhere -->
      <!-- <TheCommandPalette /> -->

      <!-- <ImportCollectionListener></ImportCollectionListener> -->

      <div class="bg-b-1 flex flex-1 flex-col">
        <RouterView v-slot="{ Component }">
          <keep-alive>
            <component
              :is="Component"
              :document
              :environment
              :eventBus
              :layout
              :workspaceStore
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
  min-height: 100dvh;
  background-color: var(--scalar-background-2);
}
.dark-mode #scalar-client {
  background-color: color-mix(in srgb, var(--scalar-background-1) 65%, black);
}
</style>
