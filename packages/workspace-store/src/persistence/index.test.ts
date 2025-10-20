/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { createWorkspaceStorePersistence } from '@/persistence'

import 'fake-indexeddb/auto'
import assert from 'node:assert'

describe('persistence', { concurrent: false }, () => {
  let persistence: Awaited<ReturnType<typeof createWorkspaceStorePersistence>>

  beforeEach(async () => {
    persistence = await createWorkspaceStorePersistence()
  })

  afterEach(async () => {
    await persistence.clear()
  })

  it('does save and retrieve items correctly', async () => {
    expect(await persistence.getAllItems()).toEqual([])

    await persistence.setItem('workspace-1', {
      name: 'Workspace 1',
      workspace: {
        documentConfigs: {},
        documentMeta: {},
        documents: {},
        intermediateDocuments: {},
        meta: {},
        originalDocuments: {},
        overrides: {},
      },
    })

    expect(await persistence.getAllItems()).toEqual([
      {
        id: 'workspace-1',
        name: 'Workspace 1',
        workspace: {
          documentConfigs: {},
          documentMeta: {},
          documents: {},
          intermediateDocuments: {},
          meta: {},
          originalDocuments: {},
          overrides: {},
        },
      },
    ])

    expect(await persistence.getItem('workspace-1')).toEqual({
      id: 'workspace-1',
      name: 'Workspace 1',
      workspace: {
        documentConfigs: {},
        documentMeta: {},
        documents: {},
        intermediateDocuments: {},
        meta: {},
        originalDocuments: {},
        overrides: {},
      },
    })
  })

  it('does override when we write the same id again', async () => {
    const persistence = await createWorkspaceStorePersistence()

    await persistence.setItem('workspace-1', {
      name: 'Workspace 1',
      workspace: {
        documentConfigs: {},
        documentMeta: {},
        documents: {},
        intermediateDocuments: {},
        meta: {},
        originalDocuments: {},
        overrides: {},
      },
    })

    await persistence.setItem('workspace-1', {
      name: 'Workspace 1 Updated',
      workspace: {
        documentConfigs: {},
        documentMeta: {},
        documents: {},
        intermediateDocuments: {},
        meta: {},
        originalDocuments: {},
        overrides: {},
      },
    })

    expect(await persistence.getItem('workspace-1')).toEqual({
      id: 'workspace-1',
      name: 'Workspace 1 Updated',
      workspace: {
        documentConfigs: {},
        documentMeta: {},
        documents: {},
        intermediateDocuments: {},
        meta: {},
        originalDocuments: {},
        overrides: {},
      },
    })
  })

  it('returns undefined when retrieving a non-existent workspace', async () => {
    const persistence = await createWorkspaceStorePersistence()

    const result = await persistence.getItem('non-existent-id')

    expect(result).toBeUndefined()
  })

  it('handles multiple workspaces correctly', async () => {
    const persistence = await createWorkspaceStorePersistence()

    await persistence.setItem('workspace-1', {
      name: 'Workspace 1',
      workspace: {
        documentConfigs: {},
        documentMeta: {},
        documents: {},
        intermediateDocuments: {},
        meta: {},
        originalDocuments: {},
        overrides: {},
      },
    })

    await persistence.setItem('workspace-2', {
      name: 'Workspace 2',
      workspace: {
        documentConfigs: {},
        documentMeta: {},
        documents: {},
        intermediateDocuments: {},
        meta: {},
        originalDocuments: {},
        overrides: {},
      },
    })

    await persistence.setItem('workspace-3', {
      name: 'Workspace 3',
      workspace: {
        documentConfigs: {},
        documentMeta: {},
        documents: {},
        intermediateDocuments: {},
        meta: {},
        originalDocuments: {},
        overrides: {},
      },
    })

    const allItems = await persistence.getAllItems()

    expect(allItems).toHaveLength(3)
    expect(allItems.map((item) => item.id)).toEqual(['workspace-1', 'workspace-2', 'workspace-3'])
    expect(allItems.map((item) => item.name)).toEqual(['Workspace 1', 'Workspace 2', 'Workspace 3'])
  })

  it('deletes a workspace correctly', async () => {
    const persistence = await createWorkspaceStorePersistence()

    await persistence.setItem('workspace-1', {
      name: 'Workspace 1',
      workspace: {
        documentConfigs: {},
        documentMeta: {},
        documents: {},
        intermediateDocuments: {},
        meta: {},
        originalDocuments: {},
        overrides: {},
      },
    })

    await persistence.setItem('workspace-2', {
      name: 'Workspace 2',
      workspace: {
        documentConfigs: {},
        documentMeta: {},
        documents: {},
        intermediateDocuments: {},
        meta: {},
        originalDocuments: {},
        overrides: {},
      },
    })

    expect(await persistence.getAllItems()).toHaveLength(2)

    await persistence.deleteItem('workspace-1')

    const allItems = await persistence.getAllItems()
    expect(allItems).toHaveLength(1)
    assert(allItems[0])
    expect(allItems[0].id).toBe('workspace-2')
    expect(await persistence.getItem('workspace-1')).toBeUndefined()
  })

  it('handles deleting a non-existent workspace without error', async () => {
    const persistence = await createWorkspaceStorePersistence()

    await expect(persistence.deleteItem('non-existent-id')).resolves.not.toThrow()
  })

  it('preserves workspace data structure with nested objects', async () => {
    const persistence = await createWorkspaceStorePersistence()

    await persistence.setItem('workspace-complex', {
      name: 'Complex Workspace',
      workspace: {
        documentConfigs: {
          'doc-1': {
            'x-scalar-reference-config': {
              title: 'My API',
            },
          },
        },
        documentMeta: {
          'doc-1': {
            documentSource: 'https://api.example.com/openapi.json',
          },
        },
        documents: {
          'doc-1': {
            openapi: '3.0.0',
            info: {
              title: 'My API',
              version: '1.0.0',
            },
          },
        },
        intermediateDocuments: {},
        meta: {
          'x-scalar-active-document': 'doc-1',
        },
        originalDocuments: {},
        overrides: { baseUrl: 'https://api.example.com' },
      },
    })

    const retrieved = await persistence.getItem('workspace-complex')

    expect(retrieved).toEqual({
      id: 'workspace-complex',
      name: 'Complex Workspace',
      workspace: {
        documentConfigs: {
          'doc-1': {
            'x-scalar-reference-config': {
              title: 'My API',
            },
          },
        },
        documentMeta: {
          'doc-1': {
            documentSource: 'https://api.example.com/openapi.json',
          },
        },
        documents: {
          'doc-1': {
            openapi: '3.0.0',
            info: {
              title: 'My API',
              version: '1.0.0',
            },
          },
        },
        intermediateDocuments: {},
        meta: {
          'x-scalar-active-document': 'doc-1',
        },
        originalDocuments: {},
        overrides: { baseUrl: 'https://api.example.com' },
      }
    })
  })

  it('allows closing the database connection', async () => {
    const persistence = await createWorkspaceStorePersistence()

    await persistence.setItem('workspace-1', {
      name: 'Workspace 1',
      workspace: {
        documentConfigs: {},
        documentMeta: {},
        documents: {},
        intermediateDocuments: {},
        meta: {},
        originalDocuments: {},
        overrides: {},
      },
    })

    expect(() => persistence.close()).not.toThrow()
  })

  it('handles empty strings as workspace IDs', async () => {
    const persistence = await createWorkspaceStorePersistence()

    await persistence.setItem('', {
      name: 'Empty ID Workspace',
      workspace: {
        documentConfigs: {},
        documentMeta: {},
        documents: {},
        intermediateDocuments: {},
        meta: {},
        originalDocuments: {},
        overrides: {},
      },
    })

    const retrieved = await persistence.getItem('')

    expect(retrieved).toEqual({
      id: '',
      name: 'Empty ID Workspace',
      workspace: {
        documentConfigs: {},
        documentMeta: {},
        documents: {},
        intermediateDocuments: {},
        meta: {},
        originalDocuments: {},
        overrides: {},
      },
    })
  })

  it('handles special characters in workspace IDs', async () => {
    const persistence = await createWorkspaceStorePersistence()
    const specialId = 'workspace-!@#$%^&*()_+-=[]{}|;:,.<>?'

    await persistence.setItem(specialId, {
      name: 'Special Chars Workspace',
      workspace: {
        documentConfigs: {},
        documentMeta: {},
        documents: {},
        intermediateDocuments: {},
        meta: {},
        originalDocuments: {},
        overrides: {},
      },
    })

    const retrieved = await persistence.getItem(specialId)

    expect(retrieved).toBeDefined()
    assert(retrieved)

    expect(retrieved.id).toBe(specialId)
    expect(retrieved?.name).toBe('Special Chars Workspace')
  })

  it('handles concurrent operations correctly', async () => {
    const persistence = await createWorkspaceStorePersistence()

    // Perform multiple setItem operations concurrently
    await Promise.all([
      persistence.setItem('workspace-1', {
        name: 'Workspace 1',
        workspace: {
          documentConfigs: {},
          documentMeta: {},
          documents: {},
          intermediateDocuments: {},
          meta: {},
          originalDocuments: {},
          overrides: {},
        },
      }),
      persistence.setItem('workspace-2', {
        name: 'Workspace 2',
        workspace: {
          documentConfigs: {},
          documentMeta: {},
          documents: {},
          intermediateDocuments: {},
          meta: {},
          originalDocuments: {},
          overrides: {},
        },
      }),
      persistence.setItem('workspace-3', {
        name: 'Workspace 3',
        workspace: {
          documentConfigs: {},
          documentMeta: {},
          documents: {},
          intermediateDocuments: {},
          meta: {},
          originalDocuments: {},
          overrides: {},
        },
      }),
    ])

    const allItems = await persistence.getAllItems()
    expect(allItems).toHaveLength(3)
  })
})
