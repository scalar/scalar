import { Type } from '@scalar/typebox'

import { createIndexDbConnection } from '@/persistence/indexdb'
import type { InMemoryWorkspace } from '@/schemas/inmemory-workspace'
import type { WorkspaceDocument, WorkspaceMeta } from '@/schemas/workspace'
import type { Config } from '@/schemas/workspace-specification/config'

type WorkspaceStoreShape = {
  name: string
  workspace: InMemoryWorkspace
}

/**
 * Creates the persistence layer for the workspace store using IndexedDB.
 * This sets up all the required tables for storing workspace chunk information,
 * such as workspace meta, documents, original documents, intermediate documents, overrides, etc.
 * Each logical group (meta, documents, etc) gets its own table keyed appropriately for efficient sub-document access.
 * Returns an object containing `meta`, `documents`, `originalDocuments`, `intermediateDocuments`, `overrides`,
 * `documentMeta`, `documentConfigs`, and `workspace` sections, each exposing a `setItem` method
 * for upserting records, and in the case of `workspace`, also `getItem` and `deleteItem`.
 */
export const createWorkspaceStorePersistence = async () => {
  // Create the database connection and setup all required tables for workspace storage.
  const connection = createIndexDbConnection('scalar-workspace-store')

  // Table for the main workspace entity (name, id).
  const workspaceTable = await connection.createTable('workspace', {
    schema: Type.Object({ id: Type.String(), name: Type.String() }),
    key: ['id'],
  })

  // Table for workspace meta information (by workspace id).
  const metaTable = await connection.createTable('workspace-meta', {
    schema: Type.Object({ workspaceId: Type.String(), data: Type.Any() }),
    key: ['workspaceId'],
  })

  // Table for persisted workspace documents (by workspace id and document name).
  const documentsTable = await connection.createTable('workspace-documents', {
    schema: Type.Object({ workspaceId: Type.String(), documentName: Type.String(), data: Type.Any() }),
    key: ['workspaceId', 'documentName'],
  })

  // Table for original/raw documents.
  const originalDocumentTable = await connection.createTable('workspace-original-documents', {
    schema: Type.Object({ workspaceId: Type.String(), documentName: Type.String(), data: Type.Any() }),
    key: ['workspaceId', 'documentName'],
  })

  // Table for intermediate-format documents for a workspace.
  const intermediateDocumentTable = await connection.createTable('workspace-intermediate-documents', {
    schema: Type.Object({ workspaceId: Type.String(), documentName: Type.String(), data: Type.Any() }),
    key: ['workspaceId', 'documentName'],
  })

  // Table for per-document overrides in a workspace.
  const overridesTable = await connection.createTable('workspace-overrides', {
    schema: Type.Object({ workspaceId: Type.String(), documentName: Type.String(), data: Type.Any() }),
    key: ['workspaceId', 'documentName'],
  })

  // Table for document metadata (such as source information).
  const documentMetaTable = await connection.createTable('workspace-document-meta', {
    schema: Type.Object({ workspaceId: Type.String(), documentName: Type.String(), data: Type.Any() }),
    key: ['workspaceId', 'documentName'],
  })

  // Table for per-document configuration records.
  const documentConfigsTable = await connection.createTable('workspace-document-configs', {
    schema: Type.Object({ workspaceId: Type.String(), documentName: Type.String(), data: Type.Any() }),
    key: ['workspaceId', 'documentName'],
  })

  // The returned persistence API with logical sections for each table and mapping.
  return {
    close: async () => {
      return await connection.closeDatabase()
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
      setItem: async (workspaceId: string, documentName: string, data: WorkspaceDocument) => {
        await documentsTable.addItem({ workspaceId, documentName }, { data })
      },
    },
    originalDocuments: {
      /**
       * Set an original (raw) document for a workspace/document pair.
       */
      setItem: async (workspaceId: string, documentName: string, data: Record<string, unknown>) => {
        await originalDocumentTable.addItem({ workspaceId, documentName }, { data })
      },
    },
    intermediateDocuments: {
      /**
       * Set an intermediate (transformed) document for a workspace/document pair.
       */
      setItem: async (workspaceId: string, documentName: string, data: Record<string, unknown>) => {
        await intermediateDocumentTable.addItem({ workspaceId, documentName }, { data })
      },
    },
    overrides: {
      /**
       * Set document overrides for a workspace/document pair.
       */
      setItem: async (workspaceId: string, documentName: string, data: Record<string, unknown>) => {
        await overridesTable.addItem({ workspaceId, documentName }, { data })
      },
    },
    documentMeta: {
      /**
       * Set document meta information such as documentSource.
       */
      setItem: async (workspaceId: string, documentName: string, data: { documentSource?: string }) => {
        await documentMetaTable.addItem({ workspaceId, documentName }, { data })
      },
    },
    documentConfigs: {
      /**
       * Set configuration for a document in a workspace.
       */
      setItem: async (workspaceId: string, documentName: string, data: Config) => {
        await documentConfigsTable.addItem({ workspaceId, documentName }, { data })
      },
    },
    workspace: {
      /**
       * Retrieves a workspace by its ID.
       * Returns undefined if the workspace does not exist.
       * Gathers all workspace 'chunk' tables and assembles a full workspace shape.
       */
      getItem: async (id: string): Promise<(WorkspaceStoreShape & { id: string }) | undefined> => {
        const workspace = await workspaceTable.getItem({ id })

        if (!workspace) {
          return undefined
        }

        // Retrieve all chunk records for this workspace.
        const workspaceDocuments = await documentsTable.getRange([id])
        const workspaceOriginalDocuments = await originalDocumentTable.getRange([id])
        const workspaceIntermediateDocuments = await intermediateDocumentTable.getRange([id])
        const workspaceOverrides = await overridesTable.getRange([id])
        const workspaceDocumentMeta = await documentMetaTable.getRange([id])
        const workspaceMeta = await metaTable.getItem({ workspaceId: id })
        const workspaceDocumentConfigs = await documentConfigsTable.getRange([id])

        // Compose the workspace structure from table records.
        return {
          id,
          name: workspace.name,
          workspace: {
            documents: Object.fromEntries(workspaceDocuments.map((item) => [item.documentName, item.data])),
            originalDocuments: Object.fromEntries(
              workspaceOriginalDocuments.map((item) => [item.documentName, item.data]),
            ),
            intermediateDocuments: Object.fromEntries(
              workspaceIntermediateDocuments.map((item) => [item.documentName, item.data]),
            ),
            overrides: Object.fromEntries(workspaceOverrides.map((item) => [item.documentName, item.data])),
            documentMeta: Object.fromEntries(workspaceDocumentMeta.map((item) => [item.documentName, item.data])),
            meta: workspaceMeta?.data,
            documentConfigs: Object.fromEntries(workspaceDocumentConfigs.map((item) => [item.documentName, item.data])),
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
       * Saves a workspace to the database.
       * All chunks (meta, documents, configs, etc.) are upserted in their respective tables.
       * If a workspace with the same ID already exists, it will be replaced.
       */
      setItem: async (id: string, value: WorkspaceStoreShape): Promise<void> => {
        await workspaceTable.addItem({ id }, { name: value.name })

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

        // Persist all document meta info.
        await Promise.all(
          Object.entries(value.workspace.documentMeta ?? {}).map(([name, data]) => {
            return documentMetaTable.addItem({ workspaceId: id, documentName: name }, { data })
          }),
        )

        // Persist all document configs.
        await Promise.all(
          Object.entries(value.workspace.documentConfigs ?? {}).map(([name, data]) => {
            return documentConfigsTable.addItem({ workspaceId: id, documentName: name }, { data })
          }),
        )
      },

      /**
       * Deletes an entire workspace and all associated chunk records from all tables by ID.
       */
      deleteItem: async (id: string): Promise<void> => {
        await workspaceTable.deleteItem({ id })

        // Remove all workspace-related records from all chunk tables.
        await Promise.all([
          // By id
          metaTable.deleteItem({ workspaceId: id }),

          // By range (composite-key tables)
          documentsTable.deleteRange([id]),
          originalDocumentTable.deleteRange([id]),
          intermediateDocumentTable.deleteRange([id]),
          overridesTable.deleteRange([id]),
          documentMetaTable.deleteRange([id]),
          documentConfigsTable.deleteRange([id]),
        ])
      },
    },
  }
}
