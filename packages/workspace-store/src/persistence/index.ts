import { Type } from '@scalar/typebox'

import type { PathMethodHistory } from '@/entities/history/schema'
import { createIndexDbConnection } from '@/persistence/indexdb'
import { v1InitialMigration } from '@/persistence/migrations/v1-initial'
import { v2TeamToLocalMigration } from '@/persistence/migrations/v2-team-to-local'
import type { InMemoryWorkspace } from '@/schemas/inmemory-workspace'
import type { WorkspaceMeta } from '@/schemas/workspace'

/**
 * Lookup key for fetching a workspace by its URL slugs. Both `teamSlug` and
 * `slug` are mutable metadata — they map to a stable `workspaceUid` via the
 * `teamSlug_slug` unique index. `teamSlug` defaults to `'local'` so personal
 * workspaces can omit it.
 */
type WorkspaceSlugKey = {
  teamSlug?: string
  slug: string
}

/**
 * Full record written to the workspace object store. `workspaceUid` is the
 * primary key and is the only identifier that survives slug renames.
 */
type WorkspaceRecord = {
  workspaceUid: string
  teamUid: string
  teamSlug: string
  slug: string
  name: string
}

type WorkspaceStoreShape = {
  name: string
  workspace: InMemoryWorkspace
}

/**
 * Generates a fresh `workspaceUid` for new workspaces.
 *
 * Wraps `crypto.randomUUID` so every caller produces UIDs in a consistent
 * shape and we can swap the implementation later without rippling through
 * the codebase.
 */
export const generateWorkspaceUid = (): string => crypto.randomUUID()

