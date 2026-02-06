import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { assert, describe, expect, it } from 'vitest'

import { importDocumentToWorkspace } from './import-document-to-workspace'

describe('importDocumentToWorkspace', () => {
  it('successfully imports a document with a unique slug', async () => {
    const workspaceStore = createWorkspaceStore()
    await workspaceStore.addDocument({
      name: 'existing-doc',
      document: {
        openapi: '3.1.0',
        info: { title: 'Existing Doc', version: '1.0.0' },
        paths: {},
      },
    })

    const sourceStore = createWorkspaceStore()
    await sourceStore.addDocument({
      name: 'api-doc',
      document: {
        openapi: '3.1.0',
        info: { title: 'Imported API', version: '1.0.0' },
        paths: {},
      },
    })
    const workspaceState = sourceStore.exportWorkspace()

    const result = await importDocumentToWorkspace({
      workspaceStore,
      workspaceState,
      name: 'api-doc',
    })

    assert(result.ok)
    expect(result.slug).toBe('imported-api')
    expect(workspaceStore.workspace.documents[result.slug]).toBeDefined()
    expect(workspaceStore.workspace.documents[result.slug]?.info.title).toBe('Imported API')
  })

  it('returns error when workspace store is null', async () => {
    const sourceStore = createWorkspaceStore()
    await sourceStore.addDocument({
      name: 'api-doc',
      document: {
        openapi: '3.1.0',
        info: { title: 'Imported API', version: '1.0.0' },
        paths: {},
      },
    })
    const workspaceState = sourceStore.exportWorkspace()

    const result = await importDocumentToWorkspace({
      workspaceStore: null,
      workspaceState,
      name: 'api-doc',
    })

    expect(result).toEqual({ ok: false, error: 'Workspace store is not available' })
  })

  it('returns error when importing document is not found in workspace state', async () => {
    const workspaceStore = createWorkspaceStore()

    const sourceStore = createWorkspaceStore()
    await sourceStore.addDocument({
      name: 'api-doc',
      document: {
        openapi: '3.1.0',
        info: { title: 'Imported API', version: '1.0.0' },
        paths: {},
      },
    })
    const workspaceState = sourceStore.exportWorkspace()

    const result = await importDocumentToWorkspace({
      workspaceStore,
      workspaceState,
      name: 'non-existent-doc',
    })

    expect(result).toEqual({
      ok: false,
      error: 'Importing document not found in workspace state',
    })
  })

  it('generates unique slug when document with same name exists', async () => {
    const workspaceStore = createWorkspaceStore()
    await workspaceStore.addDocument({
      name: 'imported-api',
      document: {
        openapi: '3.1.0',
        info: { title: 'Existing Imported API', version: '1.0.0' },
        paths: {},
      },
    })

    const sourceStore = createWorkspaceStore()
    await sourceStore.addDocument({
      name: 'api-doc',
      document: {
        openapi: '3.1.0',
        info: { title: 'Imported API', version: '1.0.0' },
        paths: {},
      },
    })
    const workspaceState = sourceStore.exportWorkspace()

    const result = await importDocumentToWorkspace({
      workspaceStore,
      workspaceState,
      name: 'api-doc',
    })

    assert(result.ok)
    expect(result.slug).toBe('imported-api-1')
    expect(workspaceStore.workspace.documents[result.slug]).toBeDefined()
  })

  it('handles documents without intermediateDocuments by using empty object', async () => {
    const workspaceStore = createWorkspaceStore()

    const sourceStore = createWorkspaceStore()
    await sourceStore.addDocument({
      name: 'api-doc',
      document: {
        openapi: '3.1.0',
        info: { title: 'API Without Intermediate', version: '1.0.0' },
        paths: {},
      },
    })
    const workspaceState = sourceStore.exportWorkspace()
    delete workspaceState.intermediateDocuments['api-doc']

    const result = await importDocumentToWorkspace({
      workspaceStore,
      workspaceState,
      name: 'api-doc',
    })

    assert(result.ok)
    expect(workspaceStore.workspace.documents[result.slug]).toBeDefined()
  })

  it('handles documents without originalDocuments by using empty object', async () => {
    const workspaceStore = createWorkspaceStore()

    const sourceStore = createWorkspaceStore()
    await sourceStore.addDocument({
      name: 'api-doc',
      document: {
        openapi: '3.1.0',
        info: { title: 'API Without Original', version: '1.0.0' },
        paths: {},
      },
    })
    const workspaceState = sourceStore.exportWorkspace()
    delete workspaceState.originalDocuments['api-doc']

    const result = await importDocumentToWorkspace({
      workspaceStore,
      workspaceState,
      name: 'api-doc',
    })

    assert(result.ok)
    expect(workspaceStore.workspace.documents[result.slug]).toBeDefined()
  })

  it('handles documents without overrides by using empty object', async () => {
    const workspaceStore = createWorkspaceStore()

    const sourceStore = createWorkspaceStore()
    await sourceStore.addDocument({
      name: 'api-doc',
      document: {
        openapi: '3.1.0',
        info: { title: 'API Without Overrides', version: '1.0.0' },
        paths: {},
      },
    })
    const workspaceState = sourceStore.exportWorkspace()
    delete workspaceState.overrides['api-doc']

    const result = await importDocumentToWorkspace({
      workspaceStore,
      workspaceState,
      name: 'api-doc',
    })

    assert(result.ok)
    expect(workspaceStore.workspace.documents[result.slug]).toBeDefined()
  })

  it('imports document with its correct title', async () => {
    const workspaceStore = createWorkspaceStore()

    const sourceStore = createWorkspaceStore()
    await sourceStore.addDocument({
      name: 'api-doc',
      document: {
        openapi: '3.1.0',
        info: { title: 'Custom API Title', version: '1.0.0' },
        paths: {},
      },
    })
    const workspaceState = sourceStore.exportWorkspace()

    const result = await importDocumentToWorkspace({
      workspaceStore,
      workspaceState,
      name: 'api-doc',
    })

    assert(result.ok)
    expect(result.slug).toBe('custom-api-title')
    expect(workspaceStore.workspace.documents[result.slug]?.info.title).toBe('Custom API Title')
  })

  it('generates incrementing slugs for multiple imports of same title', async () => {
    const workspaceStore = createWorkspaceStore()

    const sourceStore1 = createWorkspaceStore()
    await sourceStore1.addDocument({
      name: 'api-doc-1',
      document: {
        openapi: '3.1.0',
        info: { title: 'My API', version: '1.0.0' },
        paths: {},
      },
    })
    const workspaceState1 = sourceStore1.exportWorkspace()

    const result1 = await importDocumentToWorkspace({
      workspaceStore,
      workspaceState: workspaceState1,
      name: 'api-doc-1',
    })

    const sourceStore2 = createWorkspaceStore()
    await sourceStore2.addDocument({
      name: 'api-doc-2',
      document: {
        openapi: '3.1.0',
        info: { title: 'My API', version: '1.0.0' },
        paths: {},
      },
    })
    const workspaceState2 = sourceStore2.exportWorkspace()

    const result2 = await importDocumentToWorkspace({
      workspaceStore,
      workspaceState: workspaceState2,
      name: 'api-doc-2',
    })

    const sourceStore3 = createWorkspaceStore()
    await sourceStore3.addDocument({
      name: 'api-doc-3',
      document: {
        openapi: '3.1.0',
        info: { title: 'My API', version: '1.0.0' },
        paths: {},
      },
    })
    const workspaceState3 = sourceStore3.exportWorkspace()

    const result3 = await importDocumentToWorkspace({
      workspaceStore,
      workspaceState: workspaceState3,
      name: 'api-doc-3',
    })

    assert(result1.ok)
    assert(result2.ok)
    assert(result3.ok)

    expect(result1.slug).toBe('my-api')
    expect(result2.slug).toBe('my-api-1')
    expect(result3.slug).toBe('my-api-2')
  })

  it('handles complex document structures', async () => {
    const workspaceStore = createWorkspaceStore()

    const sourceStore = createWorkspaceStore()
    await sourceStore.addDocument({
      name: 'complex-doc',
      document: {
        openapi: '3.1.0',
        info: { title: 'Complex API', version: '2.0.0', description: 'A complex API' },
        paths: {
          '/users': {
            get: {
              summary: 'Get users',
              responses: {
                '200': {
                  description: 'Success',
                },
              },
            },
          },
        },
        components: {
          schemas: {
            User: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
              },
            },
          },
        },
      },
    })
    const workspaceState = sourceStore.exportWorkspace()

    const result = await importDocumentToWorkspace({
      workspaceStore,
      workspaceState,
      name: 'complex-doc',
    })

    assert(result.ok)
    const importedDoc = workspaceStore.workspace.documents[result.slug]
    expect(importedDoc).toBeDefined()
    expect(importedDoc?.info.title).toBe('Complex API')
    expect(importedDoc?.info.version).toBe('2.0.0')
    expect(importedDoc?.paths?.['/users']).toBeDefined()
    expect(importedDoc?.components?.schemas?.User).toBeDefined()
  })

  it('handles workspace with no existing documents', async () => {
    const workspaceStore = createWorkspaceStore()

    const sourceStore = createWorkspaceStore()
    await sourceStore.addDocument({
      name: 'api-doc',
      document: {
        openapi: '3.1.0',
        info: { title: 'First API', version: '1.0.0' },
        paths: {},
      },
    })
    const workspaceState = sourceStore.exportWorkspace()

    const result = await importDocumentToWorkspace({
      workspaceStore,
      workspaceState,
      name: 'api-doc',
    })

    assert(result.ok)
    expect(result.slug).toBe('first-api')
    expect(Object.keys(workspaceStore.workspace.documents)).toHaveLength(1)
  })

  it('preserves existing documents when importing new one', async () => {
    const workspaceStore = createWorkspaceStore()
    await workspaceStore.addDocument({
      name: 'existing-1',
      document: {
        openapi: '3.1.0',
        info: { title: 'Existing 1', version: '1.0.0' },
        paths: {},
      },
    })
    await workspaceStore.addDocument({
      name: 'existing-2',
      document: {
        openapi: '3.1.0',
        info: { title: 'Existing 2', version: '1.0.0' },
        paths: {},
      },
    })

    const sourceStore = createWorkspaceStore()
    await sourceStore.addDocument({
      name: 'api-doc',
      document: {
        openapi: '3.1.0',
        info: { title: 'New API', version: '1.0.0' },
        paths: {},
      },
    })
    const workspaceState = sourceStore.exportWorkspace()

    const result = await importDocumentToWorkspace({
      workspaceStore,
      workspaceState,
      name: 'api-doc',
    })

    assert(result.ok)
    expect(Object.keys(workspaceStore.workspace.documents)).toHaveLength(3)
    expect(workspaceStore.workspace.documents['existing-1']).toBeDefined()
    expect(workspaceStore.workspace.documents['existing-2']).toBeDefined()
    expect(workspaceStore.workspace.documents[result.slug]).toBeDefined()
  })

  it('handles special characters in document titles', async () => {
    const workspaceStore = createWorkspaceStore()

    const sourceStore = createWorkspaceStore()
    await sourceStore.addDocument({
      name: 'api-doc',
      document: {
        openapi: '3.1.0',
        info: { title: 'My Special @API #Name', version: '1.0.0' },
        paths: {},
      },
    })
    const workspaceState = sourceStore.exportWorkspace()

    const result = await importDocumentToWorkspace({
      workspaceStore,
      workspaceState,
      name: 'api-doc',
    })

    assert(result.ok)
    expect(result.slug).toBe('my-special-@api-#name')
    expect(workspaceStore.workspace.documents[result.slug]).toBeDefined()
  })

  it('handles empty title by using default slug', async () => {
    const workspaceStore = createWorkspaceStore()

    const sourceStore = createWorkspaceStore()
    await sourceStore.addDocument({
      name: 'api-doc',
      document: {
        openapi: '3.1.0',
        info: { version: '1.0.0' },
        paths: {},
      },
    })
    const workspaceState = sourceStore.exportWorkspace()

    const result = await importDocumentToWorkspace({
      workspaceStore,
      workspaceState,
      name: 'api-doc',
    })

    assert(result.ok)
    expect(workspaceStore.workspace.documents[result.slug]).toBeDefined()
  })

  it('returns error when slug generation fails', async () => {
    const workspaceStore = createWorkspaceStore()

    const existingDocuments = Array.from({ length: 101 }, (_, i) => `my-api${i === 0 ? '' : `-${i}`}`)
    for (const docName of existingDocuments) {
      await workspaceStore.addDocument({
        name: docName,
        document: {
          openapi: '3.1.0',
          info: { title: 'Existing', version: '1.0.0' },
          paths: {},
        },
      })
    }

    const sourceStore = createWorkspaceStore()
    await sourceStore.addDocument({
      name: 'api-doc',
      document: {
        openapi: '3.1.0',
        info: { title: 'My API', version: '1.0.0' },
        paths: {},
      },
    })
    const workspaceState = sourceStore.exportWorkspace()

    const result = await importDocumentToWorkspace({
      workspaceStore,
      workspaceState,
      name: 'api-doc',
    })

    expect(result).toEqual({
      ok: false,
      error: 'Failed to generate a unique slug for the importing document',
    })
  })

  it('builds sidebar navigation for imported document', async () => {
    const workspaceStore = createWorkspaceStore()

    const sourceStore = createWorkspaceStore()
    await sourceStore.addDocument({
      name: 'api-doc',
      document: {
        openapi: '3.1.0',
        info: { title: 'API With Navigation', version: '1.0.0' },
        paths: {
          '/users': {
            get: {
              summary: 'Get users',
              operationId: 'getUsers',
              responses: {},
            },
          },
        },
      },
    })
    const workspaceState = sourceStore.exportWorkspace()

    const result = await importDocumentToWorkspace({
      workspaceStore,
      workspaceState,
      name: 'api-doc',
    })

    assert(result.ok)
    const importedDoc = workspaceStore.workspace.documents[result.slug]
    expect(importedDoc?.['x-scalar-navigation']).toBeDefined()
    expect(importedDoc?.['x-scalar-navigation']?.name).toBe('api-with-navigation')
  })
})
