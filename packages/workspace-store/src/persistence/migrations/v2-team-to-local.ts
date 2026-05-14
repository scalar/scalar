import type { Migration } from '@/persistence/indexdb'

/**
 * v2 — move to UID-based identity and collapse every workspace into the
 * local team.
 *
 * Server-side slugs (both team and workspace) can change at any time and
 * there is no reliable way for the client to map a stale slug back to its
 * canonical record. Slugs are still meaningful — they drive the URL — but
 * the source of truth for "which workspace is this" must be a stable
 * identifier that lives independently of any human-editable name.
 *
 * Before this migration, the workspace store was keyed by `[namespace, slug]`
 * (with a separate `teamUid` index that was never used for lookups). All
 * chunk records (meta, documents, ...) were keyed by `${namespace}/${slug}`.
 *
 * After this migration:
 * - The workspace object store is re-created with `workspaceUid` as its
 *   primary key. A fresh UUID is generated for every existing record so
 *   the new identifier is guaranteed to be stable across slug renames.
 * - Every workspace is relocated to the local team. Both `teamUid` and
 *   `teamSlug` are set to `'local'`, regardless of where the workspace
 *   came from. The client only supports a single team workspace going
 *   forward, so any pre-existing team association is intentionally
 *   dropped — the app will rebuild the user's team workspace from the
 *   server on first sign-in.
 * - Workspace slugs are preserved when possible. If two legacy records
 *   would collide on the same `[local, <slug>]` pair after collapse, the
 *   later record gets a unique suffix (`-2`, `-3`, ...). Records that
 *   were already under the local team keep their slug as-is; team
 *   workspaces yield first because their slug came from a namespace the
 *   user no longer controls.
 * - Two indexes are added to the workspace store:
 *     - `teamSlug_slug` on `['teamSlug', 'slug']` with `unique: true`,
 *       so the URL `/@<teamSlug>/<workspaceSlug>` resolves to a single
 *       workspace and the app can rely on slug-pair uniqueness.
 *     - `teamUid` on `['teamUid']`, so we can fetch every workspace for a
 *       team without scanning the store.
 * - Every chunk store (meta, documents, originalDocuments,
 *   intermediateDocuments, overrides, history, auth) is recreated with
 *   `workspaceUid` as its key path (replacing the old `workspaceId`
 *   field). All chunk records are re-keyed from the legacy
 *   `${namespace}/${slug}` value to the new `workspaceUid`.
 * - Saved tabs (`x-scalar-tabs`) and the active tab index
 *   (`x-scalar-active-tab`) are stripped from every workspace's meta
 *   chunk. Tab paths embed the old `@<namespace>/<slug>` URL and slugs
 *   may have been rewritten to resolve collisions, so keeping them would
 *   route the client to stale paths on next load.
 *
 * All work happens inside the upgrade transaction. The migration awaits
 * every IDB request it queues so the database is fully migrated before
 * `up` resolves — that guarantee is what lets later migrations safely
 * build on this state.
 */

/** Tables that store per-workspace chunks keyed by `workspaceUid` (single key). */
const SINGLE_KEY_CHUNK_TABLES = ['meta'] as const

/** Tables that store per-document chunks keyed by `[workspaceUid, documentName]`. */
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
  /** Team UID at the time of save. Often missing for personal workspaces. */
  teamUid?: string
  /** Team slug at the time of save. Doubled as the team identifier in v1. */
  namespace: string
  /** Workspace slug at the time of save. */
  slug: string
}

type WorkspaceRecordV2 = {
  workspaceUid: string
  teamUid: string
  teamSlug: string
  slug: string
  name: string
}

/**
 * Picks a slug that does not collide with anything in `taken`.
 * Falls back to `<slug>-2`, `<slug>-3`, ... when the desired slug is already used.
 *
 * Collapsing every legacy workspace into the local team can produce
 * `[local, <slug>]` collisions whenever a team workspace shared a slug
 * with an existing local workspace (or with another team workspace). The
 * unique `[teamSlug, slug]` index would otherwise reject the upgrade, so
 * this helper resolves collisions deterministically.
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
 * Generates a UUID. Wrapped in a function so tests can stub it and so the
 * migration does not silently break in environments where `crypto.randomUUID`
 * is unavailable.
 */
const generateUid = (): string => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }
  throw new Error('crypto.randomUUID is not available in this environment; cannot run v2 migration')
}

