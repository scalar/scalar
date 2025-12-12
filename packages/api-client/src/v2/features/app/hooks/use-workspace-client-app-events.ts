import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { CollectionType, CommandPaletteAction, WorkspaceEventBus } from '@scalar/workspace-store/events'
import { mergeObjects } from '@scalar/workspace-store/helpers/merge-object'
import {
  type OperationExampleMeta,
  addOperationParameter,
  addOperationRequestBodyFormRow,
  addServer,
  addTab,
  closeOtherTabs,
  closeTab,
  createEmptyDocument,
  createOperation,
  createTag,
  deleteAllOperationParameters,
  deleteCookie,
  deleteDocument,
  deleteOperation,
  deleteOperationExample,
  deleteOperationParameter,
  deleteOperationRequestBodyFormRow,
  deleteSecurityScheme,
  deleteServer,
  deleteTag,
  focusLastTab,
  focusTab,
  navigateNextTab,
  navigatePreviousTab,
  toggleSecurity,
  updateActiveProxy,
  updateColorMode,
  updateDocumentIcon,
  updateOperationParameter,
  updateOperationPathMethod,
  updateOperationRequestBodyContentType,
  updateOperationRequestBodyExample,
  updateOperationRequestBodyFormRow,
  updateOperationSummary,
  updateSecurityScheme,
  updateSelectedAuthTab,
  updateSelectedScopes,
  updateSelectedSecuritySchemes,
  updateSelectedServer,
  updateServer,
  updateServerVariables,
  updateTabs,
  updateTheme,
  updateWatchMode,
  upsertCookie,
  upsertEnvironment,
  upsertEnvironmentVariable,
} from '@scalar/workspace-store/mutators'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas/workspace'
import { type ComputedRef, type Ref, toValue } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import type { UseAppSidebarReturn } from '@/v2/features/app/hooks/use-app-sidebar'
import type { UseCommandPaletteStateReturn } from '@/v2/features/command-palette/hooks/use-command-palette-state'

/**
 * Top level state mutation handling for the workspace store in the client
 */
