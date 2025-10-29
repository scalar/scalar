import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { mergeObjects } from '@scalar/workspace-store/helpers/merge-object'
import type { InfoObject } from '@scalar/workspace-store/schemas/v3.1/strict/info'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas/workspace'
import type { PartialDeep } from 'type-fest'
import type { ComputedRef } from 'vue'

/**
 * Top level state mutation handling for the workspace store in the client
 */
export const useWorkspaceClientEvents = (
  eventBus: WorkspaceEventBus,
  document: ComputedRef<WorkspaceDocument | null>,
) => {
  //------------------------------------------------------------------------------------
  // Document Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on(
    'update:document-icon',
    (icon: string) => document.value && (document.value['x-scalar-client-config-icon'] = icon),
  )

  eventBus.on(
    'update:document-info',
    (info: PartialDeep<InfoObject>) =>
      document.value && (document.value.info = mergeObjects(document.value.info, info)),
  )

  //------------------------------------------------------------------------------------
  // Environment Event Handlers
  //------------------------------------------------------------------------------------

  //------------------------------------------------------------------------------------
  // Workspace Event Handlers
  //------------------------------------------------------------------------------------
}
