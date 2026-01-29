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

  describe('workspace.getAll', () => {
    it('returns empty array when no workspaces exist', async () => {
      const workspaces = await persistence.workspace.getAll()

      expect(workspaces).toEqual([])
    })

    it('returns all workspace IDs and names', async () => {
      // Add two workspaces
      await persistence.workspace.setItem('workspace-1', {
        name: 'Workspace One',
        workspace: {
          documents: {},
          originalDocuments: {},
          intermediateDocuments: {},
          overrides: {},
          meta: {},
        },
      })

      await persistence.workspace.setItem('workspace-2', {
        name: 'Workspace Two',
        workspace: {
          documents: {},
          originalDocuments: {},
          intermediateDocuments: {},
          overrides: {},
          meta: {},
        },
      })

      const workspaces = await persistence.workspace.getAll()

      expect(workspaces).toHaveLength(2)
      expect(workspaces).toEqual([
        { id: 'workspace-1', name: 'Workspace One', teamUid: 'LOCAL', namespace: 'LOCAL', slug: 'LOCAL' },
        { id: 'workspace-2', name: 'Workspace Two', teamUid: 'LOCAL', namespace: 'LOCAL', slug: 'LOCAL' },
      ])
    })

    it('returns all workspaces with different names', async () => {
      // Add multiple workspaces with various names
      await persistence.workspace.setItem('ws-alpha', {
        name: 'Alpha Project',
        workspace: {
          documents: {},
          originalDocuments: {},
          intermediateDocuments: {},
          overrides: {},
          meta: {},
        },
      })

      await persistence.workspace.setItem('ws-beta', {
        name: 'Beta Testing',
        workspace: {
          documents: {},
          originalDocuments: {},
          intermediateDocuments: {},
          overrides: {},
          meta: {},
        },
      })

      await persistence.workspace.setItem('ws-gamma', {
        name: 'Gamma Release',
        workspace: {
          documents: {},
          originalDocuments: {},
          intermediateDocuments: {},
          overrides: {},
          meta: {},
        },
      })

      const workspaces = await persistence.workspace.getAll()

      expect(workspaces).toHaveLength(3)
      expect(workspaces.map((w) => w.name)).toEqual(['Alpha Project', 'Beta Testing', 'Gamma Release'])
      expect(workspaces.map((w) => w.id)).toEqual(['ws-alpha', 'ws-beta', 'ws-gamma'])
    })

    it('returns remaining workspaces after deletion', async () => {
      // Add three workspaces
      await persistence.workspace.setItem('workspace-1', {
        name: 'Workspace One',
        workspace: {
          documents: {},
          originalDocuments: {},
          intermediateDocuments: {},
          overrides: {},
          meta: {},
        },
      })

      await persistence.workspace.setItem('workspace-2', {
        name: 'Workspace Two',
        workspace: {
          documents: {},
          originalDocuments: {},
          intermediateDocuments: {},
          overrides: {},
          meta: {},
        },
      })

      await persistence.workspace.setItem('workspace-3', {
        name: 'Workspace Three',
        workspace: {
          documents: {},
          originalDocuments: {},
          intermediateDocuments: {},
          overrides: {},
          meta: {},
        },
      })

      // Delete workspace-2
      await persistence.workspace.deleteItem('workspace-2')

      const workspaces = await persistence.workspace.getAll()

      expect(workspaces).toHaveLength(2)
      expect(workspaces).toEqual([
        { id: 'workspace-1', name: 'Workspace One', teamUid: 'LOCAL', namespace: 'LOCAL', slug: 'LOCAL' },
        { id: 'workspace-3', name: 'Workspace Three', teamUid: 'LOCAL', namespace: 'LOCAL', slug: 'LOCAL' },
      ])
    })

    it('returns updated workspace name after update', async () => {
      // Add a workspace
      await persistence.workspace.setItem('workspace-1', {
        name: 'Original Name',
        workspace: {
          documents: {},
          originalDocuments: {},
          intermediateDocuments: {},
          overrides: {},
          meta: {},
        },
      })

      // Update the workspace name
      await persistence.workspace.setItem('workspace-1', {
        name: 'Updated Name',
        workspace: {
          documents: {},
          originalDocuments: {},
          intermediateDocuments: {},
          overrides: {},

          meta: {},
        },
      })

      const workspaces = await persistence.workspace.getAll()

      expect(workspaces).toHaveLength(1)
      expect(workspaces[0]).toEqual({
        id: 'workspace-1',
        name: 'Updated Name',
        teamUid: 'LOCAL',
        namespace: 'LOCAL',
        slug: 'LOCAL',
      })
    })

    it('returns workspaces after multiple deletions', async () => {
      // Add five workspaces
      for (let i = 1; i <= 5; i++) {
        await persistence.workspace.setItem(`workspace-${i}`, {
          name: `Workspace ${i}`,
          workspace: {
            documents: {},
            originalDocuments: {},
            intermediateDocuments: {},
            overrides: {},

            meta: {},
          },
        })
      }

      // Delete workspaces 2 and 4
      await persistence.workspace.deleteItem('workspace-2')
      await persistence.workspace.deleteItem('workspace-4')

      const workspaces = await persistence.workspace.getAll()

      expect(workspaces).toHaveLength(3)
      expect(workspaces.map((w) => w.id)).toEqual(['workspace-1', 'workspace-3', 'workspace-5'])
    })

    it('handles workspace with complex data', async () => {
      // Add a workspace with full data
      await persistence.workspace.setItem('complex-workspace', {
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
        },
      })

      const workspaces = await persistence.workspace.getAll()

      // getAll only returns id and name, not the full workspace data
      expect(workspaces).toHaveLength(1)
      expect(workspaces[0]).toEqual({
        id: 'complex-workspace',
        name: 'Complex API Workspace',
        teamUid: 'LOCAL',
        namespace: 'LOCAL',
        slug: 'LOCAL',
      })
    })

    it('returns empty array after all workspaces are deleted', async () => {
      // Add workspaces
      await persistence.workspace.setItem('workspace-1', {
        name: 'Workspace One',
        workspace: {
          documents: {},
          originalDocuments: {},
          intermediateDocuments: {},
          overrides: {},

          meta: {},
        },
      })

      await persistence.workspace.setItem('workspace-2', {
        name: 'Workspace Two',
        workspace: {
          documents: {},
          originalDocuments: {},
          intermediateDocuments: {},
          overrides: {},

          meta: {},
        },
      })

      // Delete all workspaces
      await persistence.workspace.deleteItem('workspace-1')
      await persistence.workspace.deleteItem('workspace-2')

      const workspaces = await persistence.workspace.getAll()

      expect(workspaces).toEqual([])
    })

    it('returns workspaces in consistent order', async () => {
      // Add workspaces in specific order
      const workspaceIds = ['workspace-c', 'workspace-a', 'workspace-b']

      for (const id of workspaceIds) {
        await persistence.workspace.setItem(id, {
          name: `Name ${id}`,
          workspace: {
            documents: {},
            originalDocuments: {},
            intermediateDocuments: {},
            overrides: {},

            meta: {},
          },
        })
      }

      const workspaces = await persistence.workspace.getAll()

      expect(workspaces).toHaveLength(3)
      // Order should be maintained based on insertion or alphabetical
      const ids = workspaces.map((w) => w.id)
      expect(ids).toContain('workspace-a')
      expect(ids).toContain('workspace-b')
      expect(ids).toContain('workspace-c')
    })
  })

  describe('workspace.has', () => {
    it('returns false when the workspace does not exist', async () => {
      const exists = await persistence.workspace.has('missing-workspace')
      expect(exists).toBe(false)
    })

    it('returns true when the workspace exists', async () => {
      await persistence.workspace.setItem('workspace-1', {
        name: 'Exists',
        workspace: {
          documents: {},
          originalDocuments: {},
          intermediateDocuments: {},
          overrides: {},
          meta: {},
        },
      })

      const exists = await persistence.workspace.has('workspace-1')
      expect(exists).toBe(true)
    })

    it('returns false after the workspace is deleted', async () => {
      await persistence.workspace.setItem('workspace-2', {
        name: 'To Delete',
        workspace: {
          documents: {},
          originalDocuments: {},
          intermediateDocuments: {},
          overrides: {},
          meta: {},
        },
      })
      expect(await persistence.workspace.has('workspace-2')).toBe(true)

      await persistence.workspace.deleteItem('workspace-2')
      expect(await persistence.workspace.has('workspace-2')).toBe(false)
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

      const exists = await persistence.workspace.has(orphanId)
      expect(exists).toBe(false)
    })
  })

  describe('workspace chunks', () => {
    describe('meta.setItem', () => {
      it('sets workspace meta information', async () => {
        const workspaceId = 'workspace-1'

        // Verify by getting the full workspace
        await persistence.workspace.setItem(workspaceId, {
          name: 'Test Workspace',
          workspace: {
            documents: {},
            originalDocuments: {},
            intermediateDocuments: {},
            overrides: {},

            meta: {},
          },
        })

        await persistence.meta.setItem(workspaceId, {
          'x-scalar-color-mode': 'dark',
          'x-scalar-active-document': 'api-doc',
        })

        const workspace = await persistence.workspace.getItem(workspaceId)
        expect(workspace?.workspace.meta).toEqual({
          'x-scalar-color-mode': 'dark',
          'x-scalar-active-document': 'api-doc',
        })
      })

      it('updates existing meta information', async () => {
        const workspaceId = 'workspace-1'

        await persistence.workspace.setItem(workspaceId, {
          name: 'Test',
          workspace: {
            documents: {},
            originalDocuments: {},
            intermediateDocuments: {},
            overrides: {},

            meta: {},
          },
        })

        await persistence.meta.setItem(workspaceId, {
          'x-scalar-color-mode': 'dark',
        })

        await persistence.meta.setItem(workspaceId, {
          'x-scalar-color-mode': 'dark',
          'x-scalar-theme': 'moon',
        })

        const workspace = await persistence.workspace.getItem(workspaceId)
        expect(workspace?.workspace.meta).toEqual({
          'x-scalar-color-mode': 'dark',
          'x-scalar-theme': 'moon',
        })
      })
    })

    describe('documents.setItem', () => {
      it('sets a workspace document', async () => {
        const workspaceId = 'workspace-1'
        const documentName = 'api-doc'

        await persistence.workspace.setItem(workspaceId, {
          name: 'Test Workspace',
          workspace: {
            documents: {},
            originalDocuments: {},
            intermediateDocuments: {},
            overrides: {},

            meta: {},
          },
        })

        const document = {
          openapi: '3.1.0',
          info: { title: 'Test API', version: '1.0.0' },
          paths: {},
          'x-scalar-original-document-hash': '',
        }

        await persistence.documents.setItem(workspaceId, documentName, document)

        const workspace = await persistence.workspace.getItem(workspaceId)
        expect(workspace?.workspace.documents[documentName]).toEqual(document)
      })

      it('sets multiple documents for the same workspace', async () => {
        const workspaceId = 'workspace-1'

        await persistence.workspace.setItem(workspaceId, {
          name: 'Multi-Doc Workspace',
          workspace: {
            documents: {},
            originalDocuments: {},
            intermediateDocuments: {},
            overrides: {},

            meta: {},
          },
        })

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

        const workspace = await persistence.workspace.getItem(workspaceId)
        expect(Object.keys(workspace?.workspace.documents ?? {})).toHaveLength(2)
        expect(workspace?.workspace.documents['doc-1']).toEqual(doc1)
        expect(workspace?.workspace.documents['doc-2']).toEqual(doc2)
      })
    })

    describe('originalDocuments.setItem', () => {
      it('sets an original document', async () => {
        const workspaceId = 'workspace-1'
        const documentName = 'api-doc'

        await persistence.workspace.setItem(workspaceId, {
          name: 'Test',
          workspace: {
            documents: {},
            originalDocuments: {},
            intermediateDocuments: {},
            overrides: {},

            meta: {},
          },
        })

        const originalDoc = {
          openapi: '3.1.0',
          info: { title: 'Original API', version: '1.0.0' },
          paths: { '/users': { get: {} } },
        }

        await persistence.originalDocuments.setItem(workspaceId, documentName, originalDoc)

        const workspace = await persistence.workspace.getItem(workspaceId)
        expect(workspace?.workspace.originalDocuments[documentName]).toEqual(originalDoc)
      })
    })

    describe('intermediateDocuments.setItem', () => {
      it('sets an intermediate document', async () => {
        const workspaceId = 'workspace-1'
        const documentName = 'api-doc'

        await persistence.workspace.setItem(workspaceId, {
          name: 'Test',
          workspace: {
            documents: {},
            originalDocuments: {},
            intermediateDocuments: {},
            overrides: {},

            meta: {},
          },
        })

        const intermediateDoc = {
          version: 2,
          processed: true,
          timestamp: Date.now(),
        }

        await persistence.intermediateDocuments.setItem(workspaceId, documentName, intermediateDoc)

        const workspace = await persistence.workspace.getItem(workspaceId)
        expect(workspace?.workspace.intermediateDocuments[documentName]).toEqual(intermediateDoc)
      })
    })

    describe('overrides.setItem', () => {
      it('sets document overrides', async () => {
        const workspaceId = 'workspace-1'
        const documentName = 'api-doc'

        await persistence.workspace.setItem(workspaceId, {
          name: 'Test',
          workspace: {
            documents: {},
            originalDocuments: {},
            intermediateDocuments: {},
            overrides: {},

            meta: {},
          },
        })

        const overrides = {
          customProperty: 'custom value',
          baseURL: 'https://api.example.com',
        }

        await persistence.overrides.setItem(workspaceId, documentName, overrides)

        const workspace = await persistence.workspace.getItem(workspaceId)
        expect(workspace?.workspace.overrides[documentName]).toEqual(overrides)
      })
    })
  })
})