export const useWorkspaceClientAppEvents = ({
  eventBus,
  document,
  workspaceStore,
  isSidebarOpen,
  commandPaletteState,
  sidebarState,
}: {
  eventBus: WorkspaceEventBus
  document: ComputedRef<WorkspaceDocument | null>
  workspaceStore: Ref<WorkspaceStore | null>
  isSidebarOpen: Ref<boolean>
  commandPaletteState: UseCommandPaletteStateReturn
  sidebarState: UseAppSidebarReturn
}) => {
  /** Use route[r] for some redirect business */
  const router = useRouter()

  /** Use route for the path variables */
  const route = useRoute()

  /** Selects between the workspace or document based on the type */
  const getCollection = (
    document: ComputedRef<WorkspaceDocument | null>,
    collectionType: CollectionType['collectionType'],
  ) => {
    const store = toValue(workspaceStore)

    if (!store) {
      return null
    }

    return collectionType === 'document' ? document.value : store.workspace
  }

  /**
   * Navigates to the currently active tab's path using the router.
   * Returns early if the workspace store or active tab is unavailable.
   */
  const navigateToCurrentTab = async (): Promise<void> => {
    const store = toValue(workspaceStore)
    if (!store) {
      return
    }

    const activeTabIndex = store.workspace['x-scalar-active-tab'] ?? 0
    const activeTab = store.workspace['x-scalar-tabs']?.[activeTabIndex]
    if (!activeTab) {
      return
    }

    await router.replace(activeTab.path)
  }

  /**
   * Rebuilds the sidebar for the given document.
   * This is used to refresh the sidebar state after structural changes (e.g. after adding or removing items).
   *
   * @param documentName - The name (id) of the document for which to rebuild the sidebar
   */
  const rebuildSidebar = (documentName: string | undefined) => {
    if (documentName) {
      workspaceStore.value?.buildSidebar(documentName)
    }
  }

  /**
   * Ensures the sidebar is refreshed after a new example is created.
   *
   * If the sidebar entry for the new example does not exist or is of a different type,
   * this will rebuild the sidebar for the current document. This helps keep the sidebar state
   * consistent (e.g., after adding a new example via the UI).
   */
  const refreshSidebarAfterExampleCreation = (payload: OperationExampleMeta) => {
    const documentName = document.value?.['x-scalar-navigation']?.name
    if (!documentName) {
      return
    }

    const entry = sidebarState.getEntryByLocation({
      document: documentName,
      path: payload.path,
      method: payload.method,
      example: payload.exampleKey,
    })

    if (!entry || entry.type !== 'example') {
      // Sidebar entry for this example doesn't exist, so rebuild sidebar for consistency.
      rebuildSidebar(documentName)
    }
    return
  }

  /**
   * Checks if the current route params match the specified operation meta.
   * Useful for determining if the sidebar or UI needs to be updated after changes to operations/examples.
   */
  const isRouteParamsMatch = ({
    documentName,
    path,
    method,
    exampleName,
  }: {
    documentName: string
    path?: string
    method?: HttpMethod
    exampleName?: string
  }) => {
    if (documentName !== undefined && documentName !== route.params.documentSlug) {
      return false
    }
    if (path !== undefined && encodeURIComponent(path) !== route.params.pathEncoded) {
      return false
    }
    if (method !== undefined && method !== route.params.method) {
      return false
    }
    if (exampleName !== undefined && exampleName !== route.params.exampleName) {
      return false
    }
    return true
  }

  //------------------------------------------------------------------------------------
  // Navigation Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('scroll-to:nav-item', ({ id }) => sidebarState.handleSelectItem(id))

  //------------------------------------------------------------------------------------
  // Workspace Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('workspace:update:active-proxy', (payload) =>
    updateActiveProxy(workspaceStore.value?.workspace ?? null, payload),
  )
  eventBus.on('workspace:update:color-mode', (payload) =>
    updateColorMode(workspaceStore.value?.workspace ?? null, payload),
  )
  eventBus.on('workspace:update:theme', (payload) => updateTheme(workspaceStore.value?.workspace ?? null, payload))

  //------------------------------------------------------------------------------------
  // Document Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('document:update:icon', (icon) => updateDocumentIcon(document.value, icon))
  eventBus.on('document:update:info', (info) => document.value && mergeObjects(document.value.info, info))
  eventBus.on('document:toggle:security', () => toggleSecurity(document.value))
  eventBus.on('document:update:watch-mode', (watchMode: boolean) => updateWatchMode(document.value, watchMode))
  eventBus.on('document:create:empty-document', (payload) => createEmptyDocument(workspaceStore.value, payload))
  eventBus.on('document:delete:document', async (payload) => {
    deleteDocument(workspaceStore.value, payload)
    // Redirect to the workspace environment page if the document was deleted
    if (route.params.documentSlug === payload.name) {
      await router.push({
        name: 'workspace.environment',
      })
    }
  })

  //------------------------------------------------------------------------------------
  // Environment Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('environment:upsert:environment', (payload) => {
    if (!workspaceStore.value) {
      return
    }
    upsertEnvironment(document.value, workspaceStore.value.workspace, payload)
  })

  eventBus.on(
    'environment:delete:environment',
    ({ environmentName, collectionType }) =>
      delete getCollection(document, collectionType)?.['x-scalar-environments']?.[environmentName],
  )

  eventBus.on('environment:upsert:environment-variable', (payload) => {
    const collection = getCollection(document, payload.collectionType)
    upsertEnvironmentVariable(collection, payload)
  })

  eventBus.on('environment:delete:environment-variable', ({ environmentName, index, collectionType }) =>
    getCollection(document, collectionType)?.['x-scalar-environments']?.[environmentName]?.variables?.splice(index, 1),
  )

  //------------------------------------------------------------------------------------
  // Cookie Related Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('cookie:upsert:cookie', (payload) => {
    const collection = getCollection(document, payload.collectionType)
    upsertCookie(collection, payload)
  })
  eventBus.on('cookie:delete:cookie', (payload) => {
    const collection = getCollection(document, payload.collectionType)
    deleteCookie(collection, payload)
  })

  //------------------------------------------------------------------------------------
  // Auth Related Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('auth:delete:security-scheme', (payload) => deleteSecurityScheme(document.value, payload))
  eventBus.on('auth:update:active-index', (payload) => updateSelectedAuthTab(document.value, payload))
  eventBus.on('auth:update:security-scheme', (payload) => updateSecurityScheme(document.value, payload))
  eventBus.on('auth:update:selected-scopes', (payload) => updateSelectedScopes(document.value, payload))
  eventBus.on(
    'auth:update:selected-security-schemes',
    async (payload) => await updateSelectedSecuritySchemes(document.value, payload),
  )

  //------------------------------------------------------------------------------------
  // Server Related Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('server:add:server', () => addServer(document.value))
  eventBus.on('server:update:server', (payload) => updateServer(document.value, payload))
  eventBus.on('server:delete:server', (payload) => deleteServer(document.value, payload))
  eventBus.on('server:update:variables', (payload) => updateServerVariables(document.value, payload))
  eventBus.on('server:update:selected', (payload) => updateSelectedServer(document.value, payload))

  //------------------------------------------------------------------------------------
  // Operation Related Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('operation:create:operation', (payload) => createOperation(workspaceStore.value, payload))
  eventBus.on('operation:update:pathMethod', (payload) =>
    updateOperationPathMethod(document.value, workspaceStore.value, payload, async (status) => {
      // Redirect to the new example if the mutation was successful
      if (status === 'success') {
        await router.replace({
          name: 'example',
          params: {
            method: payload.payload.method,
            pathEncoded: encodeURIComponent(payload.payload.path),
            exampleName: route.params.exampleName,
          },
        })

        // Rebuild the sidebar with the updated order
        rebuildSidebar(document.value?.['x-scalar-navigation']?.name)

        // Focus the address bar
        eventBus.emit('ui:focus:address-bar')
      }
      payload.callback(status)
    }),
  )
  eventBus.on('operation:update:summary', (payload) => updateOperationSummary(document.value, payload))
  eventBus.on('operation:delete:operation', async (payload) => {
    deleteOperation(workspaceStore.value, payload)
    rebuildSidebar(payload.documentName)
    if (
      isRouteParamsMatch({
        documentName: payload.documentName,
        path: payload.meta.path,
        method: payload.meta.method,
      })
    ) {
      await router.replace({
        name: 'document.overview',
        params: {
          documentSlug: payload.documentName,
        },
      })
    }
  })
  eventBus.on('operation:delete:example', async (payload) => {
    deleteOperationExample(workspaceStore.value, payload)
    rebuildSidebar(payload.documentName)
    if (
      isRouteParamsMatch({
        documentName: payload.documentName,
        path: payload.meta.path,
        method: payload.meta.method,
        exampleName: payload.meta.exampleKey,
      })
    ) {
      await router.replace({
        name: 'example',
        params: {
          pathEncoded: encodeURIComponent(payload.meta.path),
          method: payload.meta.method,
          documentSlug: payload.documentName,
          exampleName: 'default',
        },
      })
    }
  })
  eventBus.on('operation:add:parameter', (payload) => {
    addOperationParameter(document.value, payload)
    refreshSidebarAfterExampleCreation(payload.meta)
  })
  eventBus.on('operation:update:parameter', (payload) => {
    updateOperationParameter(document.value, payload)
    // When updating a path parameter, we need to check if we are creating a new example
    refreshSidebarAfterExampleCreation(payload.meta)
  })
  eventBus.on('operation:delete:parameter', (payload) => deleteOperationParameter(document.value, payload))
  eventBus.on('operation:delete-all:parameters', (payload) => deleteAllOperationParameters(document.value, payload))

  //------------------------------------------------------------------------------------
  // Operation Request Body Related Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('operation:update:requestBody:contentType', (payload) =>
    updateOperationRequestBodyContentType(document.value, payload),
  )
  eventBus.on('operation:update:requestBody:value', (payload) => {
    updateOperationRequestBodyExample(document.value, payload)
    refreshSidebarAfterExampleCreation(payload.meta)
  })
  eventBus.on('operation:add:requestBody:formRow', (payload) => {
    addOperationRequestBodyFormRow(document.value, payload)
    refreshSidebarAfterExampleCreation(payload.meta)
  })
  eventBus.on('operation:update:requestBody:formRow', (payload) =>
    updateOperationRequestBodyFormRow(document.value, payload),
  )
  eventBus.on('operation:delete:requestBody:formRow', (payload) =>
    deleteOperationRequestBodyFormRow(document.value, payload),
  )

  //------------------------------------------------------------------------------------
  // Tag Related Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('tag:create:tag', (payload) => {
    createTag(workspaceStore.value, payload)
    rebuildSidebar(payload.documentName)
  })
  eventBus.on('tag:delete:tag', (payload) => {
    deleteTag(workspaceStore.value, payload)
    rebuildSidebar(payload.documentName)
  })

  //------------------------------------------------------------------------------------
  // UI Related Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('ui:toggle:sidebar', () => (isSidebarOpen.value = !isSidebarOpen.value))
  eventBus.on(
    'ui:open:command-palette',
    <P extends CommandPaletteAction['action']>(payload: CommandPaletteAction<P> | undefined) => {
      if (payload) {
        commandPaletteState.open(payload.action, payload.payload)
      } else {
        commandPaletteState.open()
      }
    },
  )

  //------------------------------------------------------------------------------------
  // Tabs Related Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('tabs:add:tab', async (payload) => {
    addTab(workspaceStore.value?.workspace ?? null, payload)
    await navigateToCurrentTab()
  })
  eventBus.on('tabs:close:tab', async (payload) => {
    closeTab(workspaceStore.value?.workspace ?? null, payload)
    await navigateToCurrentTab()
  })
  eventBus.on('tabs:close:other-tabs', (payload) => closeOtherTabs(workspaceStore.value?.workspace ?? null, payload))
  eventBus.on('tabs:focus:tab', async (payload) => {
    focusTab(workspaceStore.value?.workspace ?? null, payload)
    await navigateToCurrentTab()
  })
  eventBus.on('tabs:focus:tab-last', async (payload) => {
    focusLastTab(workspaceStore.value?.workspace ?? null, payload)
    await navigateToCurrentTab()
  })
  eventBus.on('tabs:navigate:previous', async (payload) => {
    navigatePreviousTab(workspaceStore.value?.workspace ?? null, payload)
    await navigateToCurrentTab()
  })
  eventBus.on('tabs:navigate:next', async (payload) => {
    navigateNextTab(workspaceStore.value?.workspace ?? null, payload)
    await navigateToCurrentTab()
  })
  eventBus.on('tabs:update:tabs', async (payload) => {
    updateTabs(workspaceStore.value?.workspace ?? null, payload)
    await navigateToCurrentTab()
  })
}
