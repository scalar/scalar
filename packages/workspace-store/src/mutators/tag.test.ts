import { describe, expect, it, vi } from 'vitest'

import { createWorkspaceStore } from '@/client'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import type { OpenApiDocument } from '@/schemas/v3.1/strict/openapi-document'

import { createTag, deleteTag } from './tag'

const createDocument = (overrides: Partial<OpenApiDocument> = {}): OpenApiDocument => {
  return {
    openapi: '3.1.1',
    info: { title: 'Test', version: '1.0.0' },
    ...overrides,
    'x-scalar-original-document-hash': '',
  }
}

describe('createTag', () => {
  it('adds a tag to a document with existing tags array', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createDocument({
        tags: [{ name: 'existing-tag' }],
      }),
    })

    createTag(store, { documentName: 'test-doc', name: 'new-tag' })

    const document = store.workspace.documents['test-doc']
    expect(document?.tags).toHaveLength(2)
    expect(document?.tags?.[0]?.name).toBe('existing-tag')
    expect(document?.tags?.[1]?.name).toBe('new-tag')
  })

  it('initializes tags array when missing', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createDocument(),
    })

    createTag(store, { documentName: 'test-doc', name: 'first-tag' })

    const document = store.workspace.documents['test-doc']
    expect(document?.tags).toHaveLength(1)
    expect(document?.tags?.[0]?.name).toBe('first-tag')
  })

  it('no-ops when document does not exist', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      return
    })
    const store = createWorkspaceStore()

    createTag(store, { documentName: 'non-existent', name: 'tag' })

    expect(consoleSpy).toHaveBeenCalledWith('Document not found', expect.any(Object))
    consoleSpy.mockRestore()
  })

  it('no-ops when store is null', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      return
    })

    createTag(null, { documentName: 'test-doc', name: 'tag' })

    expect(consoleSpy).toHaveBeenCalledWith('Document not found', expect.any(Object))
    consoleSpy.mockRestore()
  })

  it('adds multiple tags sequentially', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createDocument(),
    })

    createTag(store, { documentName: 'test-doc', name: 'tag-1' })
    createTag(store, { documentName: 'test-doc', name: 'tag-2' })
    createTag(store, { documentName: 'test-doc', name: 'tag-3' })

    const document = store.workspace.documents['test-doc']
    expect(document?.tags).toHaveLength(3)
    expect(document?.tags?.map((t) => t.name)).toEqual(['tag-1', 'tag-2', 'tag-3'])
  })
})

