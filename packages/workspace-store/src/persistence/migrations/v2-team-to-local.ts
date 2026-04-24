import type { Migration } from '@/persistence/indexdb'

/**
 * v2 — collapse every workspace into the local namespace and team.
 *
 * Before this migration, workspaces were keyed by `[namespace, slug]` where
 * the namespace doubled as the team identifier (for example
 * `acme-corp/api-workspace`) and a separate `teamUid` field stored the team's
 * UID.
 *
 * After this migration:
 * - Every workspace lives under `namespace = 'local'` AND `teamSlug = 'local'`.
 *   Team association is intentionally dropped — every workspace becomes a
 *   personal/local one. The `teamUid` field is removed entirely.
 * - When moving a team workspace into `local` would collide with an existing
 *   local slug, a unique suffix (`-2`, `-3`, ...) is appended.
 * - All chunk records (meta, documents, originalDocuments,
 *   intermediateDocuments, overrides, history, auth) are re-keyed to the new
 *   `local/<slug>` workspaceId.
 * - The workspace store's `teamUid` index is replaced with a `teamSlug` index.
 *
 * All work happens inside the upgrade transaction. Async IDB request
 * callbacks keep the transaction alive so data transformation can complete.
 */

/** Tables that store per-workspace chunks keyed by `workspaceId` (single key). */
const SINGLE_KEY_CHUNK_TABLES = ['meta'] as const

/** Tables that store per-document chunks keyed by `[workspaceId, documentName]`. */
const COMPOSITE_KEY_CHUNK_TABLES = [
  'documents',
  'originalDocuments',
  'intermediateDocuments',
  'overrides',
  'history',
  'auth',
] as const

type WorkspaceRecordV1 = {
  name: string
  /** Old field — replaced by `teamSlug`. */
  teamUid?: string
  namespace: string
  slug: string
}

type WorkspaceRecordV2 = {
  name: string
  teamSlug: string
  namespace: string
  slug: string
}

/**
 * Picks a slug that does not collide with anything in `taken`.
 * Falls back to `<slug>-2`, `<slug>-3`, ... when the desired slug is already used.
 */
export const pickUniqueSlug = (desired: string, taken: ReadonlySet<string>): string => {
  if (!taken.has(desired)) {
    return desired
  }

  let counter = 2
  while (taken.has(`${desired}-${counter}`)) {
    counter++
  }
  return `${desired}-${counter}`
}

/**
 * Computes the new shape for every workspace, preserving local entries and
 * relocating team entries into the local namespace with a unique slug.
 */
export const planWorkspaceMigration = (
  workspaces: readonly WorkspaceRecordV1[],
): Array<{ before: { namespace: string; slug: string }; after: WorkspaceRecordV2 }> => {
  // Local slugs that already exist take priority and keep their slug as-is.
  const reservedSlugs = new Set<string>(
    workspaces.filter((workspace) => workspace.namespace === 'local').map((workspace) => workspace.slug),
  )

  const plan: Array<{ before: { namespace: string; slug: string }; after: WorkspaceRecordV2 }> = []

  for (const workspace of workspaces) {
    if (workspace.namespace === 'local') {
      plan.push({
        before: { namespace: workspace.namespace, slug: workspace.slug },
        after: {
          name: workspace.name,
          teamSlug: 'local',
          namespace: 'local',
          slug: workspace.slug,
        },
      })
      continue
    }

    const newSlug = pickUniqueSlug(workspace.slug, reservedSlugs)
    reservedSlugs.add(newSlug)

    plan.push({
      before: { namespace: workspace.namespace, slug: workspace.slug },
      after: {
        name: workspace.name,
        // Team association is dropped on purpose — every workspace becomes
        // local. Slug uniqueness has already been handled above.
        teamSlug: 'local',
        namespace: 'local',
        slug: newSlug,
      },
    })
  }

  return plan
}

const buildWorkspaceId = (namespace: string, slug: string) => `${namespace}/${slug}`

/**
 * Re-keys all chunk records belonging to `oldWorkspaceId` so they live under
 * `newWorkspaceId` instead. Skips any tables that are not present in the DB.
 */
const remapChunkTables = (transaction: IDBTransaction, oldWorkspaceId: string, newWorkspaceId: string): void => {
  if (oldWorkspaceId === newWorkspaceId) {
    return
  }

  for (const tableName of SINGLE_KEY_CHUNK_TABLES) {
    if (!transaction.db.objectStoreNames.contains(tableName)) {
      continue
    }

    const store = transaction.objectStore(tableName)
    const getRequest = store.get(oldWorkspaceId)
    getRequest.onsuccess = () => {
      const record = getRequest.result
      if (!record) {
        return
      }
      store.delete(oldWorkspaceId)
      store.put({ ...record, workspaceId: newWorkspaceId })
    }
  }

  for (const tableName of COMPOSITE_KEY_CHUNK_TABLES) {
    if (!transaction.db.objectStoreNames.contains(tableName)) {
      continue
    }

    const store = transaction.objectStore(tableName)
    // Range covering every `[oldWorkspaceId, *]` key.
    const range = IDBKeyRange.bound([oldWorkspaceId], [oldWorkspaceId, []], false, true)
    const cursorRequest = store.openCursor(range)
    cursorRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
      if (!cursor) {
        return
      }

      const value = cursor.value as { workspaceId: string; documentName: string }
      cursor.delete()
      store.put({ ...value, workspaceId: newWorkspaceId })
      cursor.continue()
    }
  }
}

export const v2TeamToLocalMigration: Migration = {
  description: 'Collapse team namespaces into local; replace teamUid index with teamSlug',
  up: ({ transaction }) => {
    if (!transaction.db.objectStoreNames.contains('workspace')) {
      // The workspace store must exist after v1; if it does not, something is
      // very wrong and we should not silently create a new one here.
      return
    }

    const workspaceStore = transaction.objectStore('workspace')

    // Swap the indexes: `teamUid` is gone, `teamSlug` takes its place. Guards
    // keep the migration idempotent for tests and repeated upgrade scenarios.
    if (workspaceStore.indexNames.contains('teamUid')) {
      workspaceStore.deleteIndex('teamUid')
    }
    if (!workspaceStore.indexNames.contains('teamSlug')) {
      workspaceStore.createIndex('teamSlug', ['teamSlug'])
    }

    const getAllRequest = workspaceStore.getAll()
    getAllRequest.onsuccess = () => {
      const workspaces = (getAllRequest.result ?? []) as WorkspaceRecordV1[]
      const plan = planWorkspaceMigration(workspaces)

      for (const { before, after } of plan) {
        const oldWorkspaceId = buildWorkspaceId(before.namespace, before.slug)
        const newWorkspaceId = buildWorkspaceId(after.namespace, after.slug)

        // Always rewrite the workspace record so the `teamUid` field is
        // dropped and `teamSlug` is added, even when the key itself does not
        // change.
        if (before.namespace !== after.namespace || before.slug !== after.slug) {
          workspaceStore.delete([before.namespace, before.slug])
        }
        workspaceStore.put(after)

        remapChunkTables(transaction, oldWorkspaceId, newWorkspaceId)
      }
    }
  },
}
