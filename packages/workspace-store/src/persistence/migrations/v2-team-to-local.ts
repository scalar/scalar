import type { Migration } from '@/persistence/indexdb'

/**
 * v2 — collapse every workspace into the local team and drop the namespace concept.
 *
 * Before this migration, workspaces were keyed by `[namespace, slug]` where the
 * namespace doubled as the team identifier (for example `acme-corp/api-workspace`)
 * and a separate `teamUid` field stored the team's UID.
 *
 * After this migration:
 * - The workspace object store is re-created with a new composite key
 *   `[teamSlug, slug]`. The old `teamUid` index is removed; no separate
 *   `teamSlug` index is needed because it is now part of the primary key.
 * - Every workspace is placed under `teamSlug = 'local'`. Team association is
 *   intentionally dropped — every workspace becomes a personal/local one.
 * - The `namespace` field is removed entirely from the record.
 * - When moving a team workspace into the local team would collide with an
 *   existing local slug, a unique suffix (`-2`, `-3`, ...) is appended.
 * - All chunk records (meta, documents, originalDocuments, intermediateDocuments,
 *   overrides, history, auth) are re-keyed to the new `local/<slug>` workspaceId.
 *
 * All work happens inside the upgrade transaction. Async IDB request callbacks
 * keep the transaction alive so data transformation can complete.
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
  /** Old field — dropped entirely in v2. */
  teamUid?: string
  namespace: string
  slug: string
}

type WorkspaceRecordV2 = {
  name: string
  teamSlug: string
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
 * Computes the new shape for every workspace, preserving local entries under
 * their existing slug and relocating team entries into the local team with a
 * unique slug when needed.
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
        slug: newSlug,
      },
    })
  }

  return plan
}

const buildWorkspaceId = (prefix: string, slug: string) => `${prefix}/${slug}`

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
  description: 'Re-key workspace store to [teamSlug, slug]; collapse all workspaces into the local team',
  up: ({ db, transaction }) => {
    if (!db.objectStoreNames.contains('workspace')) {
      // The workspace store must exist after v1; if it does not, something is
      // very wrong and we should not silently create a new one here.
      return
    }

    // Read every record from the old workspace store before we delete it.
    // IDB keeps the upgrade transaction alive while this request is pending,
    // so the deferred work inside `onsuccess` still runs in versionchange
    // mode — which is required for deleteObjectStore / createObjectStore.
    const oldWorkspaceStore = transaction.objectStore('workspace')
    const getAllRequest = oldWorkspaceStore.getAll()

    getAllRequest.onsuccess = () => {
      const workspaces = (getAllRequest.result ?? []) as WorkspaceRecordV1[]
      const plan = planWorkspaceMigration(workspaces)

      // The workspace store's keyPath cannot be changed in place, so drop it
      // and recreate it with the new composite key. No separate `teamSlug`
      // index is needed because the team slug is the first part of the key.
      db.deleteObjectStore('workspace')
      const newWorkspaceStore = db.createObjectStore('workspace', { keyPath: ['teamSlug', 'slug'] })

      for (const { before, after } of plan) {
        const oldWorkspaceId = buildWorkspaceId(before.namespace, before.slug)
        const newWorkspaceId = buildWorkspaceId(after.teamSlug, after.slug)

        newWorkspaceStore.put(after)
        remapChunkTables(transaction, oldWorkspaceId, newWorkspaceId)
      }
    }
  },
}
