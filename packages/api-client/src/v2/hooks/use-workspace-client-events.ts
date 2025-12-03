import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { CollectionType, CommandPaletteAction, WorkspaceEventBus } from '@scalar/workspace-store/events'
import { mergeObjects } from '@scalar/workspace-store/helpers/merge-object'
import {
  type OperationExampleMeta,
  addOperationParameter,
  addOperationRequestBodyFormRow,
  addServer,
  createEmptyDocument,
  createOperation,
  createTag,
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
import { useRouter } from 'vue-router'

import type { UseCommandPaletteStateReturn } from '@/v2/features/command-palette/hooks/use-command-palette-state'
import type { UseSidebarStateReturn } from '@/v2/hooks/use-sidebar-state'

/**
 * Top level state mutation handling for the workspace store in the client
 */
export const useWorkspaceClientEvents = ({
  eventBus,
  document,
  documentSlug,
  workspaceStore,
  isSidebarOpen,
  commandPaletteState,
  sidebarState,
}: {
  eventBus: WorkspaceEventBus
  documentSlug: ComputedRef<string | undefined>
  document: ComputedRef<WorkspaceDocument | null>
  workspaceStore: Ref<WorkspaceStore | null>
  isSidebarOpen: Ref<boolean>
  commandPaletteState: UseCommandPaletteStateReturn
  sidebarState: UseSidebarStateReturn
}) => {
  /** Use router for some redirects */
  const router = useRouter()

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
   * Ensures the sidebar is refreshed after a new example is created.
   *
   * If the sidebar entry for the new example does not exist or is of a different type,
   * this will rebuild the sidebar for the current document. This helps keep the sidebar state
   * consistent (e.g., after adding a new example via the UI).
   */
  const refreshSidebarAfterExampleCreation = (payload: OperationExampleMeta) => {
    const documentName = documentSlug.value
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
      workspaceStore.value?.buildSidebar(documentName)
    }
    return
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
  eventBus.on('operation:update:method', (payload) =>
    updateOperationMethod(document.value, workspaceStore.value, payload, (success) => {
      // Lets redirect to the new example if the mutation was successful
      if (success) {
        router.replace({
          name: 'example',
          params: {
            method: payload.payload.method,
            pathEncoded: encodeURIComponent(payload.meta.path),
            exampleName: payload.meta.exampleKey,
          },
        })
      }
    }),
  )
  eventBus.on('operation:update:path', (payload) => updateOperationPath(document.value, payload))
  eventBus.on('operation:update:summary', (payload) => updateOperationSummary(document.value, payload))
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
  eventBus.on('tag:create:tag', (payload) => createTag(workspaceStore.value, payload))

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
}
