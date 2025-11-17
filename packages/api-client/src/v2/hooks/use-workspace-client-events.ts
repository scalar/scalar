import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { CollectionType, WorkspaceEventBus } from '@scalar/workspace-store/events'
import { mergeObjects } from '@scalar/workspace-store/helpers/merge-object'
import {
  addOperationParameter,
  addOperationRequestBodyFormRow,
  addServer,
  deleteAllOperationParameters,
  deleteCookie,
  deleteOperationParameter,
  deleteOperationRequestBodyFormRow,
  deleteSecurityScheme,
  deleteServer,
  toggleSecurity,
  updateActiveProxy,
  updateColorMode,
  updateDocumentIcon,
  updateOperationMethod,
  updateOperationParameter,
  updateOperationPath,
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
  updateTheme,
  updateWatchMode,
  upsertCookie,
  upsertEnvironment,
  upsertEnvironmentVariable,
} from '@scalar/workspace-store/mutators'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas/workspace'
import { type ComputedRef, type Ref, toValue } from 'vue'

/**
 * Top level state mutation handling for the workspace store in the client
 */
export const useWorkspaceClientEvents = ({
  eventBus,
  document,
  workspaceStore,
  navigateTo,
  isSidebarOpen,
}: {
  eventBus: WorkspaceEventBus
  document: ComputedRef<WorkspaceDocument | null>
  workspaceStore: Ref<WorkspaceStore | null>
  navigateTo: (id: string) => Promise<unknown> | undefined
  isSidebarOpen: Ref<boolean>
}) => {
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
  eventBus.on('scroll-to:nav-item', async ({ id }) => await navigateTo(id))

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
  eventBus.on('operation:update:method', (payload) =>
    updateOperationMethod(document.value, workspaceStore.value, payload),
  )
  eventBus.on('operation:update:path', (payload) => updateOperationPath(document.value, payload))
  eventBus.on('operation:update:summary', (payload) => updateOperationSummary(document.value, payload))
  eventBus.on('operation:add:parameter', (payload) => addOperationParameter(document.value, payload))
  eventBus.on('operation:update:parameter', (payload) => updateOperationParameter(document.value, payload))
  eventBus.on('operation:delete:parameter', (payload) => deleteOperationParameter(document.value, payload))
  eventBus.on('operation:delete-all:parameters', (payload) => deleteAllOperationParameters(document.value, payload))

  //------------------------------------------------------------------------------------
  // Operation Request Body Related Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('operation:update:requestBody:contentType', (payload) =>
    updateOperationRequestBodyContentType(document.value, payload),
  )
  eventBus.on('operation:update:requestBody:value', (payload) =>
    updateOperationRequestBodyExample(document.value, payload),
  )
  eventBus.on('operation:add:requestBody:formRow', (payload) => addOperationRequestBodyFormRow(document.value, payload))
  eventBus.on('operation:update:requestBody:formRow', (payload) =>
    updateOperationRequestBodyFormRow(document.value, payload),
  )
  eventBus.on('operation:delete:requestBody:formRow', (payload) =>
    deleteOperationRequestBodyFormRow(document.value, payload),
  )

  //------------------------------------------------------------------------------------
  // UI Related Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('ui:toggle:sidebar', () => (isSidebarOpen.value = !isSidebarOpen.value))
}
