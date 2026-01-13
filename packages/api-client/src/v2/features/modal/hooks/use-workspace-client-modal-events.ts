import type { ModalState } from '@scalar/components'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import {
  addOperationParameter,
  addServer,
  deleteAllOperationParameters,
  deleteOperationParameter,
  deleteSecurityScheme,
  deleteServer,
  updateOperationParameter,
  updateOperationRequestBodyContentType,
  updateOperationRequestBodyExample,
  updateSecurityScheme,
  updateSelectedAuthTab,
  updateSelectedClient,
  updateSelectedScopes,
  updateSelectedSecuritySchemes,
  updateSelectedServer,
  updateServer,
  updateServerVariables,
} from '@scalar/workspace-store/mutators'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas/workspace'
import type { ComputedRef, Ref } from 'vue'

import type { UseModalSidebarReturn } from '@/v2/features/modal/hooks/use-modal-sidebar'

/**
 * Top level event handling for the modal client
 */
export const useWorkspaceClientModalEvents = ({
  eventBus,
  document,
  isSidebarOpen,
  sidebarState,
  modalState,
  workspaceStore,
}: {
  eventBus: WorkspaceEventBus
  document: ComputedRef<WorkspaceDocument | null>
  isSidebarOpen: Ref<boolean>
  sidebarState: UseModalSidebarReturn
  modalState: ModalState
  workspaceStore: WorkspaceStore
}) => {
  //------------------------------------------------------------------------------------
  // Navigation Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('scroll-to:nav-item', ({ id }) => sidebarState.handleSelectItem(id))

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

  //------------------------------------------------------------------------------------
  // UI Related Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('ui:toggle:sidebar', () => (isSidebarOpen.value = !isSidebarOpen.value))
  eventBus.on('ui:close:client-modal', () => modalState.hide())
  eventBus.on('ui:open:client-modal', (payload) => {
    // Just open the modal
    if (!payload) {
      modalState.show()
      return
    }

    // We route to the exact ID
    if ('id' in payload && payload.id) {
      sidebarState.handleSelectItem(payload.id)
    }
    // We must find the ID first from the entries
    else if ('method' in payload && 'path' in payload) {
      sidebarState.handleSelectItem(
        sidebarState.getEntryByLocation({
          document: document.value?.['x-scalar-navigation']?.id ?? '',
          path: payload.path,
          method: payload.method,
          example: payload.exampleName,
        })?.id ?? '',
      )
    }

    modalState.show()
  })

  //------------------------------------------------------------------------------------
  // Workspace Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('workspace:update:selected-client', (payload) => updateSelectedClient(workspaceStore.workspace, payload))
}