describe('deleteTag', () => {
  it('removes a tag from the document tags array', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createDocument({
        tags: [{ name: 'tag-1' }, { name: 'tag-2' }, { name: 'tag-3' }],
      }),
    })

    deleteTag(store, { documentName: 'test-doc', name: 'tag-2' })

    const document = store.workspace.documents['test-doc']
    expect(document?.tags).toHaveLength(2)
    expect(document?.tags?.map((t) => t.name)).toEqual(['tag-1', 'tag-3'])
  })

  it('removes tag from operations in paths', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createDocument({
        tags: [{ name: 'users' }, { name: 'admin' }],
        paths: {
          '/users': {
            get: {
              tags: ['users', 'admin'],
              summary: 'Get users',
            },
            post: {
              tags: ['users'],
              summary: 'Create user',
            },
          },
        },
      }),
    })

    deleteTag(store, { documentName: 'test-doc', name: 'users' })

    const document = store.workspace.documents['test-doc']
    expect(document?.tags?.map((t) => t.name)).toEqual(['admin'])
    expect(getResolvedRef(document?.paths?.['/users']?.get)?.tags).toEqual(['admin'])
    expect(getResolvedRef(document?.paths?.['/users']?.post)?.tags).toEqual([])
  })

  it('removes tag from webhooks', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createDocument({
        tags: [{ name: 'webhook-tag' }, { name: 'other-tag' }],
        webhooks: {
          newUser: {
            post: {
              tags: ['webhook-tag', 'other-tag'],
              summary: 'New user webhook',
            },
          },
        },
      }),
    })

    deleteTag(store, { documentName: 'test-doc', name: 'webhook-tag' })

    const document = store.workspace.documents['test-doc']
    expect(document?.tags?.map((t) => t.name)).toEqual(['other-tag'])
    expect(getResolvedRef(document?.webhooks?.newUser?.post)?.tags).toEqual(['other-tag'])
  })

  it('no-ops when document does not exist', () => {
    const store = createWorkspaceStore()

    expect(() => deleteTag(store, { documentName: 'non-existent', name: 'tag' })).not.toThrow()
  })

  it('no-ops when store is null', () => {
    expect(() => deleteTag(null, { documentName: 'test-doc', name: 'tag' })).not.toThrow()
  })

  it('handles operations that are not objects', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createDocument({
        tags: [{ name: 'tag' }],
        paths: {
          '/users': {
            get: {
              tags: ['tag'],
              summary: 'Get users',
            },
            // Non-object values that should be skipped
            parameters: [{ name: 'param', in: 'query' }],
          },
        },
      }),
    })

    expect(() => deleteTag(store, { documentName: 'test-doc', name: 'tag' })).not.toThrow()

    const document = store.workspace.documents['test-doc']
    expect(document?.tags).toEqual([])
    expect(getResolvedRef(document?.paths?.['/users']?.get)?.tags).toEqual([])
  })

  it('handles operations without tags property', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createDocument({
        tags: [{ name: 'tag' }],
        paths: {
          '/users': {
            get: {
              summary: 'Get users',
              // No tags property
            },
          },
        },
      }),
    })

    expect(() => deleteTag(store, { documentName: 'test-doc', name: 'tag' })).not.toThrow()

    const document = store.workspace.documents['test-doc']
    expect(document?.tags).toEqual([])
  })

  it('handles document without paths', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createDocument({
        tags: [{ name: 'tag' }],
      }),
    })

    deleteTag(store, { documentName: 'test-doc', name: 'tag' })

    const document = store.workspace.documents['test-doc']
    expect(document?.tags).toEqual([])
  })

  it('handles document without webhooks', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createDocument({
        tags: [{ name: 'tag' }],
        paths: {
          '/users': {
            get: {
              tags: ['tag'],
            },
          },
        },
      }),
    })

    deleteTag(store, { documentName: 'test-doc', name: 'tag' })

    const document = store.workspace.documents['test-doc']
    expect(document?.tags).toEqual([])
    expect(getResolvedRef(document?.paths?.['/users']?.get)?.tags).toEqual([])
  })

  it('handles document without tags array', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createDocument({
        paths: {
          '/users': {
            get: {
              tags: ['tag'],
            },
          },
        },
      }),
    })

    deleteTag(store, { documentName: 'test-doc', name: 'tag' })

    const document = store.workspace.documents['test-doc']
    expect(document?.tags).toBeUndefined()
    expect(getResolvedRef(document?.paths?.['/users']?.get)?.tags).toEqual([])
  })

  it('removes tag from multiple paths and methods', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createDocument({
        tags: [{ name: 'common' }, { name: 'specific' }],
        paths: {
          '/users': {
            get: { tags: ['common'] },
            post: { tags: ['common', 'specific'] },
            put: { tags: ['specific'] },
          },
          '/products': {
            get: { tags: ['common'] },
            delete: { tags: ['common', 'specific'] },
          },
        },
      }),
    })

    deleteTag(store, { documentName: 'test-doc', name: 'common' })

    const document = store.workspace.documents['test-doc']
    expect(document?.tags?.map((t) => t.name)).toEqual(['specific'])
    expect(getResolvedRef(document?.paths?.['/users']?.get)?.tags).toEqual([])
    expect(getResolvedRef(document?.paths?.['/users']?.post)?.tags).toEqual(['specific'])
    expect(getResolvedRef(document?.paths?.['/users']?.put)?.tags).toEqual(['specific'])
    expect(getResolvedRef(document?.paths?.['/products']?.get)?.tags).toEqual([])
    expect(getResolvedRef(document?.paths?.['/products']?.delete)?.tags).toEqual(['specific'])
  })

  it('handles deleting a tag that does not exist', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createDocument({
        tags: [{ name: 'existing-tag' }],
        paths: {
          '/users': {
            get: { tags: ['existing-tag'] },
          },
        },
      }),
    })

    deleteTag(store, { documentName: 'test-doc', name: 'non-existent-tag' })

    // Tags array and operation tags should remain unchanged
    const document = store.workspace.documents['test-doc']
    expect(document?.tags?.map((t) => t.name)).toEqual(['existing-tag'])
    expect(getResolvedRef(document?.paths?.['/users']?.get)?.tags).toEqual(['existing-tag'])
  })
})
