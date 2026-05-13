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

    it('keeps local workspaces under the local team with their original slug', () => {
      const plan = planWorkspaceMigration([{ name: 'Local One', namespace: 'local', slug: 'one', teamUid: 'local' }])

      expect(plan[0]?.before).toEqual({ namespace: 'local', slug: 'one' })
      expect(plan[0]?.after).toMatchObject({
        teamUid: 'local',
        teamSlug: 'local',
        slug: 'one',
        name: 'Local One',
      })
    })

    it('relocates team workspaces into the local team', () => {
      const plan = planWorkspaceMigration([
        { name: 'Team Workspace', namespace: 'acme', slug: 'api', teamUid: 'acme-uid' },
      ])

      // Team association is intentionally dropped: the new UX assumes a
      // single team workspace, so we collapse legacy team workspaces into
      // the local team and let the server rebuild the team workspace on
      // next sign-in.
      expect(plan[0]?.after).toMatchObject({
        teamUid: 'local',
        teamSlug: 'local',
        slug: 'api',
        name: 'Team Workspace',
      })
    })

    it('forces teamUid to "local" regardless of the legacy value', () => {
      const plan = planWorkspaceMigration([
        { name: 'Untagged', namespace: 'local', slug: 'one' },
        { name: 'Tagged', namespace: 'acme', slug: 'two', teamUid: 'acme-uid' },
      ])

      for (const entry of plan) {
        expect(entry.after.teamUid).toBe('local')
      }
    })

    it('suffixes team slugs that collide with an existing local slug', () => {
      const plan = planWorkspaceMigration([
        { name: 'Local API', namespace: 'local', slug: 'api', teamUid: 'local' },
        { name: 'Team API', namespace: 'acme', slug: 'api', teamUid: 'acme-uid' },
      ])

      // The local workspace was reserved first, so it keeps `api`. The
      // team workspace yields and gets a unique suffix.
      expect(plan[0]?.after).toMatchObject({ teamSlug: 'local', slug: 'api' })
      expect(plan[1]?.after).toMatchObject({ teamSlug: 'local', slug: 'api-2' })
    })

    it('suffixes multiple team workspaces colliding on the same slug', () => {
      const plan = planWorkspaceMigration([
        { name: 'Local API', namespace: 'local', slug: 'api', teamUid: 'local' },
        { name: 'Team A API', namespace: 'team-a', slug: 'api', teamUid: 'team-a-uid' },
        { name: 'Team B API', namespace: 'team-b', slug: 'api', teamUid: 'team-b-uid' },
      ])

      expect(plan.map((entry) => entry.after.slug)).toEqual(['api', 'api-2', 'api-3'])
      expect(plan.every((entry) => entry.after.teamSlug === 'local')).toBe(true)
    })

    it('keeps the local slug even when the team workspace comes first in the input', () => {
      // The pre-scan reserves all local slugs up front, so iteration order
      // does not influence which workspace keeps the canonical slug.
      const plan = planWorkspaceMigration([
        { name: 'Team API', namespace: 'acme', slug: 'api', teamUid: 'acme-uid' },
        { name: 'Local API', namespace: 'local', slug: 'api', teamUid: 'local' },
      ])

      expect(plan[0]?.after).toMatchObject({ name: 'Team API', slug: 'api-2' })
      expect(plan[1]?.after).toMatchObject({ name: 'Local API', slug: 'api' })
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

        // The migrated workspace has been collapsed into the local team
        // and is now addressable via `[local, api]`.
        const migrated = await persistence.workspace.getItemBySlug({ teamSlug: 'local', slug: 'api' })
        expect(migrated).toBeDefined()
        expect(migrated?.workspaceUid).toEqual(expect.stringMatching(/^[0-9a-f-]{36}$/i))
        expect(migrated?.teamUid).toBe('local')
        expect(migrated?.teamSlug).toBe('local')
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

    it('collapses every workspace into the local team', async () => {
      let persistence: Awaited<ReturnType<typeof createWorkspaceStorePersistence>> | undefined
      try {
        await seedV1Database([
          { namespace: 'local', slug: 'personal', name: 'Personal', teamUid: 'local' },
          { namespace: 'acme', slug: 'api', name: 'Acme API', teamUid: 'acme-uid' },
          { namespace: 'globex', slug: 'one', name: 'Globex One', teamUid: 'globex-uid' },
        ])

        persistence = await createWorkspaceStorePersistence()

        const all = await persistence.workspace.getAll()
        expect(all).toHaveLength(3)

        // Every workspace is now local. Team UID, team slug, and the
        // teamUid index all agree.
        for (const workspace of all) {
          expect(workspace.teamUid).toBe('local')
          expect(workspace.teamSlug).toBe('local')
        }

        const localWorkspaces = await persistence.workspace.getAllByTeamUid('local')
        expect(localWorkspaces.map((workspace) => workspace.slug).sort()).toEqual(['api', 'one', 'personal'])

        // No workspace remains under the legacy team UIDs.
        expect(await persistence.workspace.getAllByTeamUid('acme-uid')).toEqual([])
        expect(await persistence.workspace.getAllByTeamUid('globex-uid')).toEqual([])
      } finally {
        await cleanup(persistence)
      }
    })

    it('suffixes the migrated slug when a local workspace already owns it', async () => {
      let persistence: Awaited<ReturnType<typeof createWorkspaceStorePersistence>> | undefined
      try {
        await seedV1Database([
          { namespace: 'local', slug: 'api', name: 'Local API', teamUid: 'local' },
          { namespace: 'acme', slug: 'api', name: 'Acme API', teamUid: 'acme-uid' },
          { namespace: 'globex', slug: 'api', name: 'Globex API', teamUid: 'globex-uid' },
        ])

        persistence = await createWorkspaceStorePersistence()

        const all = await persistence.workspace.getAll()
        const slugsByName = Object.fromEntries(all.map((workspace) => [workspace.name, workspace.slug]))

        // The local workspace keeps its slug. Team workspaces yield and
        // receive deterministic `-2`, `-3` suffixes.
        expect(slugsByName['Local API']).toBe('api')
        expect([slugsByName['Acme API'], slugsByName['Globex API']].sort()).toEqual(['api-2', 'api-3'])
        expect(all.every((workspace) => workspace.teamSlug === 'local')).toBe(true)
      } finally {
        await cleanup(persistence)
      }
    })

    it('drops the legacy namespace and teamUid fields from every record', async () => {
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
          expect(workspace).toHaveProperty('teamUid', 'local')
          expect(workspace).toHaveProperty('teamSlug', 'local')
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

        const migrated = await persistence.workspace.getItemBySlug({ teamSlug: 'local', slug: 'api' })
        expect(migrated?.workspace.meta).toEqual({ 'x-scalar-color-mode': 'dark', 'x-scalar-theme': 'moon' })
        expect(migrated?.workspace.documents['doc-1']).toBeDefined()
      } finally {
        await cleanup(persistence)
      }
    })

    it('strips x-scalar-tabs and x-scalar-active-tab from the meta chunk', async () => {
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
              'x-scalar-theme': 'moon',
              // Both fields reference the old namespace-based URL and would
              // route the client to a stale path after collapsing to local.
              'x-scalar-tabs': [{ path: '/@acme/api/document/drafts', name: 'Drafts' }],
              'x-scalar-active-tab': 0,
            },
          },
          {
            namespace: 'local',
            slug: 'personal',
            name: 'Personal',
            teamUid: 'local',
            meta: {
              'x-scalar-color-mode': 'light',
              // Even local workspaces lose their tabs because a colliding
              // team slug may have been suffixed and shifted the layout.
              'x-scalar-tabs': [{ path: '/@local/personal/document/drafts', name: 'Drafts' }],
              'x-scalar-active-tab': 1,
            },
          },
        ])

        persistence = await createWorkspaceStorePersistence()

        const migratedAcme = await persistence.workspace.getItemBySlug({ teamSlug: 'local', slug: 'api' })
        expect(migratedAcme?.workspace.meta).toEqual({
          'x-scalar-color-mode': 'dark',
          'x-scalar-theme': 'moon',
        })

        const migratedLocal = await persistence.workspace.getItemBySlug({ teamSlug: 'local', slug: 'personal' })
        expect(migratedLocal?.workspace.meta).toEqual({ 'x-scalar-color-mode': 'light' })
      } finally {
        await cleanup(persistence)
      }
    })
  })
})
