import { describe, expect, it } from 'vitest'
import 'fake-indexeddb/auto'

import { createWorkspaceStorePersistence } from '@/persistence/index'
import { pickUniqueSlug, planWorkspaceMigration } from '@/persistence/migrations/v2-team-to-local'

describe('v2-team-to-local', () => {
  describe('pickUniqueSlug', () => {
    it('returns the desired slug when not taken', () => {
      expect(pickUniqueSlug('api', new Set())).toBe('api')
    })

    it('appends -2 when the desired slug is taken', () => {
      expect(pickUniqueSlug('api', new Set(['api']))).toBe('api-2')
    })

    it('keeps incrementing until it finds an available suffix', () => {
      expect(pickUniqueSlug('api', new Set(['api', 'api-2', 'api-3']))).toBe('api-4')
    })

    it('treats unrelated slugs as available', () => {
      expect(pickUniqueSlug('api', new Set(['api-old', 'other']))).toBe('api')
    })
  })

  describe('planWorkspaceMigration', () => {
    it('keeps local workspaces under the local team', () => {
      const plan = planWorkspaceMigration([
        { name: 'Local One', namespace: 'local', slug: 'one', teamUid: 'local' },
      ])

      expect(plan).toEqual([
        {
          before: { namespace: 'local', slug: 'one' },
          after: { name: 'Local One', teamSlug: 'local', slug: 'one' },
        },
      ])
    })

    it('moves team workspaces into the local team', () => {
      const plan = planWorkspaceMigration([
        { name: 'Team Workspace', namespace: 'acme', slug: 'api', teamUid: 'acme-uid' },
      ])

      expect(plan).toEqual([
        {
          before: { namespace: 'acme', slug: 'api' },
          after: { name: 'Team Workspace', teamSlug: 'local', slug: 'api' },
        },
      ])
    })

    it('generates a unique slug when the team slug collides with an existing local slug', () => {
      const plan = planWorkspaceMigration([
        { name: 'Local API', namespace: 'local', slug: 'api', teamUid: 'local' },
        { name: 'Team API', namespace: 'acme', slug: 'api', teamUid: 'acme-uid' },
      ])

      expect(plan[1]?.after).toEqual({
        name: 'Team API',
        teamSlug: 'local',
        slug: 'api-2',
      })
    })

    it('generates unique slugs for multiple team workspaces colliding on the same slug', () => {
      const plan = planWorkspaceMigration([
        { name: 'Local API', namespace: 'local', slug: 'api', teamUid: 'local' },
        { name: 'Team A API', namespace: 'team-a', slug: 'api', teamUid: 'team-a-uid' },
        { name: 'Team B API', namespace: 'team-b', slug: 'api', teamUid: 'team-b-uid' },
      ])

      expect(plan.map((entry) => entry.after.slug)).toEqual(['api', 'api-2', 'api-3'])
    })
  })

  describe('end-to-end migration', () => {
    const dbName = 'scalar-workspace-store'

    const cleanup = async (persistence: Awaited<ReturnType<typeof createWorkspaceStorePersistence>> | undefined) => {
      persistence?.close()
      const deleteRequest = indexedDB.deleteDatabase(dbName)
      await new Promise((resolve, reject) => {
        deleteRequest.onsuccess = () => resolve(undefined)
        deleteRequest.onerror = () => reject(deleteRequest.error)
      })
    }

    /** Creates a v1 database that mirrors the pre-migration shape. */
    const seedV1Database = async (
      records: Array<{
        namespace: string
        slug: string
        name: string
        teamUid: string
        documents?: Record<string, unknown>
        meta?: unknown
      }>,
    ): Promise<void> => {
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(dbName, 1)
        request.onupgradeneeded = () => {
          const db = request.result
          const workspace = db.createObjectStore('workspace', { keyPath: ['namespace', 'slug'] })
          workspace.createIndex('teamUid', ['teamUid'])
          db.createObjectStore('meta', { keyPath: 'workspaceId' })
          for (const tableName of [
            'documents',
            'originalDocuments',
            'intermediateDocuments',
            'overrides',
            'history',
            'auth',
          ]) {
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
            workspaceStore.put({
              name: record.name,
              teamUid: record.teamUid,
              namespace: record.namespace,
              slug: record.slug,
            })

            const workspaceId = `${record.namespace}/${record.slug}`
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

    it('converts a team workspace into a local workspace keyed by teamSlug', async () => {
      let persistence: Awaited<ReturnType<typeof createWorkspaceStorePersistence>> | undefined
      try {
        await seedV1Database([
          {
            namespace: 'acme',
            slug: 'api',
            name: 'Acme API',
            teamUid: 'acme-team-uid',
            meta: { 'x-scalar-color-mode': 'dark' },
            documents: {
              'doc-1': {
                openapi: '3.1.0',
                info: { title: 'API', version: '1.0.0' },
                paths: {},
                'x-scalar-original-document-hash': '',
              },
            },
          },
        ])

        persistence = await createWorkspaceStorePersistence()

        // The old composite `[namespace, slug]` key is gone; the workspace now
        // lives under `[teamSlug, slug]` = `['local', 'api']`.
        const migrated = await persistence.workspace.getItem({ teamSlug: 'local', slug: 'api' })
        expect(migrated).toBeDefined()
        expect(migrated?.teamSlug).toBe('local')
        expect(migrated?.slug).toBe('api')
        expect(migrated).not.toHaveProperty('namespace')
        expect(migrated?.workspace.meta).toEqual({ 'x-scalar-color-mode': 'dark' })
        expect(migrated?.workspace.documents['doc-1']).toEqual({
          openapi: '3.1.0',
          info: { title: 'API', version: '1.0.0' },
          paths: {},
          'x-scalar-original-document-hash': '',
        })
      } finally {
        await cleanup(persistence)
      }
    })

    it('generates a unique slug when a local workspace already owns the slug', async () => {
      let persistence: Awaited<ReturnType<typeof createWorkspaceStorePersistence>> | undefined
      try {
        await seedV1Database([
          { namespace: 'local', slug: 'api', name: 'Local API', teamUid: 'local' },
          { namespace: 'acme', slug: 'api', name: 'Acme API', teamUid: 'acme-uid' },
          { namespace: 'globex', slug: 'api', name: 'Globex API', teamUid: 'globex-uid' },
        ])

        persistence = await createWorkspaceStorePersistence()

        const all = await persistence.workspace.getAll()
        const slugs = all.map((workspace) => workspace.slug).sort()
        expect(slugs).toEqual(['api', 'api-2', 'api-3'])
        expect(all.every((workspace) => workspace.teamSlug === 'local')).toBe(true)
        expect(all.every((workspace) => !('namespace' in workspace))).toBe(true)
      } finally {
        await cleanup(persistence)
      }
    })

    it('drops teamUid and namespace fields, keeping only teamSlug and slug', async () => {
      let persistence: Awaited<ReturnType<typeof createWorkspaceStorePersistence>> | undefined
      try {
        await seedV1Database([
          { namespace: 'acme', slug: 'api', name: 'Acme API', teamUid: 'acme-uid' },
          { namespace: 'local', slug: 'personal', name: 'Personal', teamUid: 'local' },
        ])

        persistence = await createWorkspaceStorePersistence()

        const all = await persistence.workspace.getAll()
        for (const workspace of all) {
          expect(workspace).not.toHaveProperty('teamUid')
          expect(workspace).not.toHaveProperty('namespace')
          expect(workspace.teamSlug).toBe('local')
        }

        // Lookups by team slug use the primary key prefix — every migrated
        // workspace is now under `local`; the old `acme` team no longer has
        // any workspaces associated with it.
        const localWorkspaces = await persistence.workspace.getAllByTeamSlug('local')
        expect(localWorkspaces.map((w) => w.slug).sort()).toEqual(['api', 'personal'])

        const acmeWorkspaces = await persistence.workspace.getAllByTeamSlug('acme')
        expect(acmeWorkspaces).toHaveLength(0)
      } finally {
        await cleanup(persistence)
      }
    })
  })
})
