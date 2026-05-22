import { describe, expect, it } from 'vitest'
import 'fake-indexeddb/auto'

import { createWorkspaceStorePersistence } from '@/persistence/index'

const COMPOSITE_KEY_CHUNK_TABLES = [
  'documents',
  'originalDocuments',
  'intermediateDocuments',
  'overrides',
  'history',
  'auth',
] as const

describe('v3-repair-uid-schema', () => {
  const dbName = 'scalar-workspace-store'

  const cleanup = async (persistence: Awaited<ReturnType<typeof createWorkspaceStorePersistence>> | undefined) => {
    persistence?.close()
    const deleteRequest = indexedDB.deleteDatabase(dbName)
    await new Promise((resolve, reject) => {
      deleteRequest.onsuccess = () => resolve(undefined)
      deleteRequest.onerror = () => reject(deleteRequest.error)
    })
  }

  /**
   * Builds a database in the superseded v2 shape: the `workspace` store keyed
   * by `[teamSlug, slug]` with no indexes, and chunk stores still keyed by the
   * legacy `workspaceId`. This is the exact state an install created by
   * `@scalar/workspace-store@0.48.x`–`0.49.x` is stuck in.
   */
  const seedSupersededV2Database = async (
    records: Array<{ slug: string; name: string; documents?: Record<string, unknown>; meta?: unknown }>,
  ): Promise<void> => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(dbName, 2)
      request.onupgradeneeded = () => {
        const db = request.result
        // The superseded v2 keyed the workspace store by [teamSlug, slug] and
        // deliberately created no secondary indexes.
        db.createObjectStore('workspace', { keyPath: ['teamSlug', 'slug'] })
        db.createObjectStore('meta', { keyPath: 'workspaceId' })
        for (const tableName of COMPOSITE_KEY_CHUNK_TABLES) {
          db.createObjectStore(tableName, { keyPath: ['workspaceId', 'documentName'] })
        }
      }
      request.onsuccess = () => {
        const db = request.result
        const tx = db.transaction(['workspace', 'meta', 'documents'], 'readwrite')
        const workspaceStore = tx.objectStore('workspace')
        const metaStore = tx.objectStore('meta')
        const documentsStore = tx.objectStore('documents')

        for (const record of records) {
          workspaceStore.put({ name: record.name, teamSlug: 'local', slug: record.slug })

          // The superseded v2 re-keyed every chunk to `${teamSlug}/${slug}`.
          const workspaceId = `local/${record.slug}`
          if (record.meta !== undefined) {
            metaStore.put({ workspaceId, data: record.meta })
          }
          for (const [documentName, data] of Object.entries(record.documents ?? {})) {
            documentsStore.put({ workspaceId, documentName, data })
          }
        }

        tx.oncomplete = () => {
          db.close()
          resolve()
        }
        tx.onerror = () => reject(tx.error)
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Builds a database in the current (UID-based) v2 shape, still pinned at
   * version 2. This mirrors an install created by `@scalar/workspace-store`
   * 0.50.0+, which v3 must recognise and leave completely untouched.
   */
  const seedCurrentV2Database = async (
    records: Array<{ workspaceUid: string; slug: string; name: string; meta?: unknown }>,
  ): Promise<void> => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(dbName, 2)
      request.onupgradeneeded = () => {
        const db = request.result
        const workspace = db.createObjectStore('workspace', { keyPath: 'workspaceUid' })
        workspace.createIndex('teamSlug_slug', ['teamSlug', 'slug'], { unique: true })
        workspace.createIndex('teamUid', ['teamUid'])
        db.createObjectStore('meta', { keyPath: 'workspaceUid' })
        for (const tableName of COMPOSITE_KEY_CHUNK_TABLES) {
          db.createObjectStore(tableName, { keyPath: ['workspaceUid', 'documentName'] })
        }
      }
      request.onsuccess = () => {
        const db = request.result
        const tx = db.transaction(['workspace', 'meta'], 'readwrite')
        const workspaceStore = tx.objectStore('workspace')
        const metaStore = tx.objectStore('meta')

        for (const record of records) {
          workspaceStore.put({
            workspaceUid: record.workspaceUid,
            teamUid: 'local',
            teamSlug: 'local',
            slug: record.slug,
            name: record.name,
          })
          if (record.meta !== undefined) {
            metaStore.put({ workspaceUid: record.workspaceUid, data: record.meta })
          }
        }

        tx.oncomplete = () => {
          db.close()
          resolve()
        }
        tx.onerror = () => reject(tx.error)
      }
      request.onerror = () => reject(request.error)
    })
  }

  it('resolves a workspace by slug after repairing the superseded schema', async () => {
    let persistence: Awaited<ReturnType<typeof createWorkspaceStorePersistence>> | undefined
    try {
      await seedSupersededV2Database([{ slug: 'api', name: 'Acme API' }])

      // Opening the store runs v3, which recreates the workspace store with
      // the missing `teamSlug_slug` index. Before the fix this lookup threw
      // `NotFoundError: The specified index was not found`.
      persistence = await createWorkspaceStorePersistence()

      const workspace = await persistence.workspace.getItemBySlug({ slug: 'api' })
      expect(workspace).toBeDefined()
      expect(workspace?.workspaceUid).toEqual(expect.stringMatching(/^[0-9a-f-]{36}$/i))
      expect(workspace?.teamSlug).toBe('local')
      expect(workspace?.slug).toBe('api')
      expect(workspace?.name).toBe('Acme API')
    } finally {
      await cleanup(persistence)
    }
  })

  it('re-keys chunk records onto the new workspaceUid', async () => {
    let persistence: Awaited<ReturnType<typeof createWorkspaceStorePersistence>> | undefined
    try {
      await seedSupersededV2Database([
        {
          slug: 'api',
          name: 'Acme API',
          meta: { 'x-scalar-color-mode': 'dark' },
          documents: {
            'doc-1': { openapi: '3.1.0', info: { title: 'API', version: '1.0.0' }, paths: {} },
          },
        },
      ])

      persistence = await createWorkspaceStorePersistence()

      const bySlug = await persistence.workspace.getItemBySlug({ slug: 'api' })
      const byUid = await persistence.workspace.getItem(bySlug!.workspaceUid)
      expect(byUid?.workspace.meta).toEqual({ 'x-scalar-color-mode': 'dark' })
      expect(byUid?.workspace.documents['doc-1']).toMatchObject({ openapi: '3.1.0' })
    } finally {
      await cleanup(persistence)
    }
  })

  it('keeps every workspace and restores the teamUid index', async () => {
    let persistence: Awaited<ReturnType<typeof createWorkspaceStorePersistence>> | undefined
    try {
      await seedSupersededV2Database([
        { slug: 'one', name: 'One' },
        { slug: 'two', name: 'Two' },
        { slug: 'three', name: 'Three' },
      ])

      persistence = await createWorkspaceStorePersistence()

      const all = await persistence.workspace.getAll()
      expect(all.map((workspace) => workspace.slug).sort()).toEqual(['one', 'three', 'two'])

      // getAllByTeamUid uses the `teamUid` index, which the superseded v2 also
      // dropped — it must resolve again after the repair.
      const local = await persistence.workspace.getAllByTeamUid('local')
      expect(local).toHaveLength(3)
    } finally {
      await cleanup(persistence)
    }
  })

  it('is a no-op for databases already on the UID-based schema', async () => {
    let persistence: Awaited<ReturnType<typeof createWorkspaceStorePersistence>> | undefined
    try {
      await seedCurrentV2Database([
        { workspaceUid: 'stable-uid', slug: 'api', name: 'Acme API', meta: { 'x-scalar-color-mode': 'dark' } },
      ])

      // v3 still runs (the database is at version 2), but it must detect the
      // existing `teamSlug_slug` index and leave the data untouched — no
      // regenerated UID, no orphaned chunks.
      persistence = await createWorkspaceStorePersistence()

      const workspace = await persistence.workspace.getItem('stable-uid')
      expect(workspace?.workspaceUid).toBe('stable-uid')
      expect(workspace?.slug).toBe('api')
      expect(workspace?.workspace.meta).toEqual({ 'x-scalar-color-mode': 'dark' })
    } finally {
      await cleanup(persistence)
    }
  })
})
