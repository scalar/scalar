import { Type } from '@scalar/typebox'

import type { PathMethodHistory } from '@/entities/history/schema'
import { createIndexDbConnection } from '@/persistence/indexdb'
import type { InMemoryWorkspace } from '@/schemas/inmemory-workspace'
import type { WorkspaceMeta } from '@/schemas/workspace'

type WorkspaceKey = {
  namespace?: string
  slug: string
}

type WorkspaceStoreShape = {
  teamUid: string
  name: string
  workspace: InMemoryWorkspace
}

/** Generates a workspace ID from namespace and slug. */
const getWorkspaceId = (namespace: string, slug: string) => `${namespace}/${slug}`

/**
 * Creates the persistence layer for the workspace store using IndexedDB.
 * This sets up all the required tables for storing workspace chunk information,
 * such as workspace meta, documents, original documents, intermediate documents, overrides, etc.
 * Each logical group (meta, documents, etc) gets its own table keyed appropriately for efficient sub-document access.
 * Returns an object containing `meta`, `documents`, `originalDocuments`, `intermediateDocuments`, `overrides`,
 * `documentMeta`, `documentConfigs`, and `workspace` sections, each exposing a `setItem` method
 * for upsetting records, and in the case of `workspace`, also `getItem` and `deleteItem`.
 */
