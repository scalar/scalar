import type { Plugin } from '@/client'
import { createWorkspaceStorePersistence } from '@/persistence'

export const persistencePlugin = async ({ workspaceId }: { workspaceId: string }): Promise<Plugin> => {
  const persistence = await createWorkspaceStorePersistence()

  return {
    hooks: {
      onWorkspaceStateChanges(event) {
        // TODO: debounce these calls to avoid excessive writes
        if (event.type === 'meta') {
          return persistence.meta.setItem(workspaceId, event.value)
        }

        if (event.type === 'documentConfigs') {
          return persistence.documentConfigs.setItem(workspaceId, event.documentName, event.value)
        }

        if (event.type === 'documents') {
          return persistence.documents.setItem(workspaceId, event.documentName, event.value)
        }

        if (event.type === 'documentMeta') {
          return persistence.documentMeta.setItem(workspaceId, event.documentName, event.value)
        }

        if (event.type === 'intermediateDocuments') {
          return persistence.intermediateDocuments.setItem(workspaceId, event.documentName, event.value)
        }

        if (event.type === 'originalDocuments') {
          return persistence.originalDocuments.setItem(workspaceId, event.documentName, event.value)
        }

        if (event.type === 'overrides') {
          return persistence.overrides.setItem(workspaceId, event.documentName, event.value)
        }

        return
      },
    },
  }
}
