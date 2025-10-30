import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { CollectionType, WorkspaceEventBus } from '@scalar/workspace-store/events'
import { mergeObjects } from '@scalar/workspace-store/helpers/merge-object'
import { deleteEnvironment, upsertEnvironment } from '@scalar/workspace-store/mutators'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas/workspace'
import type { ComputedRef } from 'vue'

/**
 * Top level state mutation handling for the workspace store in the client
 */
export const useWorkspaceClientEvents = (
  eventBus: WorkspaceEventBus,
  document: ComputedRef<WorkspaceDocument | null>,
  workspaceStore: WorkspaceStore,
) => {
  /** Selects between the workspace or document based on the type */
  const getCollection = (document: ComputedRef<WorkspaceDocument | null>, type: CollectionType['type']) =>
    type === 'document' ? document.value : workspaceStore.workspace

  //------------------------------------------------------------------------------------
  // Document Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on(
    'document:update:icon',
    (icon) => document.value && (document.value['x-scalar-client-config-icon'] = icon),
  )

  eventBus.on(
    'document:update:info',
    (info) => document.value && (document.value.info = mergeObjects(document.value.info, info)),
  )

  //------------------------------------------------------------------------------------
  // Environment Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('environment:upsert:environment', ({ environmentName, payload, type, newName }) =>
    upsertEnvironment(getCollection(document, type), environmentName, payload, newName),
  )

  eventBus.on('environment:delete:environment', ({ environmentName, type }) =>
    deleteEnvironment(getCollection(document, type), environmentName),
  )

  //------------------------------------------------------------------------------------
  // Workspace Event Handlers
  //------------------------------------------------------------------------------------
}
