import type { Migration } from '@/persistence/indexdb'

/**
 * Tables that store per-workspace chunks keyed by `workspaceId` (single key).
 */
const SINGLE_KEY_CHUNK_TABLES = ['meta'] as const

/**
 * Tables that store per-document chunks keyed by `[workspaceId, documentName]`.
 */
const COMPOSITE_KEY_CHUNK_TABLES = [
  'documents',
  'originalDocuments',
  'intermediateDocuments',
  'overrides',
  'history',
  'auth',
] as const

/**
 * v1 — initial schema for the workspace store.
 *
 * This migration defines the database as it first shipped: a `workspace`
 * object store keyed by `[namespace, slug]` with a `teamUid` index, a `meta`
 * store keyed by `workspaceId`, and six per-document chunk stores keyed by
 * `[workspaceId, documentName]`.
 *
 * Every installation — fresh or upgraded — runs this migration. Fresh installs
 * execute the full chain starting here, then each subsequent migration
 * transforms the schema into the latest shape. Upgraded installs are already
 * past v1 and skip it.
 *
 * Intentionally uses the ORIGINAL field names (including `teamUid`); later
 * migrations are free to rename, drop, or reshape them.
 */
export const v1InitialMigration: Migration = {
  description: 'Initial schema: workspace + chunk tables',
  up: ({ db }) => {
    if (!db.objectStoreNames.contains('workspace')) {
      const workspace = db.createObjectStore('workspace', { keyPath: ['namespace', 'slug'] })
      workspace.createIndex('teamUid', ['teamUid'])
    }

    for (const tableName of SINGLE_KEY_CHUNK_TABLES) {
      if (!db.objectStoreNames.contains(tableName)) {
        db.createObjectStore(tableName, { keyPath: 'workspaceId' })
      }
    }

    for (const tableName of COMPOSITE_KEY_CHUNK_TABLES) {
      if (!db.objectStoreNames.contains(tableName)) {
        db.createObjectStore(tableName, { keyPath: ['workspaceId', 'documentName'] })
      }
    }
  },
}
