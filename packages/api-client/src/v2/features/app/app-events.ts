import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { CollectionType, CommandPaletteAction, WorkspaceEventBus } from '@scalar/workspace-store/events'
import { mergeObjects } from '@scalar/workspace-store/helpers/merge-object'
import {
  type OperationExampleMeta,
  addOperationParameter,
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
  updateOperationRequestBodyFormValue,
  updateOperationSummary,
  updateSecurityScheme,
  updateSelectedAuthTab,
  updateSelectedClient,
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
import { type ComputedRef, type ShallowRef, computed } from 'vue'
import type { Router } from 'vue-router'

import type { OpenCommand } from '../command-palette/hooks/use-command-palette-state'

export function initializeAppEventHandlers({
  eventBus,
  getStore,
  document,
  router,
  rebuildSidebar,
  navigateToCurrentTab,
  onSelectSidebarItem,
  onAfterExampleCreation,
  onOpenCommandPalette,
  onCopyTabUrl,
  onToggleSidebar,
}: {
  eventBus: WorkspaceEventBus
  getStore: () => WorkspaceStore | null
  /** Current active document */
  document: ComputedRef<WorkspaceDocument | null>
  router: ShallowRef<Router | null>
  navigateToCurrentTab: () => Promise<void>
  rebuildSidebar: (documentName?: string) => void
  onSelectSidebarItem: (id: string) => void
  onAfterExampleCreation: (o: OperationExampleMeta) => void
  onOpenCommandPalette: OpenCommand
  onCopyTabUrl: (tabIndex: number) => void
  onToggleSidebar: () => void
}) {
  const currentRoute = computed(() => router.value?.currentRoute?.value)

  /**
   * Checks if the current route params match the specified operation meta.
   * Useful for determining if the sidebar or UI needs to be updated after changes to operations/examples.
   *
   * NOTE: It may be beneficial to compare to the active state instead of the router
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
    if (documentName !== undefined && documentName !== currentRoute.value?.params.documentSlug) {
      return false
    }
    if (path !== undefined && encodeURIComponent(path) !== currentRoute.value?.params.pathEncoded) {
      return false
    }
    if (method !== undefined && method !== currentRoute.value?.params.method) {
      return false
    }
    if (exampleName !== undefined && exampleName !== currentRoute.value?.params.exampleName) {
      return false
    }
    return true
  }

  /** Selects between the workspace or document based on the type */
  const getCollection = (document: WorkspaceDocument | null, collectionType: CollectionType['collectionType']) => {
    const store = getStore()
    if (!store) {
      return null
    }

    return collectionType === 'document' ? document : store.workspace
  }

  //------------------------------------------------------------------------------------
  // Navigation Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('scroll-to:nav-item', ({ id }) => onSelectSidebarItem(id))

  //------------------------------------------------------------------------------------
  // Workspace Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('workspace:update:active-proxy', (payload) => updateActiveProxy(getStore()?.workspace ?? null, payload))
  eventBus.on('workspace:update:color-mode', (payload) => updateColorMode(getStore()?.workspace ?? null, payload))
  eventBus.on('workspace:update:theme', (payload) => updateTheme(getStore()?.workspace ?? null, payload))
  eventBus.on('workspace:update:selected-client', (payload) => updateSelectedClient(getStore()?.workspace, payload))

  //------------------------------------------------------------------------------------
  // Document Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('document:update:icon', (icon) => updateDocumentIcon(document.value, icon))
  eventBus.on('document:update:info', (info) => document.value && mergeObjects(document.value.info, info))
  eventBus.on('document:toggle:security', () => toggleSecurity(document.value))
  eventBus.on('document:update:watch-mode', (watchMode: boolean) => updateWatchMode(document.value, watchMode))
  eventBus.on('document:create:empty-document', (payload) => createEmptyDocument(getStore(), payload))
  eventBus.on('document:delete:document', async (payload) => {
    deleteDocument(getStore(), payload)
    // Redirect to the workspace environment page if the document was deleted
    if (currentRoute?.value?.params.documentSlug === payload.name) {
      await router.value?.push({
        name: 'workspace.environment',
      })
    }
  })

  //------------------------------------------------------------------------------------
  // Environment Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('environment:upsert:environment', (payload) => {
    const store = getStore()

    if (!store) {
      return
    }
    upsertEnvironment(document.value, store.workspace, payload)
  })

  eventBus.on(
    'environment:delete:environment',
    ({ environmentName, collectionType }) =>
      delete getCollection(document.value, collectionType)?.['x-scalar-environments']?.[environmentName],
  )

  eventBus.on('environment:upsert:environment-variable', (payload) => {
    const collection = getCollection(document.value, payload.collectionType)
    upsertEnvironmentVariable(collection, payload)
  })

  eventBus.on('environment:delete:environment-variable', ({ environmentName, index, collectionType }) =>
    getCollection(document.value, collectionType)?.['x-scalar-environments']?.[environmentName]?.variables?.splice(
      index,
      1,
    ),
  )

  //------------------------------------------------------------------------------------
  // Cookie Related Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('cookie:upsert:cookie', (payload) => {
    const collection = getCollection(document.value, payload.collectionType)
    upsertCookie(collection, payload)
  })
  eventBus.on('cookie:delete:cookie', (payload) => {
    const collection = getCollection(document.value, payload.collectionType)
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
  eventBus.on('operation:create:operation', (payload) => createOperation(getStore(), payload))
  eventBus.on('operation:update:pathMethod', (payload) =>
    updateOperationPathMethod(document.value, getStore(), payload, async (status) => {
      // Redirect to the new example if the mutation was successful
      if (status === 'success') {
        await router.value?.replace({
          name: 'example',
          params: {
            method: payload.payload.method,
            pathEncoded: encodeURIComponent(payload.payload.path),
            exampleName: currentRoute.value?.params.exampleName,
          },
        })

        // Rebuild the sidebar with the updated order
        rebuildSidebar(document.value?.['x-scalar-navigation']?.name)
      }
      payload.callback(status)
    }),
  )
  eventBus.on('operation:update:summary', (payload) => updateOperationSummary(document.value, payload))
  eventBus.on('operation:delete:operation', async (payload) => {
    deleteOperation(getStore(), payload)
    rebuildSidebar(payload.documentName)
    if (
      isRouteParamsMatch({
        documentName: payload.documentName,
        path: payload.meta.path,
        method: payload.meta.method,
      })
    ) {
      await router.value?.replace({
        name: 'document.overview',
        params: {
          documentSlug: payload.documentName,
        },
      })
    }
  })
  eventBus.on('operation:delete:example', async (payload) => {
    deleteOperationExample(getStore(), payload)
    rebuildSidebar(payload.documentName)
    if (
      isRouteParamsMatch({
        documentName: payload.documentName,
        path: payload.meta.path,
        method: payload.meta.method,
        exampleName: payload.meta.exampleKey,
      })
    ) {
      await router.value?.replace({
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
    onAfterExampleCreation(payload.meta)
  })
  eventBus.on('operation:update:parameter', (payload) => {
    updateOperationParameter(document.value, payload)
    // When updating a path parameter, we need to check if we are creating a new example
    onAfterExampleCreation(payload.meta)
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
    onAfterExampleCreation(payload.meta)
  })
  eventBus.on('operation:update:requestBody:formValue', (payload) => {
    updateOperationRequestBodyFormValue(document.value, payload)
    refreshSidebarAfterExampleCreation(payload.meta)
  })

  //------------------------------------------------------------------------------------
  // Tag Related Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('tag:create:tag', (payload) => {
    createTag(getStore(), payload)
    rebuildSidebar(payload.documentName)
  })
  eventBus.on('tag:delete:tag', (payload) => {
    deleteTag(getStore(), payload)
    rebuildSidebar(payload.documentName)
  })

  //------------------------------------------------------------------------------------
  // UI Related Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('ui:toggle:sidebar', onToggleSidebar)
  eventBus.on(
    'ui:open:command-palette',
    <P extends CommandPaletteAction['action']>(payload: CommandPaletteAction<P> | undefined) => {
      if (payload) {
        onOpenCommandPalette(payload.action, payload.payload)
      } else {
        onOpenCommandPalette()
      }
    },
  )
  eventBus.on('ui:route:page', ({ name }) => router.value?.push({ name }))

  //------------------------------------------------------------------------------------
  // Tabs Related Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('tabs:add:tab', async (payload) => {
    addTab(getStore()?.workspace ?? null, payload)
    await navigateToCurrentTab()
  })
  eventBus.on('tabs:close:tab', async (payload) => {
    closeTab(getStore()?.workspace ?? null, payload)
    await navigateToCurrentTab()
  })
  eventBus.on('tabs:close:other-tabs', (payload) => closeOtherTabs(getStore()?.workspace ?? null, payload))
  eventBus.on('tabs:focus:tab', async (payload) => {
    focusTab(getStore()?.workspace ?? null, payload)
    await navigateToCurrentTab()
  })
  eventBus.on('tabs:focus:tab-last', async (payload) => {
    focusLastTab(getStore()?.workspace ?? null, payload)
    await navigateToCurrentTab()
  })
  eventBus.on('tabs:navigate:previous', async (payload) => {
    navigatePreviousTab(getStore()?.workspace ?? null, payload)
    await navigateToCurrentTab()
  })
  eventBus.on('tabs:navigate:next', async (payload) => {
    navigateNextTab(getStore()?.workspace ?? null, payload)
    await navigateToCurrentTab()
  })
  eventBus.on('tabs:update:tabs', async (payload) => {
    updateTabs(getStore()?.workspace ?? null, payload)
    await navigateToCurrentTab()
  })
  eventBus.on('tabs:copy:url', (payload) => onCopyTabUrl(payload.index))
}