/**
 * Computes the new shape for every workspace.
 *
 * Every record is collapsed into the local team: `teamUid` and `teamSlug`
 * are both forced to `'local'`. Slug uniqueness is enforced by reserving
 * the legacy local-team slugs first (they keep their slug verbatim), then
 * placing every team workspace on top with a `-2`, `-3`, ... suffix when
 * the desired slug is already taken.
 *
 * A fresh `workspaceUid` is generated for every record so the new
 * identifier is stable across future slug renames.
 */
export const planWorkspaceMigration = (
  workspaces: readonly WorkspaceRecordV1[],
): Array<{ before: { namespace: string; slug: string }; after: WorkspaceRecordV2 }> => {
  // Reserve every legacy local slug up front so genuine local workspaces
  // never lose their slug to a colliding team workspace. Without this the
  // suffixing would depend on iteration order and could rename the user's
  // local workspace just because a team workspace happened to come first.
  const reservedSlugs = new Set<string>(
    workspaces.filter((workspace) => workspace.namespace === 'local').map((workspace) => workspace.slug),
  )

  return workspaces.map((workspace) => {
    const isLocal = workspace.namespace === 'local'

    // Local workspaces keep their slug because it was already reserved
    // above. Team workspaces pick a unique slug, suffixing on collision.
    const slug = isLocal ? workspace.slug : pickUniqueSlug(workspace.slug, reservedSlugs)

    if (!isLocal) {
      reservedSlugs.add(slug)
    }

    return {
      before: { namespace: workspace.namespace, slug: workspace.slug },
      after: {
        workspaceUid: generateUid(),
        // Team membership is intentionally dropped: the client now ships
        // with a "single team workspace" UX, so any pre-existing team
        // association is rebuilt from the server on next sign-in.
        teamUid: 'local',
        teamSlug: 'local',
        slug,
        name: workspace.name,
      },
    }
  })
}

/**
 * Keys on the workspace meta record that embed URL paths tied to the old
 * `@<namespace>/<slug>` routing scheme. We strip them during the migration
 * so the client can rebuild them from the current route on next load.
 */
const STALE_META_KEYS = ['x-scalar-tabs', 'x-scalar-active-tab'] as const

/**
 * Returns a new meta object with stale, URL-bound fields removed. Leaves
 * every other key untouched so color mode, theme, active document, etc.
 * survive.
 */
const stripStaleMetaFields = (meta: unknown): unknown => {
  if (!meta || typeof meta !== 'object') {
    return meta
  }
  const copy = { ...(meta as Record<string, unknown>) }
  for (const key of STALE_META_KEYS) {
    delete copy[key]
  }
  return copy
}

/** Wraps an IDB request so we can `await` it inside the upgrade transaction. */
const requestAsPromise = <T>(req: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })

/**
 * Reads every record from a chunk store, returning them tagged with the
 * legacy `workspaceId` so the caller can remap them to the new
 * `workspaceUid` once the store has been recreated.
 */
const readLegacyChunkRecords = async (
  transaction: IDBTransaction,
  tableName: string,
): Promise<Array<Record<string, unknown> & { workspaceId: string }>> => {
  if (!transaction.db.objectStoreNames.contains(tableName)) {
    return []
  }
  const store = transaction.objectStore(tableName)
  const records = (await requestAsPromise(store.getAll())) ?? []
  return records as Array<Record<string, unknown> & { workspaceId: string }>
}