/**
 * Creates the persistence layer for the workspace store using IndexedDB.
 *
 * Storage model:
 * - `workspace` is the catalog. Its primary key is `workspaceUid`, a
 *   stable UUID that does not change when the user (or the server)
 *   renames the team or workspace slug. Two indexes back the runtime:
 *     - `teamSlug_slug` (unique) for slug-based URL lookups.
 *     - `teamUid` for team-scoped queries.
 * - Every chunk table (`meta`, `documents`, ...) is keyed by
 *   `workspaceUid` so chunks survive slug renames without ever being
 *   re-keyed.
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
          /** Stable UUID for the workspace; never changes after creation. */
          workspaceUid: Type.String(),
          /** UID of the team this workspace belongs to. Use 'local' for personal workspaces. */
          teamUid: Type.String({ default: 'local' }),
          /** Current team slug. Mutable metadata used to build URLs. */
          teamSlug: Type.String({ default: 'local' }),
          /** Current workspace slug. Mutable metadata used to build URLs. */
          slug: Type.String({ default: 'local' }),
          /** Visual name for a given workspace. */
          name: Type.String(),
        }),
        keyPath: ['workspaceUid'],
      },
      meta: {
        schema: Type.Object({ workspaceUid: Type.String(), data: Type.Any() }),
        keyPath: ['workspaceUid'],
      },
      documents: {
        schema: Type.Object({ workspaceUid: Type.String(), documentName: Type.String(), data: Type.Any() }),
        keyPath: ['workspaceUid', 'documentName'],
      },
      originalDocuments: {
        schema: Type.Object({ workspaceUid: Type.String(), documentName: Type.String(), data: Type.Any() }),
        keyPath: ['workspaceUid', 'documentName'],
      },
      intermediateDocuments: {
        schema: Type.Object({ workspaceUid: Type.String(), documentName: Type.String(), data: Type.Any() }),
        keyPath: ['workspaceUid', 'documentName'],
      },
      overrides: {
        schema: Type.Object({ workspaceUid: Type.String(), documentName: Type.String(), data: Type.Any() }),
        keyPath: ['workspaceUid', 'documentName'],
      },
      history: {
        schema: Type.Object({ workspaceUid: Type.String(), documentName: Type.String(), data: Type.Any() }),
        keyPath: ['workspaceUid', 'documentName'],
      },
      auth: {
        schema: Type.Object({ workspaceUid: Type.String(), documentName: Type.String(), data: Type.Any() }),
        keyPath: ['workspaceUid', 'documentName'],
      },
    },
  })

  const workspaceTable = connection.get('workspace')
  const metaTable = connection.get('meta')
  const documentsTable = connection.get('documents')
  const originalDocumentTable = connection.get('originalDocuments')
  const intermediateDocumentTable = connection.get('intermediateDocuments')
  const overridesTable = connection.get('overrides')
  const historyTable = connection.get('history')
  const authTable = connection.get('auth')

  /**
   * Resolves a workspace record by its `[teamSlug, slug]` pair using the
   * unique secondary index. Returns `undefined` when no workspace matches.
   *
   * The compound index is unique, so at most one record is ever returned;
   * we still go through `getRange` because the wrapper does not expose a
   * single-key index lookup helper.
   */
  const findByTeamSlugAndSlug = async (teamSlug: string, slug: string): Promise<WorkspaceRecord | undefined> => {
    const matches = await workspaceTable.getRange([teamSlug, slug], 'teamSlug_slug')
    return matches[0] as WorkspaceRecord | undefined
  }

  /**
   * Loads every chunk that belongs to a workspace and stitches them back
   * into a single in-memory shape. Shared between `getItem` and
   * `getItemBySlug` so both lookups produce identical output.
   */
  const assembleWorkspace = async (workspace: WorkspaceRecord) => {
    const { workspaceUid } = workspace

    const [
      workspaceDocuments,
      workspaceOriginalDocuments,
      workspaceIntermediateDocuments,
      workspaceOverrides,
      workspaceMeta,
      workspaceHistory,
      workspaceAuth,
    ] = await Promise.all([
      documentsTable.getRange([workspaceUid]),
      originalDocumentTable.getRange([workspaceUid]),
      intermediateDocumentTable.getRange([workspaceUid]),
      overridesTable.getRange([workspaceUid]),
      metaTable.getItem({ workspaceUid }),
      historyTable.getRange([workspaceUid]),
      authTable.getRange([workspaceUid]),
    ])

    return {
      workspaceUid: workspace.workspaceUid,
      teamUid: workspace.teamUid,
      teamSlug: workspace.teamSlug,
      slug: workspace.slug,
      name: workspace.name,
      workspace: {
        documents: Object.fromEntries(workspaceDocuments.map((item) => [item.documentName, item.data])),
        originalDocuments: Object.fromEntries(workspaceOriginalDocuments.map((item) => [item.documentName, item.data])),
        intermediateDocuments: Object.fromEntries(
          workspaceIntermediateDocuments.map((item) => [item.documentName, item.data]),
        ),
        overrides: Object.fromEntries(workspaceOverrides.map((item) => [item.documentName, item.data])),
        meta: workspaceMeta?.data ?? {},
        history: Object.fromEntries(workspaceHistory.map((item) => [item.documentName, item.data])),
        auth: Object.fromEntries(workspaceAuth.map((item) => [item.documentName, item.data])),
      },
    }
  }

  return {
    close: () => {
      connection.closeDatabase()
    },
    meta: {
      /**
       * Loads persisted workspace meta only (no document or other chunk
       * reads). Returns an empty object when no meta row exists yet.
       */
      getItem: async (workspaceUid: string): Promise<InMemoryWorkspace['meta']> => {
        const row = await metaTable.getItem({ workspaceUid })
        return (row?.data ?? {}) as InMemoryWorkspace['meta']
      },
      /** Set meta data for a workspace. */
      setItem: async (workspaceUid: string, data: WorkspaceMeta) => {
        await metaTable.addItem({ workspaceUid }, { data })
      },
    },
    documents: {
      /** Set (persist) a workspace document using workspaceUid and documentName as composite key. */
      setItem: async (workspaceUid: string, documentName: string, data: InMemoryWorkspace['documents'][string]) => {
        await documentsTable.addItem({ workspaceUid, documentName }, { data })
      },
    },
    originalDocuments: {
      /** Set an original (raw) document for a workspace/document pair. */
      setItem: async (
        workspaceUid: string,
        documentName: string,
        data: InMemoryWorkspace['originalDocuments'][string],
      ) => {
        await originalDocumentTable.addItem({ workspaceUid, documentName }, { data })
      },
    },
    intermediateDocuments: {
      /** Set an intermediate (transformed) document for a workspace/document pair. */
      setItem: async (
        workspaceUid: string,
        documentName: string,
        data: InMemoryWorkspace['intermediateDocuments'][string],
      ) => {
        await intermediateDocumentTable.addItem({ workspaceUid, documentName }, { data })
      },
    },
    overrides: {
      /** Set document overrides for a workspace/document pair. */
      setItem: async (workspaceUid: string, documentName: string, data: InMemoryWorkspace['overrides'][string]) => {
        await overridesTable.addItem({ workspaceUid, documentName }, { data })
      },
    },
    history: {
      /** Set history for a document. */
      setItem: async (workspaceUid: string, documentName: string, data: PathMethodHistory) => {
        await historyTable.addItem({ workspaceUid, documentName }, { data })
      },
    },
    auth: {
      /** Set auth for a document. */
      setItem: async (workspaceUid: string, documentName: string, data: InMemoryWorkspace['auth'][string]) => {
        await authTable.addItem({ workspaceUid, documentName }, { data })
      },
    },
    workspace: {
      /**
       * Retrieves a workspace by its stable UID, returning the full
       * assembled state (chunks included). Returns `undefined` when no
       * workspace matches.
       *
       * This is the primary lookup path because the UID never changes,
       * making it safe to cache and reference across slug renames.
       */
      getItem: async (workspaceUid: string): Promise<(WorkspaceStoreShape & WorkspaceRecord) | undefined> => {
        const workspace = (await workspaceTable.getItem({ workspaceUid })) as WorkspaceRecord | undefined
        if (!workspace) {
          return undefined
        }
        return assembleWorkspace(workspace)
      },

      /**
       * Retrieves a workspace by its mutable `[teamSlug, slug]` pair.
       *
       * Use this when the only thing you have is the URL — for example
       * when the router needs to resolve `/@<teamSlug>/<workspaceSlug>`
       * back to a workspace. For all other cases, prefer `getItem(uid)`
       * because the slugs can change at any time.
       */
      getItemBySlug: async ({
        teamSlug = 'local',
        slug,
      }: WorkspaceSlugKey): Promise<(WorkspaceStoreShape & WorkspaceRecord) | undefined> => {
        const workspace = await findByTeamSlugAndSlug(teamSlug, slug)
        if (!workspace) {
          return undefined
        }
        return assembleWorkspace(workspace)
      },

      /**
       * Retrieves all workspace catalog records.
       *
       * Only returns the workspace shell (`workspaceUid`, `teamUid`,
       * `teamSlug`, `slug`, `name`). To get the full workspace data
       * including documents and metadata, use `getItem(workspaceUid)`.
       */
      getAll: async (): Promise<WorkspaceRecord[]> => {
        return (await workspaceTable.getAll()) as WorkspaceRecord[]
      },

      /**
       * Retrieves all workspaces for a given team UID. Uses the `teamUid`
       * index, so this is O(matches) rather than a full scan.
       *
       * Prefer this over `getAllByTeamSlug` because the team UID is the
       * canonical identifier and survives team-slug renames.
       */
      getAllByTeamUid: async (teamUid: string): Promise<WorkspaceRecord[]> => {
        return (await workspaceTable.getRange([teamUid], 'teamUid')) as WorkspaceRecord[]
      },

      /**
       * Retrieves all workspaces for a given team slug. Uses the
       * `teamSlug_slug` compound index as a prefix scan. Useful when the
       * only thing on hand is the URL segment; otherwise prefer
       * `getAllByTeamUid`.
       */
      getAllByTeamSlug: async (teamSlug: string): Promise<WorkspaceRecord[]> => {
        return (await workspaceTable.getRange([teamSlug], 'teamSlug_slug')) as WorkspaceRecord[]
      },

      /**
       * Saves a workspace and all of its chunks. The caller is responsible
       * for providing a stable `workspaceUid` (typically `crypto.randomUUID()`
       * for new records, or the existing UID for updates).
       *
       * `teamSlug` and `slug` are validated by the underlying unique index;
       * attempting to persist a duplicate pair will reject the transaction.
       */
      setItem: async (
        {
          workspaceUid,
          teamUid = 'local',
          teamSlug = 'local',
          slug,
        }: {
          workspaceUid: string
          teamUid?: string
          teamSlug?: string
          slug: string
        },
        value: WorkspaceStoreShape,
      ): Promise<WorkspaceRecord> => {
        const workspace = (await workspaceTable.addItem(
          { workspaceUid },
          { teamUid, teamSlug, slug, name: value.name },
        )) as WorkspaceRecord

        await metaTable.addItem({ workspaceUid }, { data: value.workspace.meta })

        await Promise.all([
          ...Object.entries(value.workspace.documents ?? {}).map(([name, data]) =>
            documentsTable.addItem({ workspaceUid, documentName: name }, { data }),
          ),
          ...Object.entries(value.workspace.originalDocuments ?? {}).map(([name, data]) =>
            originalDocumentTable.addItem({ workspaceUid, documentName: name }, { data }),
          ),
          ...Object.entries(value.workspace.intermediateDocuments ?? {}).map(([name, data]) =>
            intermediateDocumentTable.addItem({ workspaceUid, documentName: name }, { data }),
          ),
          ...Object.entries(value.workspace.overrides ?? {}).map(([name, data]) =>
            overridesTable.addItem({ workspaceUid, documentName: name }, { data }),
          ),
          ...Object.entries(value.workspace.history ?? {}).map(([name, data]) =>
            historyTable.addItem({ workspaceUid, documentName: name }, { data }),
          ),
          ...Object.entries(value.workspace.auth ?? {}).map(([name, data]) =>
            authTable.addItem({ workspaceUid, documentName: name }, { data }),
          ),
        ])

        return workspace
      },

      /**
       * Deletes an entire workspace and every chunk that belongs to it.
       * Safe to call on a workspace that does not exist — the chunk
       * deletions are range scans that simply find nothing to delete.
       */
      deleteItem: async (workspaceUid: string): Promise<void> => {
        await workspaceTable.deleteItem({ workspaceUid })

        await Promise.all([
          metaTable.deleteItem({ workspaceUid }),
          documentsTable.deleteRange([workspaceUid]),
          originalDocumentTable.deleteRange([workspaceUid]),
          intermediateDocumentTable.deleteRange([workspaceUid]),
          overridesTable.deleteRange([workspaceUid]),
          historyTable.deleteRange([workspaceUid]),
          authTable.deleteRange([workspaceUid]),
        ])
      },

      /**
       * Deletes a single document and all related chunks (overrides,
       * history, auth, ...) for the given workspace/document pair.
       */
      deleteDocument: async (workspaceUid: string, documentName: string): Promise<void> => {
        await Promise.all([
          documentsTable.deleteItem({ workspaceUid, documentName }),
          intermediateDocumentTable.deleteItem({ workspaceUid, documentName }),
          originalDocumentTable.deleteItem({ workspaceUid, documentName }),
          overridesTable.deleteItem({ workspaceUid, documentName }),
          historyTable.deleteItem({ workspaceUid, documentName }),
          authTable.deleteItem({ workspaceUid, documentName }),
        ])
      },

      /**
       * Updates the name of an existing workspace. Returns the updated
       * record, or `undefined` when the workspace does not exist.
       */
      updateName: async (workspaceUid: string, name: string): Promise<WorkspaceRecord | undefined> => {
        const workspace = (await workspaceTable.getItem({ workspaceUid })) as WorkspaceRecord | undefined
        if (!workspace) {
          return undefined
        }
        return (await workspaceTable.addItem({ workspaceUid }, { ...workspace, name })) as WorkspaceRecord
      },

      /**
       * Updates the mutable slug metadata for an existing workspace.
       * Returns the updated record, or `undefined` when the workspace
       * does not exist, or when another workspace already owns the target
       * `[teamSlug, slug]` pair (the `teamSlug_slug` index is unique).
       *
       * Use this when the server tells us a team slug or workspace slug
       * has changed. The `workspaceUid` stays the same, so all chunk
       * references continue to resolve.
       */
      updateSlugs: async (
        workspaceUid: string,
        slugs: { teamSlug?: string; slug?: string },
      ): Promise<WorkspaceRecord | undefined> => {
        const workspace = (await workspaceTable.getItem({ workspaceUid })) as WorkspaceRecord | undefined
        if (!workspace) {
          return undefined
        }

        const nextTeamSlug = slugs.teamSlug ?? workspace.teamSlug
        const nextSlug = slugs.slug ?? workspace.slug

        if (nextTeamSlug !== workspace.teamSlug || nextSlug !== workspace.slug) {
          const occupant = await findByTeamSlugAndSlug(nextTeamSlug, nextSlug)
          if (occupant && occupant.workspaceUid !== workspaceUid) {
            return undefined
          }
        }

        return (await workspaceTable.addItem(
          { workspaceUid },
          {
            ...workspace,
            teamSlug: nextTeamSlug,
            slug: nextSlug,
          },
        )) as WorkspaceRecord
      },

      /** Checks if a workspace with the given UID exists. */
      has: async (workspaceUid: string): Promise<boolean> => {
        return (await workspaceTable.getItem({ workspaceUid })) !== undefined
      },

      /** Checks if a workspace with the given `[teamSlug, slug]` pair exists. */
      hasSlug: async ({ teamSlug = 'local', slug }: WorkspaceSlugKey): Promise<boolean> => {
        return (await findByTeamSlugAndSlug(teamSlug, slug)) !== undefined
      },
    },
    clear: async () => {
      await workspaceTable.deleteAll()
    },
  }
}
