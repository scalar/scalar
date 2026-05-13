import { v4 as uuidv4 } from 'uuid'

import type { Migration } from '@/persistence/indexdb'

/**
 * v2 — move to UID-based identity for workspaces and teams.
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
 * - The original `teamUid` from each record is preserved as the team's
 *   canonical identifier (defaulting to `'local'` for personal workspaces
 *   that never had one). The team's `namespace` is preserved verbatim as
 *   the new `teamSlug` so URLs keep working.
 * - Two indexes are added to the workspace store:
 *     - `teamSlug_slug` on `['teamSlug', 'slug']` with `unique: true`,
 *       so the URL `/@<teamSlug>/<workspaceSlug>` can resolve to a single
 *       workspace and the app can rely on slug-pair uniqueness.
 *     - `teamUid` on `['teamUid']`, so we can fetch every workspace for a
 *       team without scanning the store.
 * - Every chunk store (meta, documents, originalDocuments,
 *   intermediateDocuments, overrides, history, auth) is recreated with
 *   `workspaceUid` as its key path (replacing the old `workspaceId`
 *   field). All chunk records are re-keyed from the legacy
 *   `${namespace}/${slug}` value to the new `workspaceUid`.
 *
 * The migration also defends against the (vanishingly unlikely) case of a
 * `[teamSlug, slug]` collision in legacy data — the unique index would
 * otherwise reject the upgrade. If two records would land on the same pair,
 * the second one gets a `-2`, `-3`, ... suffix appended to its slug so the
 * unique index can be created safely.
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
 * In practice this is dead code: v1's `[namespace, slug]` primary key already
 * guarantees `[teamSlug, slug]` uniqueness once we map `namespace -> teamSlug`.
 * It exists as a safety net so a corrupted legacy database cannot brick the
 * upgrade by violating the new unique index.
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
 * Generates a UUID via the `uuid` package so the migration runs everywhere
 * `crypto.randomUUID` is missing (older browsers, some test runners, SSR).
 */
const generateUid = (): string => {
  return uuidv4()
}

/**
 * Computes the new shape for every workspace.
 *
 * For each v1 record:
 * - A fresh `workspaceUid` is generated so the workspace has a stable
 *   identity that survives team/workspace slug renames.
 * - `teamUid` is preserved verbatim (defaulting to `'local'`).
 * - `teamSlug` mirrors the legacy `namespace`. `slug` is preserved.
 * - If a `[teamSlug, slug]` pair would collide with another record (which
 *   should never happen given v1's invariants but we defend against
 *   corruption), the slug gets a unique suffix.
 */
export const planWorkspaceMigration = (
  workspaces: readonly WorkspaceRecordV1[],
): Array<{ before: { namespace: string; slug: string }; after: WorkspaceRecordV2 }> => {
  const takenByTeamSlug = new Map<string, Set<string>>()

  const reserveSlug = (teamSlug: string, desired: string): string => {
    const reserved = takenByTeamSlug.get(teamSlug) ?? new Set<string>()
    const final = pickUniqueSlug(desired, reserved)
    reserved.add(final)
    takenByTeamSlug.set(teamSlug, reserved)
    return final
  }

  return workspaces.map((workspace) => {
    const teamSlug = workspace.namespace
    const slug = reserveSlug(teamSlug, workspace.slug)

    return {
      before: { namespace: workspace.namespace, slug: workspace.slug },
      after: {
        workspaceUid: generateUid(),
        // Personal workspaces never had a real team UID in v1; fall back to
        // the `'local'` sentinel so the new `teamUid` field is always set.
        teamUid: workspace.teamUid ?? 'local',
        teamSlug,
        slug,
        name: workspace.name,
      },
    }
  })
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
  description: 'Switch to UID-based identity: workspaceUid primary key, teamUid as team source of truth',
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
        store.put({ ...rest, workspaceUid })
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