export const createWorkspaceStorePersistence = async () => {
  // Create the database connection and setup all required tables for workspace storage.
  const connection = await createIndexDbConnection({
    name: 'scalar-workspace-store',
    version: 1,
    tables: {
      workspace: {
        schema: Type.Object({
          /** Visual name for a given workspace */
          name: Type.String(),
          /** When logged in all new workspaces (remote and local) are scoped to a team  */
          teamUid: Type.String({ default: 'local' }),
          /** Namespace associated with a remote workspace */
          namespace: Type.String({ default: 'local' }),
          /** Slug associated with a remote workspace */
          slug: Type.String({ default: 'local' }),
        }),
        keyPath: ['namespace', 'slug'],
        indexes: {
          teamUid: ['teamUid'],
        },
      },
      meta: {
        schema: Type.Object({ workspaceId: Type.String(), data: Type.Any() }),
        keyPath: ['workspaceId'],
      },
      documents: {
        schema: Type.Object({ workspaceId: Type.String(), documentName: Type.String(), data: Type.Any() }),
        keyPath: ['workspaceId', 'documentName'],
      },
      originalDocuments: {
        schema: Type.Object({ workspaceId: Type.String(), documentName: Type.String(), data: Type.Any() }),
        keyPath: ['workspaceId', 'documentName'],
      },
      intermediateDocuments: {
        schema: Type.Object({ workspaceId: Type.String(), documentName: Type.String(), data: Type.Any() }),
        keyPath: ['workspaceId', 'documentName'],
      },
      overrides: {
        schema: Type.Object({ workspaceId: Type.String(), documentName: Type.String(), data: Type.Any() }),
        keyPath: ['workspaceId', 'documentName'],
      },
      history: {
        schema: Type.Object({ workspaceId: Type.String(), documentName: Type.String(), data: Type.Any() }),
        keyPath: ['workspaceId', 'documentName'],
      },
      auth: {
        schema: Type.Object({ workspaceId: Type.String(), documentName: Type.String(), data: Type.Any() }),
        keyPath: ['workspaceId', 'documentName'],
      },
    },
  })

  // Tables wrappers for each logical section.
  const workspaceTable = connection.get('workspace')
  const metaTable = connection.get('meta')
  const documentsTable = connection.get('documents')
  const originalDocumentTable = connection.get('originalDocuments')
  const intermediateDocumentTable = connection.get('intermediateDocuments')
  const overridesTable = connection.get('overrides')
  const historyTable = connection.get('history')
  const authTable = connection.get('auth')

  // The returned persistence API with logical sections for each table and mapping.
  return {
    close: () => {
      connection.closeDatabase()
    },
    meta: {
      /**
       * Set meta data for a workspace.
       */
      setItem: async (workspaceId: string, data: WorkspaceMeta) => {
        await metaTable.addItem({ workspaceId }, { data })
      },
    },
    documents: {
      /**
       * Set (persist) a workspace document using workspaceId and documentName as composite key.
       */
      setItem: async (workspaceId: string, documentName: string, data: InMemoryWorkspace['documents'][string]) => {
        await documentsTable.addItem({ workspaceId, documentName }, { data })
      },
    },
    originalDocuments: {
      /**
       * Set an original (raw) document for a workspace/document pair.
       */
      setItem: async (
        workspaceId: string,
        documentName: string,
        data: InMemoryWorkspace['originalDocuments'][string],
      ) => {
        await originalDocumentTable.addItem({ workspaceId, documentName }, { data })
      },
    },
    intermediateDocuments: {
      /**
       * Set an intermediate (transformed) document for a workspace/document pair.
       */
      setItem: async (
        workspaceId: string,
        documentName: string,
        data: InMemoryWorkspace['intermediateDocuments'][string],
      ) => {
        await intermediateDocumentTable.addItem({ workspaceId, documentName }, { data })
      },
    },
    overrides: {
      /**
       * Set document overrides for a workspace/document pair.
       */
      setItem: async (workspaceId: string, documentName: string, data: InMemoryWorkspace['overrides'][string]) => {
        await overridesTable.addItem({ workspaceId, documentName }, { data })
      },
    },
    history: {
      /**
       * Set history for a document.
       */
      setItem: async (workspaceId: string, documentName: string, data: PathMethodHistory) => {
        await historyTable.addItem({ workspaceId, documentName }, { data })
      },
    },
    auth: {
      /**
       * Set auth for a document.
       */
      setItem: async (workspaceId: string, documentName: string, data: InMemoryWorkspace['auth'][string]) => {
        await authTable.addItem({ workspaceId, documentName }, { data })
      },
    },
    workspace: {
      /**
       * Retrieves a workspace by its ID.
       * Returns undefined if the workspace does not exist.
       * Gathers all workspace 'chunk' tables and assembles a full workspace shape.
       */
      getItem: async ({
        namespace,
        slug,
      }: Required<WorkspaceKey>): Promise<(WorkspaceStoreShape & Required<WorkspaceKey>) | undefined> => {
        const workspace = await workspaceTable.getItem({ namespace, slug })

        if (!workspace) {
          return undefined
        }

        // Create a composite key for the workspace chunks.
        const id = getWorkspaceId(namespace, slug)

        // Retrieve all chunk records for this workspace.
        const workspaceDocuments = await documentsTable.getRange([id])
        const workspaceOriginalDocuments = await originalDocumentTable.getRange([id])
        const workspaceIntermediateDocuments = await intermediateDocumentTable.getRange([id])
        const workspaceOverrides = await overridesTable.getRange([id])
        const workspaceMeta = await metaTable.getItem({ workspaceId: id })
        const workspaceHistory = await historyTable.getRange([id])
        const workspaceAuth = await authTable.getRange([id])

        // Compose the workspace structure from table records.
        return {
          name: workspace.name,
          teamUid: workspace.teamUid,
          namespace: workspace.namespace,
          slug: workspace.slug,
          workspace: {
            documents: Object.fromEntries(workspaceDocuments.map((item) => [item.documentName, item.data])),
            originalDocuments: Object.fromEntries(
              workspaceOriginalDocuments.map((item) => [item.documentName, item.data]),
            ),
            intermediateDocuments: Object.fromEntries(
              workspaceIntermediateDocuments.map((item) => [item.documentName, item.data]),
            ),
            overrides: Object.fromEntries(workspaceOverrides.map((item) => [item.documentName, item.data])),
            meta: workspaceMeta?.data,
            history: Object.fromEntries(workspaceHistory.map((item) => [item.documentName, item.data])),
            auth: Object.fromEntries(workspaceAuth.map((item) => [item.documentName, item.data])),
          },
        }
      },

      /**
       * Retrieves all workspaces from the database.
       * Returns only the workspace ID and name for each workspace.
       * To get the full workspace data including documents and metadata, use getItem() with a specific ID.
       * Returns an empty array if no workspaces exist.
       */
      getAll: async () => {
        return await workspaceTable.getAll()
      },

      /**
       * Retrieves all workspaces for a given team UID.
       */
      getAllByTeamUid: async (teamUid: string) => {
        return await workspaceTable.getRange([teamUid], 'teamUid')
      },

      /**
       * Saves a workspace to the database.
       * All chunks (meta, documents, configs, etc.) are upsert in their respective tables.
       * If a workspace with the same ID already exists, it will be replaced.
       */
      setItem: async (
        { namespace = 'local', slug }: WorkspaceKey,
        value: Omit<WorkspaceStoreShape, 'teamUid'> & Partial<Pick<WorkspaceStoreShape, 'teamUid'>>,
      ) => {
        const workspace = await workspaceTable.addItem(
          { namespace, slug },
          {
            name: value.name,
            teamUid: value.teamUid ?? 'local',
          },
        )
        const id = getWorkspaceId(namespace, slug)

        // Save all meta info for workspace.
        await metaTable.addItem({ workspaceId: id }, { data: value.workspace.meta })

        // Persist all workspace documents (chunks).
        await Promise.all(
          Object.entries(value.workspace.documents ?? {}).map(([name, data]) => {
            return documentsTable.addItem({ workspaceId: id, documentName: name }, { data })
          }),
        )

        // Persist all original documents.
        await Promise.all(
          Object.entries(value.workspace.originalDocuments ?? {}).map(([name, data]) => {
            return originalDocumentTable.addItem({ workspaceId: id, documentName: name }, { data })
          }),
        )

        // Persist all intermediate documents.
        await Promise.all(
          Object.entries(value.workspace.intermediateDocuments ?? {}).map(([name, data]) => {
            return intermediateDocumentTable.addItem({ workspaceId: id, documentName: name }, { data })
          }),
        )

        // Persist all document overrides.
        await Promise.all(
          Object.entries(value.workspace.overrides ?? {}).map(([name, data]) => {
            return overridesTable.addItem({ workspaceId: id, documentName: name }, { data })
          }),
        )

        // Persist all history.
        await Promise.all(
          Object.entries(value.workspace.history ?? {}).map(([name, data]) => {
            return historyTable.addItem({ workspaceId: id, documentName: name }, { data })
          }),
        )

        // Persist all auth.
        await Promise.all(
          Object.entries(value.workspace.auth ?? {}).map(([name, data]) => {
            return authTable.addItem({ workspaceId: id, documentName: name }, { data })
          }),
        )

        return workspace
      },

      /**
       * Deletes an entire workspace and all associated chunk records from all tables by ID.
       */
      deleteItem: async ({ namespace, slug }: Required<WorkspaceKey>): Promise<void> => {
        const id = getWorkspaceId(namespace, slug)

        await workspaceTable.deleteItem({ namespace, slug })

        // Remove all workspace-related records from all chunk tables.
        await Promise.all([
          // By id
          metaTable.deleteItem({ workspaceId: id }),

          // By range (composite-key tables)
          documentsTable.deleteRange([id]),
          originalDocumentTable.deleteRange([id]),
          intermediateDocumentTable.deleteRange([id]),
          overridesTable.deleteRange([id]),
          historyTable.deleteRange([id]),
          authTable.deleteRange([id]),
        ])
      },

      deleteDocument: async (workspaceId: string, documentName: string): Promise<void> => {
        await Promise.all([
          documentsTable.deleteItem({ workspaceId, documentName }),
          intermediateDocumentTable.deleteItem({ workspaceId, documentName }),
          originalDocumentTable.deleteItem({ workspaceId, documentName }),
          overridesTable.deleteItem({ workspaceId, documentName }),
          historyTable.deleteItem({ workspaceId, documentName }),
          authTable.deleteItem({ workspaceId, documentName }),
        ])
      },

      /**
       * Checks if a workspace with the given ID exists in the store.
       */
      has: async ({ namespace, slug }: Required<WorkspaceKey>): Promise<boolean> => {
        return (await workspaceTable.getItem({ namespace, slug })) !== undefined
      },
    },
    clear: async () => {
      await workspaceTable.deleteAll()
    },
  }
}
