import type { Migration } from '@/persistence/indexdb'

/**
 * v3 — repair installs left on the superseded v2 schema.
 *
 * The database version is derived from the number of migrations, so every
 * position in the array is meant to be one immutable, shipped schema state.
 * That contract was broken once: the v2 migration was rewritten in place
 * between two releases instead of appending a new migration.
 *
 * As a result, "version 2" shipped as two different schemas:
 *
 * - Superseded v2 (`@scalar/workspace-store@0.48.x`–`0.49.x`): the `workspace`
 *   store was keyed by the composite `[teamSlug, slug]` and had no secondary
 *   indexes. Chunk stores kept the v1 `workspaceId` key path.
 * - Current v2 (`@scalar/workspace-store@0.50.0`+): the `workspace` store is
 *   keyed by `workspaceUid` and carries the `teamSlug_slug` (unique) and
 *   `teamUid` indexes; every chunk store is keyed by `workspaceUid`.
 *
 * Both opened the database at version 2, so an install created by the
 * superseded v2 never re-runs migrations on update — `onupgradeneeded` does
 * not fire when the requested version already matches the existing one. The
 * runtime then asks for the `teamSlug_slug` index that does not exist and
 * slug-based lookups (`getItemBySlug`) throw `NotFoundError`.
 *
 * This migration brings those stranded installs up to the current shape:
 * - The `workspace` store is recreated with `workspaceUid` as its primary key
 *   and both indexes. A fresh UUID is generated for every record.
 * - Every chunk store is recreated with the `workspaceUid` key path and its
 *   records are re-keyed from the legacy `${teamSlug}/${slug}` id.
 *
 * It is a no-op for installs that already ran the current v2 (fresh installs
 * and v1 upgrades): those carry the `teamSlug_slug` index, which is a reliable
 * signal that the UID-based schema is already in place.
 *
 * Slug uniqueness needs no extra handling here: the superseded v2 keyed the
 * `workspace` store by `[teamSlug, slug]`, so the pairs were already unique
 * and the new unique index cannot collide.
 */

/** Tables that store per-workspace chunks keyed by a single workspace id. */
const SINGLE_KEY_CHUNK_TABLES = ['meta'] as const

/** Tables that store per-document chunks keyed by `[workspace id, documentName]`. */
const COMPOSITE_KEY_CHUNK_TABLES = [
  'documents',
  'originalDocuments',
  'intermediateDocuments',
  'overrides',
  'history',
  'auth',
] as const

/**
 * Workspace record as written by the superseded v2 migration: keyed by the
 * composite `[teamSlug, slug]`, with no `workspaceUid` and no indexes.
 */
type SupersededWorkspaceRecord = {
  name: string
  teamSlug: string
  slug: string
}

/** Workspace record in the current, UID-based shape. */
type WorkspaceRecord = {
  workspaceUid: string
  teamUid: string
  teamSlug: string
  slug: string
  name: string
}

/** A chunk record before re-keying — still carries the legacy `workspaceId`. */
type LegacyChunkRecord = Record<string, unknown> & { workspaceId: string }

/**
 * Generates a UUID. Wrapped in a function so the migration fails loudly in
 * environments where `crypto.randomUUID` is unavailable instead of writing
 * records with an undefined primary key.
 */
const generateUid = (): string => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }
  throw new Error('crypto.randomUUID is not available in this environment; cannot run v3 migration')
}

/** Wraps an IDB request so it can be awaited inside the upgrade transaction. */
const requestAsPromise = <T>(req: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })

/**
 * Reads every record from a store, returning an empty array when the store
 * does not exist. Queues the `getAll` request synchronously so the upgrade
 * transaction stays alive across the await.
 */
const readAllRecords = async <T>(transaction: IDBTransaction, tableName: string): Promise<T[]> => {
  if (!transaction.db.objectStoreNames.contains(tableName)) {
    return []
  }
  const records = await requestAsPromise(transaction.objectStore(tableName).getAll())
  return (records ?? []) as T[]
}