export const v2TeamToLocalMigration: Migration = {
  description: 'Switch to UID-based identity: workspaceUid primary key, collapse every workspace into the local team',
  up: async ({ db, transaction }) => {
    if (!db.objectStoreNames.contains('workspace')) {
      // The workspace store must exist after v1; if it does not, something
      // is very wrong and we should not silently create a new one here.
      return
    }

    // Read every legacy record before we drop the old stores. The upgrade
    // transaction stays alive while these requests are pending, so the
    // schema mutations below still run in versionchange mode — which is
    // required for deleteObjectStore / createObjectStore.
    const oldWorkspaceStore = transaction.objectStore('workspace')
    const workspaces = ((await requestAsPromise(oldWorkspaceStore.getAll())) ?? []) as WorkspaceRecordV1[]

    // Snapshot every chunk record up front so we can recreate the stores
    // with the new key paths and then rewrite the records below.
    const legacySingleKeyChunks: Record<string, Array<Record<string, unknown> & { workspaceId: string }>> = {}
    for (const tableName of SINGLE_KEY_CHUNK_TABLES) {
      legacySingleKeyChunks[tableName] = await readLegacyChunkRecords(transaction, tableName)
    }
    const legacyCompositeKeyChunks: Record<
      string,
      Array<Record<string, unknown> & { workspaceId: string; documentName: string }>
    > = {}
    for (const tableName of COMPOSITE_KEY_CHUNK_TABLES) {
      const records = await readLegacyChunkRecords(transaction, tableName)
      legacyCompositeKeyChunks[tableName] = records as Array<
        Record<string, unknown> & { workspaceId: string; documentName: string }
      >
    }

    const plan = planWorkspaceMigration(workspaces)

    // Map legacy `${namespace}/${slug}` to the new workspaceUid so chunk
    // records can be re-keyed in a single pass below.
    const legacyIdToWorkspaceUid = new Map<string, string>()
    for (const { before, after } of plan) {
      legacyIdToWorkspaceUid.set(`${before.namespace}/${before.slug}`, after.workspaceUid)
    }

    // Recreate the workspace store with workspaceUid as the primary key,
    // plus the indexes the runtime relies on for slug-based lookups and
    // team-scoped queries. The `[teamSlug, slug]` index is unique so we
    // never end up with two workspaces racing for the same URL.
    db.deleteObjectStore('workspace')
    const newWorkspaceStore = db.createObjectStore('workspace', { keyPath: 'workspaceUid' })
    newWorkspaceStore.createIndex('teamSlug_slug', ['teamSlug', 'slug'], { unique: true })
    newWorkspaceStore.createIndex('teamUid', ['teamUid'])

    // Recreate every chunk store with the new `workspaceUid` key path. We
    // drop and recreate (rather than rewriting records in place) because
    // changing an object store's key path is not supported by IndexedDB.
    for (const tableName of SINGLE_KEY_CHUNK_TABLES) {
      if (transaction.db.objectStoreNames.contains(tableName)) {
        db.deleteObjectStore(tableName)
      }
      db.createObjectStore(tableName, { keyPath: 'workspaceUid' })
    }
    for (const tableName of COMPOSITE_KEY_CHUNK_TABLES) {
      if (transaction.db.objectStoreNames.contains(tableName)) {
        db.deleteObjectStore(tableName)
      }
      db.createObjectStore(tableName, { keyPath: ['workspaceUid', 'documentName'] })
    }

    // Write the migrated workspace records. We do this after creating all
    // stores so the upgrade transaction commits a fully-formed schema even
    // if there are zero legacy records to migrate.
    for (const { after } of plan) {
      newWorkspaceStore.put(after)
    }

    // Re-key every chunk record from the legacy `${namespace}/${slug}` to
    // the new workspaceUid. Records belonging to a workspace that no
    // longer exists (orphans) are dropped — they have no meaning without
    // their parent workspace.
    for (const tableName of SINGLE_KEY_CHUNK_TABLES) {
      const store = transaction.objectStore(tableName)
      for (const record of legacySingleKeyChunks[tableName] ?? []) {
        const workspaceUid = legacyIdToWorkspaceUid.get(record.workspaceId)
        if (!workspaceUid) {
          continue
        }
        const { workspaceId: _legacyId, ...rest } = record
        // The meta chunk holds x-scalar-tabs with full URL paths built
        // from the pre-migration namespace/slug. Those paths are no
        // longer routable after collapsing into the local team (and slugs
        // may have been suffixed on collision), so drop them here and
        // let the client rebuild tabs from the live route.
        const nextData =
          tableName === 'meta'
            ? stripStaleMetaFields((rest as { data?: unknown }).data)
            : (rest as { data?: unknown }).data
        store.put({ ...rest, data: nextData, workspaceUid })
      }
    }
    for (const tableName of COMPOSITE_KEY_CHUNK_TABLES) {
      const store = transaction.objectStore(tableName)
      for (const record of legacyCompositeKeyChunks[tableName] ?? []) {
        const workspaceUid = legacyIdToWorkspaceUid.get(record.workspaceId)
        if (!workspaceUid) {
          continue
        }
        const { workspaceId: _legacyId, ...rest } = record
        store.put({ ...rest, workspaceUid })
      }
    }
  },
}
