import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import 'fake-indexeddb/auto'

import { createWorkspaceStorePersistence } from './index'

describe('createWorkspaceStorePersistence', { concurrent: false }, () => {
  const testDbName = 'scalar-workspace-store'
  let persistence: Awaited<ReturnType<typeof createWorkspaceStorePersistence>>

  beforeEach(async () => {
    persistence = await createWorkspaceStorePersistence()
  })

  afterEach(async () => {
    await persistence.close()

    // Clean up: delete database
    const deleteRequest = indexedDB.deleteDatabase(testDbName)
    await new Promise((resolve, reject) => {
      deleteRequest.onsuccess = () => resolve(undefined)
      deleteRequest.onerror = () => reject(deleteRequest.error)
    })
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
          documentMeta: {},
          meta: {},
          documentConfigs: {},
        },
      })

      await persistence.workspace.setItem('workspace-2', {
        name: 'Workspace Two',
        workspace: {
          documents: {},
          originalDocuments: {},
          intermediateDocuments: {},
          overrides: {},
          documentMeta: {},
          meta: {},
          documentConfigs: {},
        },
      })

      const workspaces = await persistence.workspace.getAll()

      expect(workspaces).toHaveLength(2)
      expect(workspaces).toEqual([
        { id: 'workspace-1', name: 'Workspace One' },
        { id: 'workspace-2', name: 'Workspace Two' },
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
          documentMeta: {},
          meta: {},
          documentConfigs: {},
        },
      })

      await persistence.workspace.setItem('ws-beta', {
        name: 'Beta Testing',
        workspace: {
          documents: {},
          originalDocuments: {},
          intermediateDocuments: {},
          overrides: {},
          documentMeta: {},
          meta: {},
          documentConfigs: {},
        },
      })

      await persistence.workspace.setItem('ws-gamma', {
        name: 'Gamma Release',
        workspace: {
          documents: {},
          originalDocuments: {},
          intermediateDocuments: {},
          overrides: {},
          documentMeta: {},
          meta: {},
          documentConfigs: {},
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
          documentMeta: {},
          meta: {},
          documentConfigs: {},
        },
      })

      await persistence.workspace.setItem('workspace-2', {
        name: 'Workspace Two',
        workspace: {
          documents: {},
          originalDocuments: {},
          intermediateDocuments: {},
          overrides: {},
          documentMeta: {},
          meta: {},
          documentConfigs: {},
        },
      })

      await persistence.workspace.setItem('workspace-3', {
        name: 'Workspace Three',
        workspace: {
          documents: {},
          originalDocuments: {},
          intermediateDocuments: {},
          overrides: {},
          documentMeta: {},
          meta: {},
          documentConfigs: {},
        },
      })

      // Delete workspace-2
      await persistence.workspace.deleteItem('workspace-2')

      const workspaces = await persistence.workspace.getAll()

      expect(workspaces).toHaveLength(2)
      expect(workspaces).toEqual([
        { id: 'workspace-1', name: 'Workspace One' },
        { id: 'workspace-3', name: 'Workspace Three' },
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
          documentMeta: {},
          meta: {},
          documentConfigs: {},
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
          documentMeta: {},
          meta: {},
          documentConfigs: {},
        },
      })

      const workspaces = await persistence.workspace.getAll()

      expect(workspaces).toHaveLength(1)
      expect(workspaces[0]).toEqual({
        id: 'workspace-1',
        name: 'Updated Name',
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
            documentMeta: {},
            meta: {},
            documentConfigs: {},
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
          documentMeta: {
            'doc-1': { documentSource: 'https://example.com/api.json' },
          },
          meta: {
            'x-scalar-active-document': 'doc-1',
            'x-scalar-dark-mode': true,
          },
          documentConfigs: {
            'doc-1': {},
          },
        },
      })

      const workspaces = await persistence.workspace.getAll()

      // getAll only returns id and name, not the full workspace data
      expect(workspaces).toHaveLength(1)
      expect(workspaces[0]).toEqual({
        id: 'complex-workspace',
        name: 'Complex API Workspace',
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
          documentMeta: {},
          meta: {},
          documentConfigs: {},
        },
      })

      await persistence.workspace.setItem('workspace-2', {
        name: 'Workspace Two',
        workspace: {
          documents: {},
          originalDocuments: {},
          intermediateDocuments: {},
          overrides: {},
          documentMeta: {},
          meta: {},
          documentConfigs: {},
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
            documentMeta: {},
            meta: {},
            documentConfigs: {},
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
            documentMeta: {},
            meta: {},
            documentConfigs: {},
          },
        })

        await persistence.meta.setItem(workspaceId, {
          'x-scalar-dark-mode': true,
          'x-scalar-active-document': 'api-doc',
        })

        const workspace = await persistence.workspace.getItem(workspaceId)
        expect(workspace?.workspace.meta).toEqual({
          'x-scalar-dark-mode': true,
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
            documentMeta: {},
            meta: {},
            documentConfigs: {},
          },
        })

        await persistence.meta.setItem(workspaceId, {
          'x-scalar-dark-mode': false,
        })

        await persistence.meta.setItem(workspaceId, {
          'x-scalar-dark-mode': true,
          'x-scalar-theme': 'moon',
        })

        const workspace = await persistence.workspace.getItem(workspaceId)
        expect(workspace?.workspace.meta).toEqual({
          'x-scalar-dark-mode': true,
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
            documentMeta: {},
            meta: {},
            documentConfigs: {},
          },
        })

        const document = {
          openapi: '3.1.0',
          info: { title: 'Test API', version: '1.0.0' },
          paths: {},
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
            documentMeta: {},
            meta: {},
            documentConfigs: {},
          },
        })

        const doc1 = {
          openapi: '3.1.0',
          info: { title: 'API 1', version: '1.0.0' },
          paths: {},
        }

        const doc2 = {
          openapi: '3.1.0',
          info: { title: 'API 2', version: '2.0.0' },
          paths: {},
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
            documentMeta: {},
            meta: {},
            documentConfigs: {},
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
            documentMeta: {},
            meta: {},
            documentConfigs: {},
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
            documentMeta: {},
            meta: {},
            documentConfigs: {},
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

    describe('documentMeta.setItem', () => {
      it('sets document meta information', async () => {
        const workspaceId = 'workspace-1'
        const documentName = 'api-doc'

        await persistence.workspace.setItem(workspaceId, {
          name: 'Test',
          workspace: {
            documents: {},
            originalDocuments: {},
            intermediateDocuments: {},
            overrides: {},
            documentMeta: {},
            meta: {},
            documentConfigs: {},
          },
        })

        const meta = {
          documentSource: 'https://api.example.com/openapi.json',
        }

        await persistence.documentMeta.setItem(workspaceId, documentName, meta)

        const workspace = await persistence.workspace.getItem(workspaceId)
        expect(workspace?.workspace.documentMeta[documentName]).toEqual(meta)
      })

      it('handles optional documentSource', async () => {
        const workspaceId = 'workspace-1'
        const documentName = 'api-doc'

        await persistence.workspace.setItem(workspaceId, {
          name: 'Test',
          workspace: {
            documents: {},
            originalDocuments: {},
            intermediateDocuments: {},
            overrides: {},
            documentMeta: {},
            meta: {},
            documentConfigs: {},
          },
        })

        await persistence.documentMeta.setItem(workspaceId, documentName, {})

        const workspace = await persistence.workspace.getItem(workspaceId)
        expect(workspace?.workspace.documentMeta[documentName]).toEqual({})
      })
    })

    describe('documentConfigs.setItem', () => {
      it('sets document configuration', async () => {
        const workspaceId = 'workspace-1'
        const documentName = 'api-doc'

        await persistence.workspace.setItem(workspaceId, {
          name: 'Test',
          workspace: {
            documents: {},
            originalDocuments: {},
            intermediateDocuments: {},
            overrides: {},
            documentMeta: {},
            meta: {},
            documentConfigs: {},
          },
        })

        await persistence.documentConfigs.setItem(workspaceId, documentName, {
          'x-scalar-reference-config': {
            features: {
              showModels: true,
            },
          },
        })

        const workspace = await persistence.workspace.getItem(workspaceId)
        expect(workspace?.workspace.documentConfigs[documentName]).toEqual({
          'x-scalar-reference-config': {
            features: {
              showModels: true,
            },
          },
        })
      })
    })
  })
})