export const v3RepairUidSchemaMigration: Migration = {
  description: 'Repair installs stranded on the superseded v2 schema (workspaceUid primary key + indexes)',
  up: async ({ db, transaction }) => {
    if (!db.objectStoreNames.contains('workspace')) {
      // The workspace store must exist after v1; if it does not, something is
      // very wrong and we should not silently paper over it here.
      return
    }

    // Installs that ran the current v2 already have the UID-based schema. The
    // `teamSlug_slug` index exists only on that shape, so its presence makes
    // this migration a safe no-op for fresh installs and v1 upgrades.
    if (transaction.objectStore('workspace').indexNames.contains('teamSlug_slug')) {
      return
    }

    // Snapshot every record before dropping the old stores. The upgrade
    // transaction stays alive while these `getAll` requests are pending, so
    // the schema mutations below still run in versionchange mode — which is
    // required for deleteObjectStore / createObjectStore.
    const supersededWorkspaces = await readAllRecords<SupersededWorkspaceRecord>(transaction, 'workspace')

    const legacySingleKeyChunks: Record<string, LegacyChunkRecord[]> = {}
    for (const tableName of SINGLE_KEY_CHUNK_TABLES) {
      legacySingleKeyChunks[tableName] = await readAllRecords<LegacyChunkRecord>(transaction, tableName)
    }
    const legacyCompositeKeyChunks: Record<string, LegacyChunkRecord[]> = {}
    for (const tableName of COMPOSITE_KEY_CHUNK_TABLES) {
      legacyCompositeKeyChunks[tableName] = await readAllRecords<LegacyChunkRecord>(transaction, tableName)
    }

    // Assign a stable UUID to every workspace and remember which legacy
    // `${teamSlug}/${slug}` chunk id maps onto it.
    const legacyIdToWorkspaceUid = new Map<string, string>()
    const migratedWorkspaces: WorkspaceRecord[] = supersededWorkspaces.map((workspace) => {
      const workspaceUid = generateUid()
      legacyIdToWorkspaceUid.set(`${workspace.teamSlug}/${workspace.slug}`, workspaceUid)
      return {
        workspaceUid,
        // The client now ships with a single local-team UX, and the
        // superseded v2 had already collapsed every workspace into the
        // local team — so both identifiers are forced to 'local'.
        teamUid: 'local',
        teamSlug: 'local',
        slug: workspace.slug,
        name: workspace.name,
      }
    })

    // Recreate the workspace store with `workspaceUid` as the primary key,
    // plus the indexes the runtime relies on. An object store's key path
    // cannot be changed in place, so the store has to be dropped first.
    db.deleteObjectStore('workspace')
    const workspaceStore = db.createObjectStore('workspace', { keyPath: 'workspaceUid' })
    workspaceStore.createIndex('teamSlug_slug', ['teamSlug', 'slug'], { unique: true })
    workspaceStore.createIndex('teamUid', ['teamUid'])

    // Recreate every chunk store with the `workspaceUid` key path.
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

    // Write the migrated workspace records into the fresh store.
    for (const record of migratedWorkspaces) {
      workspaceStore.put(record)
    }

    // Re-key every chunk record from its legacy `${teamSlug}/${slug}` id to
    // the new `workspaceUid`. Orphans — chunks whose workspace no longer
    // exists — are dropped; they have no meaning without their parent.
    const rekeyChunks = (tableName: string, records: LegacyChunkRecord[]) => {
      const store = transaction.objectStore(tableName)
      for (const record of records) {
        const workspaceUid = legacyIdToWorkspaceUid.get(record.workspaceId)
        if (!workspaceUid) {
          continue
        }
        const { workspaceId: _legacyId, ...rest } = record
        store.put({ ...rest, workspaceUid })
      }
    }
    for (const tableName of SINGLE_KEY_CHUNK_TABLES) {
      rekeyChunks(tableName, legacySingleKeyChunks[tableName] ?? [])
    }
    for (const tableName of COMPOSITE_KEY_CHUNK_TABLES) {
      rekeyChunks(tableName, legacyCompositeKeyChunks[tableName] ?? [])
    }
  },
}
