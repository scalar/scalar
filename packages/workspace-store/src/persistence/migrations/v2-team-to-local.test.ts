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
    it('generates a workspaceUid for every record', () => {
      const plan = planWorkspaceMigration([
        { name: 'Local One', namespace: 'local', slug: 'one', teamUid: 'local' },
        { name: 'Team One', namespace: 'acme', slug: 'api', teamUid: 'acme-uid' },
      ])

      // The two records get distinct, non-empty UUID-shaped identifiers.
      expect(plan[0]?.after.workspaceUid).toEqual(expect.stringMatching(/^[0-9a-f-]{36}$/i))
      expect(plan[1]?.after.workspaceUid).toEqual(expect.stringMatching(/^[0-9a-f-]{36}$/i))
      expect(plan[0]?.after.workspaceUid).not.toBe(plan[1]?.after.workspaceUid)
    })

    it('preserves teamUid, teamSlug and slug for local workspaces', () => {
      const plan = planWorkspaceMigration([{ name: 'Local One', namespace: 'local', slug: 'one', teamUid: 'local' }])

      expect(plan[0]?.before).toEqual({ namespace: 'local', slug: 'one' })
      expect(plan[0]?.after).toMatchObject({
        teamUid: 'local',
        teamSlug: 'local',
        slug: 'one',
        name: 'Local One',
      })
    })

    it('preserves team association via teamUid for team workspaces', () => {
      const plan = planWorkspaceMigration([
        { name: 'Team Workspace', namespace: 'acme', slug: 'api', teamUid: 'acme-uid' },
      ])

      expect(plan[0]?.after).toMatchObject({
        teamUid: 'acme-uid',
        teamSlug: 'acme',
        slug: 'api',
        name: 'Team Workspace',
      })
    })

    it('defaults teamUid to "local" when the legacy record had none', () => {
      const plan = planWorkspaceMigration([{ name: 'Untagged', namespace: 'local', slug: 'one' }])

      expect(plan[0]?.after.teamUid).toBe('local')
    })

    it('keeps team workspaces and local workspaces with the same slug separate', () => {
      const plan = planWorkspaceMigration([
        { name: 'Local API', namespace: 'local', slug: 'api', teamUid: 'local' },
        { name: 'Team API', namespace: 'acme', slug: 'api', teamUid: 'acme-uid' },
      ])

      // No collision: the two records live under different teamSlugs and
      // the `[teamSlug, slug]` pair stays unique.
      expect(plan[0]?.after.slug).toBe('api')
      expect(plan[1]?.after.slug).toBe('api')
      expect(plan[0]?.after.teamSlug).toBe('local')
      expect(plan[1]?.after.teamSlug).toBe('acme')
    })

    it('resolves duplicate slugs within the same team as a safety net', () => {
      // v1 guarantees this never happens via its `[namespace, slug]` primary
      // key, but defensive coding protects against corrupted legacy data.
      const plan = planWorkspaceMigration([
        { name: 'First', namespace: 'acme', slug: 'api', teamUid: 'acme-uid' },
        { name: 'Second', namespace: 'acme', slug: 'api', teamUid: 'acme-uid' },
        { name: 'Third', namespace: 'acme', slug: 'api', teamUid: 'acme-uid' },
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

    it('rewrites the workspace store to use workspaceUid as the primary key', async () => {
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

        // The migrated workspace can be looked up via its mutable slug pair
        // because that index is what powers URL routing.
        const migrated = await persistence.workspace.getItemBySlug({ teamSlug: 'acme', slug: 'api' })
        expect(migrated).toBeDefined()
        expect(migrated?.workspaceUid).toEqual(expect.stringMatching(/^[0-9a-f-]{36}$/i))
        expect(migrated?.teamUid).toBe('acme-team-uid')
        expect(migrated?.teamSlug).toBe('acme')
        expect(migrated?.slug).toBe('api')
        expect(migrated).not.toHaveProperty('namespace')

        // The same workspace resolves to the same chunks when looked up via
        // its stable UID.
        const viaUid = await persistence.workspace.getItem(migrated!.workspaceUid)
        expect(viaUid?.workspace.meta).toEqual({ 'x-scalar-color-mode': 'dark' })
        expect(viaUid?.workspace.documents['doc-1']).toEqual({
          openapi: '3.1.0',
          info: { title: 'API', version: '1.0.0' },
          paths: {},
          'x-scalar-original-document-hash': '',
        })
      } finally {
        await cleanup(persistence)
      }
    })

    it('preserves team membership for every legacy workspace', async () => {
      let persistence: Awaited<ReturnType<typeof createWorkspaceStorePersistence>> | undefined
      try {
        await seedV1Database([
          { namespace: 'local', slug: 'personal', name: 'Personal', teamUid: 'local' },
          { namespace: 'acme', slug: 'api', name: 'Acme API', teamUid: 'acme-uid' },
          { namespace: 'globex', slug: 'api', name: 'Globex API', teamUid: 'globex-uid' },
        ])

        persistence = await createWorkspaceStorePersistence()

        const all = await persistence.workspace.getAll()
        expect(all).toHaveLength(3)

        const byName = Object.fromEntries(all.map((workspace) => [workspace.name, workspace]))
        expect(byName['Personal']).toMatchObject({ teamUid: 'local', teamSlug: 'local', slug: 'personal' })
        expect(byName['Acme API']).toMatchObject({ teamUid: 'acme-uid', teamSlug: 'acme', slug: 'api' })
        expect(byName['Globex API']).toMatchObject({ teamUid: 'globex-uid', teamSlug: 'globex', slug: 'api' })
      } finally {
        await cleanup(persistence)
      }
    })

    it('allows fetching every workspace for a team via the teamUid index', async () => {
      let persistence: Awaited<ReturnType<typeof createWorkspaceStorePersistence>> | undefined
      try {
        await seedV1Database([
          { namespace: 'acme', slug: 'api', name: 'Acme API', teamUid: 'acme-uid' },
          { namespace: 'acme-staging', slug: 'api', name: 'Acme Staging', teamUid: 'acme-uid' },
          { namespace: 'globex', slug: 'api', name: 'Globex API', teamUid: 'globex-uid' },
        ])

        persistence = await createWorkspaceStorePersistence()

        const acmeWorkspaces = await persistence.workspace.getAllByTeamUid('acme-uid')
        expect(acmeWorkspaces.map((workspace) => workspace.name).sort()).toEqual(['Acme API', 'Acme Staging'])

        const globexWorkspaces = await persistence.workspace.getAllByTeamUid('globex-uid')
        expect(globexWorkspaces.map((workspace) => workspace.name)).toEqual(['Globex API'])

        const missingWorkspaces = await persistence.workspace.getAllByTeamUid('missing-uid')
        expect(missingWorkspaces).toEqual([])
      } finally {
        await cleanup(persistence)
      }
    })

    it('allows fetching workspaces by their current team slug via the slug index', async () => {
      let persistence: Awaited<ReturnType<typeof createWorkspaceStorePersistence>> | undefined
      try {
        await seedV1Database([
          { namespace: 'acme', slug: 'api', name: 'Acme API', teamUid: 'acme-uid' },
          { namespace: 'local', slug: 'personal', name: 'Personal', teamUid: 'local' },
        ])

        persistence = await createWorkspaceStorePersistence()

        const acmeWorkspaces = await persistence.workspace.getAllByTeamSlug('acme')
        expect(acmeWorkspaces.map((workspace) => workspace.slug)).toEqual(['api'])

        const localWorkspaces = await persistence.workspace.getAllByTeamSlug('local')
        expect(localWorkspaces.map((workspace) => workspace.slug)).toEqual(['personal'])

        const orphanWorkspaces = await persistence.workspace.getAllByTeamSlug('orphan')
        expect(orphanWorkspaces).toEqual([])
      } finally {
        await cleanup(persistence)
      }
    })

    it('drops the legacy namespace field on every migrated record', async () => {
      let persistence: Awaited<ReturnType<typeof createWorkspaceStorePersistence>> | undefined
      try {
        await seedV1Database([
          { namespace: 'acme', slug: 'api', name: 'Acme API', teamUid: 'acme-uid' },
          { namespace: 'local', slug: 'personal', name: 'Personal', teamUid: 'local' },
        ])

        persistence = await createWorkspaceStorePersistence()

        const all = await persistence.workspace.getAll()
        for (const workspace of all) {
          expect(workspace).not.toHaveProperty('namespace')
          expect(workspace).toHaveProperty('workspaceUid')
          expect(workspace).toHaveProperty('teamUid')
          expect(workspace).toHaveProperty('teamSlug')
          expect(workspace).toHaveProperty('slug')
        }
      } finally {
        await cleanup(persistence)
      }
    })

    it('re-keys legacy chunks by their new workspaceUid', async () => {
      let persistence: Awaited<ReturnType<typeof createWorkspaceStorePersistence>> | undefined
      try {
        await seedV1Database([
          {
            namespace: 'acme',
            slug: 'api',
            name: 'Acme API',
            teamUid: 'acme-uid',
            meta: { 'x-scalar-color-mode': 'dark', 'x-scalar-theme': 'moon' },
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

        const migrated = await persistence.workspace.getItemBySlug({ teamSlug: 'acme', slug: 'api' })
        expect(migrated?.workspace.meta).toEqual({ 'x-scalar-color-mode': 'dark', 'x-scalar-theme': 'moon' })
        expect(migrated?.workspace.documents['doc-1']).toBeDefined()
      } finally {
        await cleanup(persistence)
      }
    })

    it('preserves tab metadata because slugs are not rewritten by the migration', async () => {
      let persistence: Awaited<ReturnType<typeof createWorkspaceStorePersistence>> | undefined
      try {
        await seedV1Database([
          {
            namespace: 'acme',
            slug: 'api',
            name: 'Acme API',
            teamUid: 'acme-uid',
            meta: {
              'x-scalar-color-mode': 'dark',
              'x-scalar-tabs': [{ path: '/@acme/api/document/drafts', name: 'Drafts' }],
              'x-scalar-active-tab': 0,
            },
          },
        ])

        persistence = await createWorkspaceStorePersistence()

        const migrated = await persistence.workspace.getItemBySlug({ teamSlug: 'acme', slug: 'api' })
        // The slug pair has not changed, so the stored tab URL still points
        // at a routable location and must survive the upgrade verbatim.
        expect(migrated?.workspace.meta).toEqual({
          'x-scalar-color-mode': 'dark',
          'x-scalar-tabs': [{ path: '/@acme/api/document/drafts', name: 'Drafts' }],
          'x-scalar-active-tab': 0,
        })
      } finally {
        await cleanup(persistence)
      }
    })
  })
})
