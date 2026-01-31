import { beforeEach, describe, expect, it } from 'vitest'
import 'fake-indexeddb/auto'

import { createWorkspaceStorePersistence } from './index'

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

  describe('workspace.getAllByTeamUid', () => {
    it('returns empty array when no workspaces exist', async () => {
      const workspaces = await persistence.workspace.getAllByTeamUid('team-1')

      expect(workspaces).toEqual([])
    })

    it('returns all workspaces for a specific teamUid', async () => {
      await persistence.workspace.setItem(
        { slug: 'workspace-1' },
        {
          name: 'Team Workspace 1',
          teamUid: 'team-1',
          workspace: {
            documents: {},
            originalDocuments: {},
            intermediateDocuments: {},
            overrides: {},
            meta: {},
            history: {},
            auth: {},
          },
        },
      )

      await persistence.workspace.setItem(
        { slug: 'workspace-2' },
        {
          name: 'Team Workspace 2',
          teamUid: 'team-1',
          workspace: {
            documents: {},
            originalDocuments: {},
            intermediateDocuments: {},
            overrides: {},
            meta: {},
            history: {},
            auth: {},
          },
        },
      )

      const workspaces = await persistence.workspace.getAllByTeamUid('team-1')

      expect(workspaces).toHaveLength(2)
      expect(workspaces).toEqual([
        { name: 'Team Workspace 1', teamUid: 'team-1', namespace: 'local', slug: 'workspace-1' },
        { name: 'Team Workspace 2', teamUid: 'team-1', namespace: 'local', slug: 'workspace-2' },
      ])
    })

    it('returns only workspaces that match the teamUid', async () => {
      await persistence.workspace.setItem(
        { slug: 'team1-workspace' },
        {
          name: 'Team 1 Workspace',
          teamUid: 'team-1',
          workspace: {
            documents: {},
            originalDocuments: {},
            intermediateDocuments: {},
            overrides: {},
            meta: {},
            history: {},
            auth: {},
          },
        },
      )

      await persistence.workspace.setItem(
        { slug: 'team2-workspace' },
        {
          name: 'Team 2 Workspace',
          teamUid: 'team-2',
          workspace: {
            documents: {},
            originalDocuments: {},
            intermediateDocuments: {},
            overrides: {},
            meta: {},
            history: {},
            auth: {},
          },
        },
      )

      await persistence.workspace.setItem(
        { slug: 'local-workspace' },
        {
          name: 'Local Workspace',
          workspace: {
            documents: {},
            originalDocuments: {},
            intermediateDocuments: {},
            overrides: {},
            meta: {},
            history: {},
            auth: {},
          },
        },
      )

      const team1Workspaces = await persistence.workspace.getAllByTeamUid('team-1')
      const team2Workspaces = await persistence.workspace.getAllByTeamUid('team-2')

      expect(team1Workspaces).toHaveLength(1)
      expect(team1Workspaces[0]?.slug).toBe('team1-workspace')
      expect(team1Workspaces[0]?.teamUid).toBe('team-1')

      expect(team2Workspaces).toHaveLength(1)
      expect(team2Workspaces[0]?.slug).toBe('team2-workspace')
      expect(team2Workspaces[0]?.teamUid).toBe('team-2')
    })

    it('returns local workspaces when teamUid is local', async () => {
      await persistence.workspace.setItem(
        { slug: 'local-1' },
        {
          name: 'Local Workspace 1',
          workspace: {
            documents: {},
            originalDocuments: {},
            intermediateDocuments: {},
            overrides: {},
            meta: {},
            history: {},
            auth: {},
          },
        },
      )

      await persistence.workspace.setItem(
        { slug: 'local-2' },
        {
          name: 'Local Workspace 2',
          workspace: {
            documents: {},
            originalDocuments: {},
            intermediateDocuments: {},
            overrides: {},
            meta: {},
            history: {},
            auth: {},
          },
        },
      )

      const localWorkspaces = await persistence.workspace.getAllByTeamUid('local')

      expect(localWorkspaces).toHaveLength(2)
      expect(localWorkspaces.every((w) => w.teamUid === 'local')).toBe(true)
    })

    it('returns empty array when teamUid does not exist', async () => {
      await persistence.workspace.setItem(
        { slug: 'workspace-1' },
        {
          name: 'Workspace',
          teamUid: 'team-1',
          workspace: {
            documents: {},
            originalDocuments: {},
            intermediateDocuments: {},
            overrides: {},
            meta: {},
            history: {},
            auth: {},
          },
        },
      )

      const workspaces = await persistence.workspace.getAllByTeamUid('non-existent-team')

      expect(workspaces).toEqual([])
    })

    it('returns remaining workspaces after deletion', async () => {
      await persistence.workspace.setItem(
        { slug: 'workspace-1' },
        {
          name: 'Workspace 1',
          teamUid: 'team-1',
          workspace: {
            documents: {},
            originalDocuments: {},
            intermediateDocuments: {},
            overrides: {},
            meta: {},
            history: {},
            auth: {},
          },
        },
      )

      await persistence.workspace.setItem(
        { slug: 'workspace-2' },
        {
          name: 'Workspace 2',
          teamUid: 'team-1',
          workspace: {
            documents: {},
            originalDocuments: {},
            intermediateDocuments: {},
            overrides: {},
            meta: {},
            history: {},
            auth: {},
          },
        },
      )

      await persistence.workspace.setItem(
        { slug: 'workspace-3' },
        {
          name: 'Workspace 3',
          teamUid: 'team-1',
          workspace: {
            documents: {},
            originalDocuments: {},
            intermediateDocuments: {},
            overrides: {},
            meta: {},
            history: {},
            auth: {},
          },
        },
      )

      await persistence.workspace.deleteItem({ namespace: 'local', slug: 'workspace-2' })

      const workspaces = await persistence.workspace.getAllByTeamUid('team-1')

      expect(workspaces).toHaveLength(2)
      expect(workspaces.map((w) => w.slug)).toEqual(['workspace-1', 'workspace-3'])
    })

    it('returns updated workspaces when teamUid changes', async () => {
      await persistence.workspace.setItem(
        { slug: 'workspace-1' },
        {
          name: 'Workspace 1',
          teamUid: 'team-1',
          workspace: {
            documents: {},
            originalDocuments: {},
            intermediateDocuments: {},
            overrides: {},
            meta: {},
            history: {},
            auth: {},
          },
        },
      )

      const team1WorkspacesBefore = await persistence.workspace.getAllByTeamUid('team-1')
      expect(team1WorkspacesBefore).toHaveLength(1)

      await persistence.workspace.setItem(
        { slug: 'workspace-1' },
        {
          name: 'Workspace 1',
          teamUid: 'team-2',
          workspace: {
            documents: {},
            originalDocuments: {},
            intermediateDocuments: {},
            overrides: {},
            meta: {},
            history: {},
            auth: {},
          },
        },
      )

      const team1WorkspacesAfter = await persistence.workspace.getAllByTeamUid('team-1')
      const team2Workspaces = await persistence.workspace.getAllByTeamUid('team-2')

      expect(team1WorkspacesAfter).toEqual([])
      expect(team2Workspaces).toHaveLength(1)
      expect(team2Workspaces[0]?.slug).toBe('workspace-1')
    })

    it('handles multiple teams with different workspaces', async () => {
      const teams = ['team-a', 'team-b', 'team-c']

      for (const team of teams) {
        for (let j = 1; j <= 3; j++) {
          await persistence.workspace.setItem(
            { slug: `${team}-workspace-${j}` },
            {
              name: `${team} Workspace ${j}`,
              teamUid: team,
              workspace: {
                documents: {},
                originalDocuments: {},
                intermediateDocuments: {},
                overrides: {},
                meta: {},
                history: {},
                auth: {},
              },
            },
          )
        }
      }

      const teamAWorkspaces = await persistence.workspace.getAllByTeamUid('team-a')
      const teamBWorkspaces = await persistence.workspace.getAllByTeamUid('team-b')
      const teamCWorkspaces = await persistence.workspace.getAllByTeamUid('team-c')

      expect(teamAWorkspaces).toHaveLength(3)
      expect(teamBWorkspaces).toHaveLength(3)
      expect(teamCWorkspaces).toHaveLength(3)

      expect(teamAWorkspaces.every((w) => w.teamUid === 'team-a')).toBe(true)
      expect(teamBWorkspaces.every((w) => w.teamUid === 'team-b')).toBe(true)
      expect(teamCWorkspaces.every((w) => w.teamUid === 'team-c')).toBe(true)
    })

    it('returns workspaces with complete metadata', async () => {
      await persistence.workspace.setItem(
        { namespace: 'my-org', slug: 'api-workspace' },
        {
          name: 'API Workspace',
          teamUid: 'team-1',
          workspace: {
            documents: {
              'doc-1': {
                openapi: '3.1.0',
                info: { title: 'API', version: '1.0.0' },
                paths: {},
                'x-scalar-original-document-hash': '',
              },
            },
            originalDocuments: {},
            intermediateDocuments: {},
            overrides: {},
            meta: {},
            history: {},
            auth: {},
          },
        },
      )

      const workspaces = await persistence.workspace.getAllByTeamUid('team-1')

      expect(workspaces).toHaveLength(1)
      expect(workspaces[0]).toEqual({
        name: 'API Workspace',
        teamUid: 'team-1',
        namespace: 'my-org',
        slug: 'api-workspace',
      })
    })
  })

  describe('workspace.getAll', () => {
    it('returns empty array when no workspaces exist', async () => {
      const workspaces = await persistence.workspace.getAll()

      expect(workspaces).toEqual([])
    })

    it('returns all workspace IDs and names', async () => {
      // Add two workspaces
      await persistence.workspace.setItem(
        { slug: 'workspace-1' },
        {
          name: 'Workspace One',
          workspace: {
            documents: {},
            originalDocuments: {},
            intermediateDocuments: {},
            overrides: {},
            meta: {},
            history: {},
            auth: {},
          },
        },
      )

      await persistence.workspace.setItem(
        { slug: 'workspace-2' },
        {
          name: 'Workspace Two',
          workspace: {
            documents: {},
            originalDocuments: {},
            intermediateDocuments: {},
            overrides: {},
            meta: {},
            history: {},
            auth: {},
          },
        },
      )

      const workspaces = await persistence.workspace.getAll()

      expect(workspaces).toHaveLength(2)
      expect(workspaces).toEqual([
        { name: 'Workspace One', teamUid: 'local', namespace: 'local', slug: 'workspace-1' },
        { name: 'Workspace Two', teamUid: 'local', namespace: 'local', slug: 'workspace-2' },
      ])
    })

    it('returns all workspaces with different names', async () => {
      // Add multiple workspaces with various names
      await persistence.workspace.setItem(
        { slug: 'ws-alpha' },
        {
          name: 'Alpha Project',
          workspace: {
            documents: {},
            originalDocuments: {},
            intermediateDocuments: {},
            overrides: {},
            meta: {},
            history: {},
            auth: {},
          },
        },
      )

      await persistence.workspace.setItem(
        { slug: 'ws-beta' },
        {
          name: 'Beta Testing',
          workspace: {
            documents: {},
            originalDocuments: {},
            intermediateDocuments: {},
            overrides: {},
            meta: {},
            history: {},
            auth: {},
          },
        },
      )

      await persistence.workspace.setItem(
        { slug: 'ws-gamma' },
        {
          name: 'Gamma Release',
          workspace: {
            documents: {},
            originalDocuments: {},
            intermediateDocuments: {},
            overrides: {},
            meta: {},
            history: {},
            auth: {},
          },
        },
      )

      const workspaces = await persistence.workspace.getAll()

      expect(workspaces).toHaveLength(3)
      expect(workspaces.map((w) => w.name)).toEqual(['Alpha Project', 'Beta Testing', 'Gamma Release'])
      expect(workspaces.map((w) => w.slug)).toEqual(['ws-alpha', 'ws-beta', 'ws-gamma'])
    })

    it('returns remaining workspaces after deletion', async () => {
      // Add three workspaces
      await persistence.workspace.setItem(
        { slug: 'workspace-1' },
        {
          name: 'Workspace One',
          workspace: {
            documents: {},
            originalDocuments: {},
            intermediateDocuments: {},
            overrides: {},
            meta: {},
            history: {},
            auth: {},
          },
        },
      )

      await persistence.workspace.setItem(
        { slug: 'workspace-2' },
        {
          name: 'Workspace Two',
          workspace: {
            documents: {},
            originalDocuments: {},
            intermediateDocuments: {},
            overrides: {},
            meta: {},
            history: {},
            auth: {},
          },
        },
      )

      await persistence.workspace.setItem(
        { slug: 'workspace-3' },
        {
          name: 'Workspace Three',
          workspace: {
            documents: {},
            originalDocuments: {},
            intermediateDocuments: {},
            overrides: {},
            meta: {},
            history: {},
            auth: {},
          },
        },
      )

      // Delete workspace-2
      await persistence.workspace.deleteItem({ namespace: 'local', slug: 'workspace-2' })

      const workspaces = await persistence.workspace.getAll()

      expect(workspaces).toHaveLength(2)
      expect(workspaces).toEqual([
        { slug: 'workspace-1', name: 'Workspace One', teamUid: 'local', namespace: 'local' },
        { slug: 'workspace-3', name: 'Workspace Three', teamUid: 'local', namespace: 'local' },
      ])
    })

    it('returns updated workspace name after update', async () => {
      // Add a workspace
      await persistence.workspace.setItem(
        { namespace: 'local', slug: 'workspace-1' },
        {
          name: 'Original Name',
          workspace: {
            documents: {},
            originalDocuments: {},
            intermediateDocuments: {},
            overrides: {},
            meta: {},
            history: {},
            auth: {},
          },
        },
      )

      // Update the workspace name
      await persistence.workspace.setItem(
        { namespace: 'local', slug: 'workspace-1' },
        {
          name: 'Updated Name',
          workspace: {
            documents: {},
            originalDocuments: {},
            intermediateDocuments: {},
            overrides: {},
            meta: {},
            history: {},
            auth: {},
          },
        },
      )

      const workspaces = await persistence.workspace.getAll()

      expect(workspaces).toHaveLength(1)
      expect(workspaces[0]).toEqual({
        slug: 'workspace-1',
        name: 'Updated Name',
        teamUid: 'local',
        namespace: 'local',
      })
    })

    it('returns workspaces after multiple deletions', async () => {
      // Add five workspaces
      for (let i = 1; i <= 5; i++) {
        await persistence.workspace.setItem(
          { namespace: 'local', slug: `workspace-${i}` },
          {
            name: `Workspace ${i}`,
            workspace: {
              documents: {},
              originalDocuments: {},
              intermediateDocuments: {},
              overrides: {},
              meta: {},
              history: {},
              auth: {},
            },
          },
        )
      }

      // Delete workspaces 2 and 4
      await persistence.workspace.deleteItem({ namespace: 'local', slug: 'workspace-2' })
      await persistence.workspace.deleteItem({ namespace: 'local', slug: 'workspace-4' })

      const workspaces = await persistence.workspace.getAll()

      expect(workspaces).toHaveLength(3)
      expect(workspaces.map((w) => w.slug)).toEqual(['workspace-1', 'workspace-3', 'workspace-5'])
    })

    it('handles workspace with complex data', async () => {
      // Add a workspace with full data
      await persistence.workspace.setItem(
        { namespace: 'local', slug: 'complex-workspace' },
        {
          name: 'Complex API Workspace',
          workspace: {
            documents: {
              'doc-1': {
                openapi: '3.1.0',
                info: { title: 'API Doc', version: '1.0.0' },
                paths: {},
                'x-scalar-original-document-hash': '',
              },
            },
            originalDocuments: {
              'doc-1': { openapi: '3.1.0', info: { title: 'Original', version: '1.0.0' } },
            },
            intermediateDocuments: {
              'doc-1': { intermediate: true },
            },
            overrides: {
              'doc-1': { custom: 'value' },
            },
            meta: {
              'x-scalar-active-document': 'doc-1',
              'x-scalar-color-mode': 'dark',
            },
            history: {},
            auth: {},
          },
        },
      )

      const workspaces = await persistence.workspace.getAll()

      // getAll only returns id and name, not the full workspace data
      expect(workspaces).toHaveLength(1)
      expect(workspaces[0]).toEqual({
        slug: 'complex-workspace',
        name: 'Complex API Workspace',
        teamUid: 'local',
        namespace: 'local',
      })
    })

    it('returns empty array after all workspaces are deleted', async () => {
      // Add workspaces
      await persistence.workspace.setItem(
        { namespace: 'local', slug: 'workspace-1' },
        {
          name: 'Workspace One',
          workspace: {
            documents: {},
            originalDocuments: {},
            intermediateDocuments: {},
            overrides: {},
            meta: {},
            history: {},
            auth: {},
          },
        },
      )

      await persistence.workspace.setItem(
        { namespace: 'local', slug: 'workspace-2' },
        {
          name: 'Workspace Two',
          workspace: {
            documents: {},
            originalDocuments: {},
            intermediateDocuments: {},
            overrides: {},
            meta: {},
            history: {},
            auth: {},
          },
        },
      )

      // Delete all workspaces
      await persistence.workspace.deleteItem({ namespace: 'local', slug: 'workspace-1' })
      await persistence.workspace.deleteItem({ namespace: 'local', slug: 'workspace-2' })

      const workspaces = await persistence.workspace.getAll()

      expect(workspaces).toEqual([])
    })

    it('returns workspaces in consistent order', async () => {
      // Add workspaces in specific order
      const workspaceIds = ['workspace-c', 'workspace-a', 'workspace-b']

      for (const id of workspaceIds) {
        await persistence.workspace.setItem(
          { namespace: 'local', slug: id },
          {
            name: `Name ${id}`,
            workspace: {
              documents: {},
              originalDocuments: {},
              intermediateDocuments: {},
              overrides: {},
              meta: {},
              history: {},
              auth: {},
            },
          },
        )
      }

      const workspaces = await persistence.workspace.getAll()

      expect(workspaces).toHaveLength(3)
      // Order should be maintained based on insertion or alphabetical
      const slugs = workspaces.map((w) => w.slug)
      expect(slugs).toContain('workspace-a')
      expect(slugs).toContain('workspace-b')
      expect(slugs).toContain('workspace-c')
    })
  })

  describe('workspace.has', () => {
    it('returns false when the workspace does not exist', async () => {
      const exists = await persistence.workspace.has({ namespace: 'local', slug: 'missing-workspace' })
      expect(exists).toBe(false)
    })

    it('returns true when the workspace exists', async () => {
      await persistence.workspace.setItem(
        { namespace: 'local', slug: 'workspace-1' },
        {
          name: 'Exists',
          workspace: {
            documents: {},
            originalDocuments: {},
            intermediateDocuments: {},
            overrides: {},
            meta: {},
            history: {},
            auth: {},
          },
        },
      )

      const exists = await persistence.workspace.has({ namespace: 'local', slug: 'workspace-1' })
      expect(exists).toBe(true)
    })

    it('returns false after the workspace is deleted', async () => {
      await persistence.workspace.setItem(
        { namespace: 'local', slug: 'workspace-2' },
        {
          name: 'To Delete',
          workspace: {
            documents: {},
            originalDocuments: {},
            intermediateDocuments: {},
            overrides: {},
            meta: {},
            history: {},
            auth: {},
          },
        },
      )
      expect(await persistence.workspace.has({ namespace: 'local', slug: 'workspace-2' })).toBe(true)

      await persistence.workspace.deleteItem({ namespace: 'local', slug: 'workspace-2' })
      expect(await persistence.workspace.has({ namespace: 'local', slug: 'workspace-2' })).toBe(false)
    })

    it('returns false if only chunks exist without a workspace record', async () => {
      const orphanId = 'orphan-workspace'
      // Write chunks without creating the workspace record
      await persistence.meta.setItem(orphanId, { 'x-scalar-color-mode': 'dark' })
      await persistence.documents.setItem(orphanId, 'doc-1', {
        openapi: '3.1.0',
        info: { title: 'Doc', version: '1.0.0' },
        paths: {},
        'x-scalar-original-document-hash': '',
      })
      await persistence.originalDocuments.setItem(orphanId, 'doc-1', { openapi: '3.1.0' })
      await persistence.intermediateDocuments.setItem(orphanId, 'doc-1', { interim: true })
      await persistence.overrides.setItem(orphanId, 'doc-1', { x: 1 })

      const exists = await persistence.workspace.has({ namespace: 'local', slug: orphanId })
      expect(exists).toBe(false)
    })
  })

  describe('workspace chunks', () => {
    describe('meta.setItem', () => {
      it('sets workspace meta information', async () => {
        const namespace = 'local'
        const slug = 'workspace-1'
        const workspaceId = `${namespace}/${slug}`

        // Verify by getting the full workspace
        await persistence.workspace.setItem(
          { namespace, slug },
          {
            name: 'Test Workspace',
            workspace: {
              documents: {},
              originalDocuments: {},
              intermediateDocuments: {},
              overrides: {},
              meta: {},
              history: {},
              auth: {},
            },
          },
        )

        await persistence.meta.setItem(workspaceId, {
          'x-scalar-color-mode': 'dark',
          'x-scalar-active-document': 'api-doc',
        })

        const workspace = await persistence.workspace.getItem({ namespace, slug })
        expect(workspace?.workspace.meta).toEqual({
          'x-scalar-color-mode': 'dark',
          'x-scalar-active-document': 'api-doc',
        })
      })

      it('updates existing meta information', async () => {
        const namespace = 'local'
        const slug = 'workspace-1'
        const workspaceId = `${namespace}/${slug}`

        await persistence.workspace.setItem(
          { namespace, slug },
          {
            name: 'Test',
            workspace: {
              documents: {},
              originalDocuments: {},
              intermediateDocuments: {},
              overrides: {},
              meta: {},
              history: {},
              auth: {},
            },
          },
        )

        await persistence.meta.setItem(workspaceId, {
          'x-scalar-color-mode': 'dark',
        })

        await persistence.meta.setItem(workspaceId, {
          'x-scalar-color-mode': 'dark',
          'x-scalar-theme': 'moon',
        })

        const workspace = await persistence.workspace.getItem({ namespace, slug })
        expect(workspace?.workspace.meta).toEqual({
          'x-scalar-color-mode': 'dark',
          'x-scalar-theme': 'moon',
        })
      })
    })

    describe('documents.setItem', () => {
      it('sets a workspace document', async () => {
        const namespace = 'local'
        const slug = 'workspace-1'
        const workspaceId = `${namespace}/${slug}`
        const documentName = 'api-doc'

        await persistence.workspace.setItem(
          { namespace, slug },
          {
            name: 'Test Workspace',
            workspace: {
              documents: {},
              originalDocuments: {},
              intermediateDocuments: {},
              overrides: {},
              meta: {},
              history: {},
              auth: {},
            },
          },
        )

        const document = {
          openapi: '3.1.0',
          info: { title: 'Test API', version: '1.0.0' },
          paths: {},
          'x-scalar-original-document-hash': '',
        }

        await persistence.documents.setItem(workspaceId, documentName, document)

        const workspace = await persistence.workspace.getItem({ namespace, slug })
        expect(workspace?.workspace.documents[documentName]).toEqual(document)
      })

      it('sets multiple documents for the same workspace', async () => {
        const namespace = 'local'
        const slug = 'workspace-1'
        const workspaceId = `${namespace}/${slug}`

        await persistence.workspace.setItem(
          { namespace, slug },
          {
            name: 'Multi-Doc Workspace',
            workspace: {
              documents: {},
              originalDocuments: {},
              intermediateDocuments: {},
              overrides: {},
              meta: {},
              history: {},
              auth: {},
            },
          },
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

        await persistence.documents.setItem(workspaceId, 'doc-1', doc1)
        await persistence.documents.setItem(workspaceId, 'doc-2', doc2)

        const workspace = await persistence.workspace.getItem({ namespace, slug })
        expect(Object.keys(workspace?.workspace.documents ?? {})).toHaveLength(2)
        expect(workspace?.workspace.documents['doc-1']).toEqual(doc1)
        expect(workspace?.workspace.documents['doc-2']).toEqual(doc2)
      })
    })

    describe('originalDocuments.setItem', () => {
      it('sets an original document', async () => {
        const namespace = 'local'
        const slug = 'workspace-1'
        const workspaceId = `${namespace}/${slug}`
        const documentName = 'api-doc'

        await persistence.workspace.setItem(
          { namespace, slug },
          {
            name: 'Test',
            workspace: {
              documents: {},
              originalDocuments: {},
              intermediateDocuments: {},
              overrides: {},
              meta: {},
              history: {},
              auth: {},
            },
          },
        )

        const originalDoc = {
          openapi: '3.1.0',
          info: { title: 'Original API', version: '1.0.0' },
          paths: { '/users': { get: {} } },
        }

        await persistence.originalDocuments.setItem(workspaceId, documentName, originalDoc)

        const workspace = await persistence.workspace.getItem({ namespace, slug })
        expect(workspace?.workspace.originalDocuments[documentName]).toEqual(originalDoc)
      })
    })

    describe('intermediateDocuments.setItem', () => {
      it('sets an intermediate document', async () => {
        const namespace = 'local'
        const slug = 'workspace-1'
        const workspaceId = `${namespace}/${slug}`
        const documentName = 'api-doc'

        await persistence.workspace.setItem(
          { namespace, slug },
          {
            name: 'Test',
            workspace: {
              documents: {},
              originalDocuments: {},
              intermediateDocuments: {},
              overrides: {},
              meta: {},
              history: {},
              auth: {},
            },
          },
        )

        const intermediateDoc = {
          version: 2,
          processed: true,
          timestamp: Date.now(),
        }

        await persistence.intermediateDocuments.setItem(workspaceId, documentName, intermediateDoc)

        const workspace = await persistence.workspace.getItem({ namespace, slug })
        expect(workspace?.workspace.intermediateDocuments[documentName]).toEqual(intermediateDoc)
      })
    })

    describe('overrides.setItem', () => {
      it('sets document overrides', async () => {
        const namespace = 'local'
        const slug = 'workspace-1'
        const workspaceId = `${namespace}/${slug}`
        const documentName = 'api-doc'

        await persistence.workspace.setItem(
          { namespace, slug },
          {
            name: 'Test',
            workspace: {
              documents: {},
              originalDocuments: {},
              intermediateDocuments: {},
              overrides: {},
              meta: {},
              history: {},
              auth: {},
            },
          },
        )

        const overrides = {
          customProperty: 'custom value',
          baseURL: 'https://api.example.com',
        }

        await persistence.overrides.setItem(workspaceId, documentName, overrides)

        const workspace = await persistence.workspace.getItem({ namespace, slug })
        expect(workspace?.workspace.overrides[documentName]).toEqual(overrides)
      })
    })

    describe('history.setItem', () => {
      it('sets document history', async () => {
        const namespace = 'local'
        const slug = 'workspace-1'
        const workspaceId = `${namespace}/${slug}`
        const documentName = 'api-doc'

        await persistence.workspace.setItem(
          { namespace, slug },
          {
            name: 'Test',
            workspace: {
              documents: {},
              originalDocuments: {},
              intermediateDocuments: {},
              overrides: {},
              meta: {},
              history: {},
              auth: {},
            },
          },
        )

        const history = {
          '/users': {
            get: [
              {
                time: 1000,
                meta: { example: 'default' },
                timestamp: Date.now(),
                request: {
                  url: 'https://api.example.com/users',
                  method: 'GET',
                  headers: [],
                  httpVersion: 'HTTP/1.1',
                  cookies: [],
                  headersSize: -1,
                  queryString: [],
                  bodySize: -1,
                },
                response: {
                  status: 200,
                  statusText: 'OK',
                  httpVersion: 'HTTP/1.1',
                  cookies: [],
                  headers: [],
                  content: {
                    size: 0,
                    mimeType: 'application/json',
                  },
                  redirectURL: '',
                  headersSize: -1,
                  bodySize: 0,
                },
                requestMetadata: {
                  variables: {},
                },
              },
            ],
          },
        }

        await persistence.history.setItem(workspaceId, documentName, history)

        const workspace = await persistence.workspace.getItem({ namespace, slug })
        expect(workspace?.workspace.history[documentName]).toEqual(history)
      })
    })
  })
})
