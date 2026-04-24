import { Type } from '@scalar/typebox'

import type { PathMethodHistory } from '@/entities/history/schema'
import { createIndexDbConnection } from '@/persistence/indexdb'
import { v1InitialMigration } from '@/persistence/migrations/v1-initial'
import { v2TeamToLocalMigration } from '@/persistence/migrations/v2-team-to-local'
import type { InMemoryWorkspace } from '@/schemas/inmemory-workspace'
import type { WorkspaceMeta } from '@/schemas/workspace'

type WorkspaceKey = {
  teamSlug?: string
  slug: string
}

type WorkspaceStoreShape = {
  name: string
  workspace: InMemoryWorkspace
}

/**
 * Generates a workspace ID from team slug and workspace slug. Used as the key
 * in the per-workspace chunk tables (meta, documents, ...).
 */
export const getWorkspaceId = (teamSlug: string, slug: string) => `${teamSlug}/${slug}`

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
  // The `tables` config below only describes the CURRENT shape for TypeScript
  // typing on the wrapper API. All schema evolution — creating object stores,
  // keyPaths, indexes, renames, drops — is owned by the migrations array so
  // fresh installs and upgrades converge on exactly the same state.
  const connection = await createIndexDbConnection({
    name: 'scalar-workspace-store',
    migrations: [v1InitialMigration, v2TeamToLocalMigration],
    tables: {
      workspace: {
        schema: Type.Object({
          /** Visual name for a given workspace */
          name: Type.String(),
          /** Slug of the team this workspace belongs to. Use 'local' for personal workspaces. */
          teamSlug: Type.String({ default: 'local' }),
          /** Slug of the workspace, unique within the team. */
          slug: Type.String({ default: 'local' }),
        }),
        keyPath: ['teamSlug', 'slug'],
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
       * Retrieves a workspace by its team + workspace slug.
       * Returns undefined if the workspace does not exist.
       * Gathers all workspace 'chunk' tables and assembles a full workspace shape.
       */
      getItem: async ({
        teamSlug = 'local',
        slug,
      }: WorkspaceKey): Promise<(WorkspaceStoreShape & { teamSlug: string; slug: string }) | undefined> => {
        const workspace = await workspaceTable.getItem({ teamSlug, slug })

        if (!workspace) {
          return undefined
        }

        // Create a composite key for the workspace chunks.
        const id = getWorkspaceId(teamSlug, slug)

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
          teamSlug: workspace.teamSlug,
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
       * Retrieves all workspaces for a given team slug. Uses the primary key
       * prefix so no secondary index is required.
       */
      getAllByTeamSlug: async (teamSlug: string) => {
        return await workspaceTable.getRange([teamSlug])
      },

      /**
       * Saves a workspace to the database.
       * All chunks (meta, documents, configs, etc.) are upsert in their respective tables.
       * If a workspace with the same ID already exists, it will be replaced.
       */
      setItem: async ({ teamSlug = 'local', slug }: WorkspaceKey, value: WorkspaceStoreShape) => {
        const workspace = await workspaceTable.addItem(
          { teamSlug, slug },
          {
            name: value.name,
          },
        )
        const id = getWorkspaceId(teamSlug, slug)

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
      deleteItem: async ({ teamSlug = 'local', slug }: WorkspaceKey): Promise<void> => {
        const id = getWorkspaceId(teamSlug, slug)

        await workspaceTable.deleteItem({ teamSlug, slug })

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

      /**
       * Deletes a single document and all related records (overrides, history, auth, etc.)
       * for the given workspace and document name from all relevant tables.
       */
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
       * Updates the name of an existing workspace.
       * Returns the updated workspace object, or undefined if the workspace does not exist.
       */
      updateName: async ({ teamSlug = 'local', slug }: WorkspaceKey, name: string) => {
        const workspace = await workspaceTable.getItem({ teamSlug, slug })
        if (!workspace) {
          return undefined
        }

        // Update the workspace name
        return await workspaceTable.addItem({ teamSlug, slug }, { ...workspace, name })
      },

      /**
       * Checks if a workspace with the given team + workspace slug exists in the store.
       */
      has: async ({ teamSlug = 'local', slug }: WorkspaceKey): Promise<boolean> => {
        return (await workspaceTable.getItem({ teamSlug, slug })) !== undefined
      },
    },
    clear: async () => {
      await workspaceTable.deleteAll()
    },
  }
}
