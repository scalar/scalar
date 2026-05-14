import { beforeEach, describe, expect, it } from 'vitest'
import 'fake-indexeddb/auto'

import { createWorkspaceStorePersistence } from './index'

const blankWorkspace = () => ({
  documents: {},
  originalDocuments: {},
  intermediateDocuments: {},
  overrides: {},
  meta: {},
  history: {},
  auth: {},
})

const newUid = () => globalThis.crypto.randomUUID()

describe('createWorkspaceStorePersistence', { concurrent: false }, () => {
  const testDbName = 'scalar-workspace-store'
  let persistence: Awaited<ReturnType<typeof createWorkspaceStorePersistence>>

  beforeEach(async () => {
    persistence = await createWorkspaceStorePersistence()

    return async () => {
      persistence.close()

      // Clean up: delete database
      const deleteRequest = indexedDB.deleteDatabase(testDbName)
      await new Promise((resolve, reject) => {
        deleteRequest.onsuccess = () => resolve(undefined)
        deleteRequest.onerror = () => reject(deleteRequest.error)
      })
    }
  })

  describe('workspace.setItem', () => {
    it('persists the full identity tuple alongside the workspace name', async () => {
      const workspaceUid = newUid()

      const workspace = await persistence.workspace.setItem(
        { workspaceUid, teamUid: 'team-1-uid', teamSlug: 'team-1', slug: 'workspace-1' },
        { name: 'Workspace 1', workspace: blankWorkspace() },
      )

      expect(workspace).toEqual({
        workspaceUid,
        teamUid: 'team-1-uid',
        teamSlug: 'team-1',
        slug: 'workspace-1',
        name: 'Workspace 1',
      })
    })

    it('defaults teamUid, teamSlug, and slug to local-friendly values', async () => {
      const workspaceUid = newUid()

      await persistence.workspace.setItem(
        { workspaceUid, slug: 'personal' },
        { name: 'Personal', workspace: blankWorkspace() },
      )

      const fetched = await persistence.workspace.getItem(workspaceUid)
      expect(fetched).toMatchObject({ teamUid: 'local', teamSlug: 'local', slug: 'personal' })
    })
  })

  describe('workspace.getItem', () => {
    it('returns the full workspace including all chunks', async () => {
      const workspaceUid = newUid()

      await persistence.workspace.setItem(
        { workspaceUid, teamSlug: 'team-1', slug: 'api' },
        {
          name: 'API Workspace',
          workspace: {
            ...blankWorkspace(),
            documents: {
              'doc-1': {
                openapi: '3.1.0',
                info: { title: 'API', version: '1.0.0' },
                paths: {},
                'x-scalar-original-document-hash': '',
              },
            },
            meta: { 'x-scalar-color-mode': 'dark' },
          },
        },
      )

      const fetched = await persistence.workspace.getItem(workspaceUid)
      expect(fetched?.name).toBe('API Workspace')
      expect(fetched?.workspace.meta).toEqual({ 'x-scalar-color-mode': 'dark' })
      expect(fetched?.workspace.documents['doc-1']).toBeDefined()
    })

    it('returns undefined for a missing workspace', async () => {
      const fetched = await persistence.workspace.getItem('missing-uid')
      expect(fetched).toBeUndefined()
    })
  })

  describe('workspace.getItemBySlug', () => {
    it('resolves a workspace via its [teamSlug, slug] pair', async () => {
      const workspaceUid = newUid()

      await persistence.workspace.setItem(
        { workspaceUid, teamUid: 'team-1-uid', teamSlug: 'team-1', slug: 'api' },
        { name: 'Team API', workspace: blankWorkspace() },
      )

      const fetched = await persistence.workspace.getItemBySlug({ teamSlug: 'team-1', slug: 'api' })
      expect(fetched?.workspaceUid).toBe(workspaceUid)
      expect(fetched?.name).toBe('Team API')
    })

    it('defaults teamSlug to "local" when omitted', async () => {
      const workspaceUid = newUid()

      await persistence.workspace.setItem(
        { workspaceUid, slug: 'personal' },
        { name: 'Personal', workspace: blankWorkspace() },
      )

      const fetched = await persistence.workspace.getItemBySlug({ slug: 'personal' })
      expect(fetched?.workspaceUid).toBe(workspaceUid)
    })

    it('returns undefined when no workspace matches the slug pair', async () => {
      const fetched = await persistence.workspace.getItemBySlug({ teamSlug: 'team-1', slug: 'nothing-here' })
      expect(fetched).toBeUndefined()
    })
  })

  describe('workspace.getAll', () => {
    it('returns every workspace shell record', async () => {
      const firstUid = newUid()
      const secondUid = newUid()

      await persistence.workspace.setItem(
        { workspaceUid: firstUid, slug: 'workspace-1' },
        { name: 'Workspace One', workspace: blankWorkspace() },
      )
      await persistence.workspace.setItem(
        { workspaceUid: secondUid, slug: 'workspace-2' },
        { name: 'Workspace Two', workspace: blankWorkspace() },
      )

      const all = await persistence.workspace.getAll()
      expect(all).toHaveLength(2)
      expect(all.map((workspace) => workspace.name).sort()).toEqual(['Workspace One', 'Workspace Two'])
      // Shell records never include chunk data.
      for (const workspace of all) {
        expect(workspace).not.toHaveProperty('workspace')
      }
    })

    it('returns an empty array when nothing has been persisted', async () => {
      expect(await persistence.workspace.getAll()).toEqual([])
    })
  })

  describe('workspace.getAllByTeamUid', () => {
    it('returns every workspace belonging to a team by its UID', async () => {
      await persistence.workspace.setItem(
        { workspaceUid: newUid(), teamUid: 'team-a-uid', teamSlug: 'team-a', slug: 'api' },
        { name: 'Team A API', workspace: blankWorkspace() },
      )
      await persistence.workspace.setItem(
        { workspaceUid: newUid(), teamUid: 'team-a-uid', teamSlug: 'team-a-staging', slug: 'api' },
        { name: 'Team A Staging', workspace: blankWorkspace() },
      )
      await persistence.workspace.setItem(
        { workspaceUid: newUid(), teamUid: 'team-b-uid', teamSlug: 'team-b', slug: 'api' },
        { name: 'Team B API', workspace: blankWorkspace() },
      )

      const teamAWorkspaces = await persistence.workspace.getAllByTeamUid('team-a-uid')
      expect(teamAWorkspaces.map((workspace) => workspace.name).sort()).toEqual(['Team A API', 'Team A Staging'])

      const teamBWorkspaces = await persistence.workspace.getAllByTeamUid('team-b-uid')
      expect(teamBWorkspaces.map((workspace) => workspace.name)).toEqual(['Team B API'])

      const missingTeamWorkspaces = await persistence.workspace.getAllByTeamUid('missing-uid')
      expect(missingTeamWorkspaces).toEqual([])
    })

    it('continues to resolve a workspace by its UID after its team slug changes', async () => {
      const workspaceUid = newUid()

      await persistence.workspace.setItem(
        { workspaceUid, teamUid: 'team-a-uid', teamSlug: 'old-name', slug: 'api' },
        { name: 'Team A API', workspace: blankWorkspace() },
      )

      // Server-side rename: same team UID, different slug. The workspace
      // remains addressable via teamUid and only its mutable slug shifts.
      await persistence.workspace.updateSlugs(workspaceUid, { teamSlug: 'new-name' })

      const teamWorkspaces = await persistence.workspace.getAllByTeamUid('team-a-uid')
      expect(teamWorkspaces).toHaveLength(1)
      expect(teamWorkspaces[0]?.teamSlug).toBe('new-name')
    })
  })

  describe('workspace.getAllByTeamSlug', () => {
    it('returns workspaces by current team slug', async () => {
      await persistence.workspace.setItem(
        { workspaceUid: newUid(), teamSlug: 'team-1', slug: 'workspace-1' },
        { name: 'Team Workspace 1', workspace: blankWorkspace() },
      )
      await persistence.workspace.setItem(
        { workspaceUid: newUid(), teamSlug: 'team-1', slug: 'workspace-2' },
        { name: 'Team Workspace 2', workspace: blankWorkspace() },
      )
      await persistence.workspace.setItem(
        { workspaceUid: newUid(), slug: 'local-workspace' },
        { name: 'Local Workspace', workspace: blankWorkspace() },
      )

      const team1Workspaces = await persistence.workspace.getAllByTeamSlug('team-1')
      expect(team1Workspaces.map((workspace) => workspace.slug).sort()).toEqual(['workspace-1', 'workspace-2'])

      const localWorkspaces = await persistence.workspace.getAllByTeamSlug('local')
      expect(localWorkspaces.map((workspace) => workspace.slug)).toEqual(['local-workspace'])
    })
  })

  describe('workspace.deleteItem', () => {
    it('removes the workspace and every chunk that referenced it', async () => {
      const workspaceUid = newUid()

      await persistence.workspace.setItem(
        { workspaceUid, slug: 'doomed' },
        {
          name: 'Doomed',
          workspace: {
            ...blankWorkspace(),
            documents: {
              'doc-1': {
                openapi: '3.1.0',
                info: { title: 'API', version: '1.0.0' },
                paths: {},
                'x-scalar-original-document-hash': '',
              },
            },
            meta: { 'x-scalar-color-mode': 'dark' },
          },
        },
      )

      await persistence.workspace.deleteItem(workspaceUid)

      expect(await persistence.workspace.has(workspaceUid)).toBe(false)
      // Chunks are gone too: re-creating the workspace under the same UID
      // with a blank shape yields a blank workspace, never the original
      // chunks. If deletion had left anything behind we would see `doc-1`
      // here.
      const recreated = await persistence.workspace.setItem(
        { workspaceUid, slug: 'doomed' },
        { name: 'Doomed (revived)', workspace: blankWorkspace() },
      )
      expect(recreated.workspaceUid).toBe(workspaceUid)
      const refetched = await persistence.workspace.getItem(workspaceUid)
      expect(refetched?.workspace.documents).toEqual({})
    })
  })

  describe('workspace.updateName', () => {
    it('returns undefined when workspace does not exist', async () => {
      const result = await persistence.workspace.updateName('missing-uid', 'New Name')
      expect(result).toBeUndefined()
    })

    it('updates the name and preserves the rest of the identity tuple', async () => {
      const workspaceUid = newUid()

      await persistence.workspace.setItem(
        { workspaceUid, teamUid: 'team-1-uid', teamSlug: 'team-1', slug: 'workspace-1' },
        { name: 'Original Name', workspace: blankWorkspace() },
      )

      const updated = await persistence.workspace.updateName(workspaceUid, 'Renamed Workspace')

      expect(updated).toEqual({
        workspaceUid,
        teamUid: 'team-1-uid',
        teamSlug: 'team-1',
        slug: 'workspace-1',
        name: 'Renamed Workspace',
      })
    })
  })

  describe('workspace.updateSlugs', () => {
    it('updates just the teamSlug while leaving everything else intact', async () => {
      const workspaceUid = newUid()

      await persistence.workspace.setItem(
        { workspaceUid, teamUid: 'team-1-uid', teamSlug: 'old-team', slug: 'api' },
        { name: 'API', workspace: blankWorkspace() },
      )

      const updated = await persistence.workspace.updateSlugs(workspaceUid, { teamSlug: 'new-team' })

      expect(updated).toMatchObject({
        workspaceUid,
        teamUid: 'team-1-uid',
        teamSlug: 'new-team',
        slug: 'api',
        name: 'API',
      })
    })

    it('updates just the workspace slug while leaving everything else intact', async () => {
      const workspaceUid = newUid()

      await persistence.workspace.setItem(
        { workspaceUid, teamUid: 'team-1-uid', teamSlug: 'team-1', slug: 'old-slug' },
        { name: 'API', workspace: blankWorkspace() },
      )

      const updated = await persistence.workspace.updateSlugs(workspaceUid, { slug: 'new-slug' })

      expect(updated).toMatchObject({
        workspaceUid,
        teamUid: 'team-1-uid',
        teamSlug: 'team-1',
        slug: 'new-slug',
      })
    })

    it('returns undefined when the workspace does not exist', async () => {
      const result = await persistence.workspace.updateSlugs('missing-uid', { slug: 'whatever' })
      expect(result).toBeUndefined()
    })

    it('returns undefined when another workspace already owns the target slug pair', async () => {
      const firstUid = newUid()
      const secondUid = newUid()

      await persistence.workspace.setItem(
        { workspaceUid: firstUid, teamSlug: 'team-1', slug: 'api' },
        { name: 'First', workspace: blankWorkspace() },
      )
      await persistence.workspace.setItem(
        { workspaceUid: secondUid, teamSlug: 'team-1', slug: 'other' },
        { name: 'Second', workspace: blankWorkspace() },
      )

      const result = await persistence.workspace.updateSlugs(secondUid, { slug: 'api' })
      expect(result).toBeUndefined()

      const second = await persistence.workspace.getItem(secondUid)
      expect(second?.slug).toBe('other')
    })

    it('allows a no-op update when the slug pair is unchanged', async () => {
      const workspaceUid = newUid()

      await persistence.workspace.setItem(
        { workspaceUid, teamSlug: 'team-1', slug: 'api' },
        { name: 'API', workspace: blankWorkspace() },
      )

      const updated = await persistence.workspace.updateSlugs(workspaceUid, { teamSlug: 'team-1', slug: 'api' })
      expect(updated).toMatchObject({ workspaceUid, teamSlug: 'team-1', slug: 'api' })
    })
  })

  describe('workspace.has and workspace.hasSlug', () => {
    it('reports whether a workspace exists by UID', async () => {
      const workspaceUid = newUid()
      expect(await persistence.workspace.has(workspaceUid)).toBe(false)

      await persistence.workspace.setItem(
        { workspaceUid, slug: 'exists' },
        { name: 'Exists', workspace: blankWorkspace() },
      )
      expect(await persistence.workspace.has(workspaceUid)).toBe(true)

      await persistence.workspace.deleteItem(workspaceUid)
      expect(await persistence.workspace.has(workspaceUid)).toBe(false)
    })

    it('reports whether a workspace exists by [teamSlug, slug]', async () => {
      expect(await persistence.workspace.hasSlug({ teamSlug: 'team-1', slug: 'missing' })).toBe(false)

      await persistence.workspace.setItem(
        { workspaceUid: newUid(), teamSlug: 'team-1', slug: 'api' },
        { name: 'Team API', workspace: blankWorkspace() },
      )

      expect(await persistence.workspace.hasSlug({ teamSlug: 'team-1', slug: 'api' })).toBe(true)
      expect(await persistence.workspace.hasSlug({ teamSlug: 'team-1', slug: 'other' })).toBe(false)
    })
  })

  describe('workspace chunk APIs', () => {
    it('persists meta under the given workspace UID', async () => {
      const workspaceUid = newUid()

      await persistence.workspace.setItem(
        { workspaceUid, slug: 'workspace-1' },
        { name: 'Test', workspace: blankWorkspace() },
      )

      await persistence.meta.setItem(workspaceUid, {
        'x-scalar-color-mode': 'dark',
        'x-scalar-active-document': 'api-doc',
      })

      const fetched = await persistence.workspace.getItem(workspaceUid)
      expect(fetched?.workspace.meta).toEqual({
        'x-scalar-color-mode': 'dark',
        'x-scalar-active-document': 'api-doc',
      })

      expect(await persistence.meta.getItem(workspaceUid)).toEqual(fetched?.workspace.meta)
    })

    it('returns meta via meta.getItem without requiring a full workspace assembly', async () => {
      const workspaceUid = newUid()

      await persistence.workspace.setItem(
        { workspaceUid, slug: 'heavy' },
        {
          name: 'Heavy',
          workspace: {
            ...blankWorkspace(),
            documents: {
              big: {
                openapi: '3.1.0',
                info: { title: 'Big', version: '1.0.0' },
                paths: { '/a': { get: { responses: { '200': { description: 'ok' } } } } },
                'x-scalar-original-document-hash': '',
              },
            },
            meta: { 'x-scalar-color-mode': 'dark', 'x-scalar-tabs': [] },
          },
        },
      )

      expect(await persistence.meta.getItem(workspaceUid)).toEqual({
        'x-scalar-color-mode': 'dark',
        'x-scalar-tabs': [],
      })
    })

    it('returns an empty object from meta.getItem when no meta row exists', async () => {
      expect(await persistence.meta.getItem('no-such-workspace')).toEqual({})
    })

    it('persists multiple documents for a single workspace', async () => {
      const workspaceUid = newUid()

      await persistence.workspace.setItem(
        { workspaceUid, slug: 'multi' },
        { name: 'Multi-Doc', workspace: blankWorkspace() },
      )

      const doc1 = {
        openapi: '3.1.0',
        info: { title: 'API 1', version: '1.0.0' },
        paths: {},
        'x-scalar-original-document-hash': '',
      }
      const doc2 = {
        openapi: '3.1.0',
        info: { title: 'API 2', version: '2.0.0' },
        paths: {},
        'x-scalar-original-document-hash': '',
      }
      await persistence.documents.setItem(workspaceUid, 'doc-1', doc1)
      await persistence.documents.setItem(workspaceUid, 'doc-2', doc2)

      const fetched = await persistence.workspace.getItem(workspaceUid)
      expect(Object.keys(fetched?.workspace.documents ?? {}).sort()).toEqual(['doc-1', 'doc-2'])
      expect(fetched?.workspace.documents['doc-1']).toEqual(doc1)
      expect(fetched?.workspace.documents['doc-2']).toEqual(doc2)
    })

    it('isolates chunks across workspaces with the same slug pair on different teams', async () => {
      // Two workspaces share the same `slug` but live under different teams,
      // so they get distinct UIDs and never see each other's chunks. This is
      // exactly the data shape the new UID-based identity is meant to protect.
      const acmeUid = newUid()
      const globexUid = newUid()

      await persistence.workspace.setItem(
        { workspaceUid: acmeUid, teamUid: 'acme-uid', teamSlug: 'acme', slug: 'api' },
        { name: 'Acme API', workspace: blankWorkspace() },
      )
      await persistence.workspace.setItem(
        { workspaceUid: globexUid, teamUid: 'globex-uid', teamSlug: 'globex', slug: 'api' },
        { name: 'Globex API', workspace: blankWorkspace() },
      )

      const acmeDoc = {
        openapi: '3.1.0',
        info: { title: 'Acme', version: '1.0.0' },
        paths: {},
        'x-scalar-original-document-hash': '',
      }
      const globexDoc = {
        openapi: '3.1.0',
        info: { title: 'Globex', version: '1.0.0' },
        paths: {},
        'x-scalar-original-document-hash': '',
      }
      await persistence.documents.setItem(acmeUid, 'doc', acmeDoc)
      await persistence.documents.setItem(globexUid, 'doc', globexDoc)

      const acmeWorkspace = await persistence.workspace.getItem(acmeUid)
      const globexWorkspace = await persistence.workspace.getItem(globexUid)
      expect(acmeWorkspace?.workspace.documents['doc']).toEqual(acmeDoc)
      expect(globexWorkspace?.workspace.documents['doc']).toEqual(globexDoc)
    })

    it('deletes a single document along with its sibling chunks', async () => {
      const workspaceUid = newUid()

      await persistence.workspace.setItem(
        { workspaceUid, slug: 'workspace-1' },
        { name: 'Test', workspace: blankWorkspace() },
      )
      await persistence.documents.setItem(workspaceUid, 'doc-1', {
        openapi: '3.1.0',
        info: { title: 'API', version: '1.0.0' },
        paths: {},
        'x-scalar-original-document-hash': '',
      })
      await persistence.documents.setItem(workspaceUid, 'doc-2', {
        openapi: '3.1.0',
        info: { title: 'API 2', version: '1.0.0' },
        paths: {},
        'x-scalar-original-document-hash': '',
      })

      await persistence.workspace.deleteDocument(workspaceUid, 'doc-1')

      const fetched = await persistence.workspace.getItem(workspaceUid)
      expect(Object.keys(fetched?.workspace.documents ?? {})).toEqual(['doc-2'])
    })
  })
})
