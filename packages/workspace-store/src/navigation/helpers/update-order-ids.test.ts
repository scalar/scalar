import { describe, expect, it, vi } from 'vitest'

import { createWorkspaceStore } from '@/client'
import type {
  TraversedDocument,
  TraversedOperation,
  TraversedTag,
  TraversedWebhook,
  WithParent,
} from '@/schemas/navigation'

import { updateOrderIds } from './update-order-ids'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal document entry for use as a parent. */
const makeDocumentEntry = (name = 'test-api'): TraversedDocument => ({
  id: `doc-${name}`,
  type: 'document',
  title: 'Test API',
  name,
})

/** Build a minimal operation entry with a document as its parent. */
const makeOperationEntry = (
  overrides: Partial<WithParent<TraversedOperation>> & {
    parent?: WithParent<TraversedDocument> | TraversedDocument
  } = {},
): WithParent<TraversedOperation> => ({
  id: 'op-1',
  type: 'operation',
  title: 'Get users',
  ref: 'op-ref',
  method: 'get',
  path: '/users',
  parent: makeDocumentEntry(),
  ...overrides,
})

/** Build a minimal tag entry with a document as its parent. */
const makeTagEntry = (overrides: Partial<WithParent<TraversedTag>> = {}): WithParent<TraversedTag> => ({
  id: 'tag-1',
  type: 'tag',
  title: 'Users',
  name: 'Users',
  isGroup: true,
  parent: makeDocumentEntry(),
  ...overrides,
})

/** Build a minimal webhook entry with a document as its parent. */
const makeWebhookEntry = (overrides: Partial<WithParent<TraversedWebhook>> = {}): WithParent<TraversedWebhook> => ({
  id: 'webhook-1',
  type: 'webhook',
  title: 'User created',
  ref: 'webhook-ref',
  method: 'post',
  name: 'user.created',
  parent: makeDocumentEntry(),
  ...overrides,
})

describe('update-order-ids', () => {
  describe('updateOrderIds – operation entries', () => {
    it('replaces the entry ID in x-scalar-order of a document parent', () => {
      const store = createWorkspaceStore()
      const docName = 'test-api'

      store.workspace.documents[docName] = {
        openapi: '3.1.0',
        info: { title: 'Test API', version: '1.0.0' },
        'x-scalar-order': ['op-1', 'op-2'],
        'x-scalar-original-document-hash': 'abc',
      }

      const generateId = vi.fn().mockReturnValue('op-new')
      const entry = makeOperationEntry({ id: 'op-1' })

      updateOrderIds({
        store,
        generateId,
        entries: [entry],
        operation: { summary: 'Get users' },
        method: 'get',
        path: '/users',
      })

      expect(store.workspace.documents[docName]['x-scalar-order']).toEqual(['op-new', 'op-2'])
      expect(generateId).toHaveBeenCalledOnce()
      expect(generateId).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'operation', path: '/users', method: 'get' }),
      )
    })

    it('passes the correct parentTag when the parent entry is a tag', () => {
      const store = createWorkspaceStore()
      const docName = 'test-api'

      // The document holds the tag object
      store.workspace.documents[docName] = {
        openapi: '3.1.0',
        info: { title: 'Test API', version: '1.0.0' },
        tags: [{ name: 'Users', description: 'User management' }],
        'x-scalar-original-document-hash': 'abc',
      }

      // The tag itself (child of the document) holds the x-scalar-order
      const docEntry = makeDocumentEntry(docName)
      const tagEntry: WithParent<TraversedTag> = {
        id: 'tag-1',
        type: 'tag',
        title: 'Users',
        name: 'Users',
        isGroup: true,
        parent: docEntry,
        // Attach order directly onto the tag object in the store via the document
      }

      // Attach x-scalar-order to the tag object in the document
      store.workspace.documents[docName].tags![0]!['x-scalar-order'] = ['op-1']

      const operationEntry: WithParent<TraversedOperation> = {
        id: 'op-1',
        type: 'operation',
        title: 'Get users',
        ref: 'op-ref',
        method: 'get',
        path: '/users',
        parent: tagEntry,
      }

      const generateId = vi.fn().mockReturnValue('op-updated')

      updateOrderIds({
        store,
        generateId,
        entries: [operationEntry],
        operation: { summary: 'Get users' },
        method: 'post',
        path: '/users/new',
      })

      expect(store.workspace.documents[docName].tags![0]!['x-scalar-order']).toEqual(['op-updated'])
      expect(generateId).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'operation',
          path: '/users/new',
          method: 'post',
          parentId: 'tag-1',
          parentTag: expect.objectContaining({ id: 'tag-1' }),
        }),
      )
    })

    it('updates multiple entries in the same order array', () => {
      const store = createWorkspaceStore()
      const docName = 'test-api'

      store.workspace.documents[docName] = {
        openapi: '3.1.0',
        info: { title: 'Test API', version: '1.0.0' },
        'x-scalar-order': ['op-a', 'op-b', 'op-c'],
        'x-scalar-original-document-hash': 'abc',
      }

      const docEntry = makeDocumentEntry(docName)

      const entryA = makeOperationEntry({ id: 'op-a', parent: docEntry })
      const entryB = makeOperationEntry({ id: 'op-b', parent: docEntry })

      let callCount = 0
      const generateId = vi.fn(() => `op-new-${++callCount}`)

      updateOrderIds({
        store,
        generateId,
        entries: [entryA, entryB],
        operation: { summary: 'Get users' },
        method: 'get',
        path: '/users',
      })

      expect(store.workspace.documents[docName]['x-scalar-order']).toEqual(['op-new-1', 'op-new-2', 'op-c'])
      expect(generateId).toHaveBeenCalledTimes(2)
    })

    it('does nothing when the entry ID is not present in x-scalar-order', () => {
      const store = createWorkspaceStore()
      const docName = 'test-api'

      const originalOrder = ['op-x', 'op-y']
      store.workspace.documents[docName] = {
        openapi: '3.1.0',
        info: { title: 'Test API', version: '1.0.0' },
        'x-scalar-order': [...originalOrder],
        'x-scalar-original-document-hash': 'abc',
      }

      const generateId = vi.fn().mockReturnValue('op-new')
      // entry ID 'op-1' does not exist in the order array
      const entry = makeOperationEntry({ id: 'op-1' })

      updateOrderIds({
        store,
        generateId,
        entries: [entry],
        operation: {},
        method: 'get',
        path: '/users',
      })

      expect(store.workspace.documents[docName]['x-scalar-order']).toEqual(originalOrder)
      expect(generateId).not.toHaveBeenCalled()
    })

    it('does nothing when the parent has no x-scalar-order property', () => {
      const store = createWorkspaceStore()
      const docName = 'test-api'

      // Document exists but has no x-scalar-order
      store.workspace.documents[docName] = {
        openapi: '3.1.0',
        info: { title: 'Test API', version: '1.0.0' },
        'x-scalar-original-document-hash': 'abc',
      }

      const generateId = vi.fn().mockReturnValue('op-new')
      const entry = makeOperationEntry({ id: 'op-1' })

      updateOrderIds({
        store,
        generateId,
        entries: [entry],
        operation: {},
        method: 'get',
        path: '/users',
      })

      expect(generateId).not.toHaveBeenCalled()
    })

    it('does nothing when the document cannot be found in the store', () => {
      const store = createWorkspaceStore()
      // No documents loaded

      const generateId = vi.fn().mockReturnValue('op-new')
      const entry = makeOperationEntry({ id: 'op-1' })

      updateOrderIds({
        store,
        generateId,
        entries: [entry],
        operation: {},
        method: 'get',
        path: '/users',
      })

      expect(generateId).not.toHaveBeenCalled()
    })

    it('skips entries whose parent type cannot hold an order (e.g. text)', () => {
      const store = createWorkspaceStore()

      const generateId = vi.fn().mockReturnValue('op-new')

      // Operation whose parent is a "text" description entry – not orderable
      const entry: WithParent<TraversedOperation> = {
        id: 'op-1',
        type: 'operation',
        title: 'Some op',
        ref: 'ref',
        method: 'get',
        path: '/path',
        parent: {
          id: 'text-1',
          type: 'text',
          title: 'Some description',
          parent: makeDocumentEntry(),
        } as unknown as TraversedDocument,
      }

      updateOrderIds({
        store,
        generateId,
        entries: [entry],
        operation: {},
        method: 'get',
        path: '/path',
      })

      expect(generateId).not.toHaveBeenCalled()
    })

    it('does nothing when entries array is empty', () => {
      const store = createWorkspaceStore()
      const generateId = vi.fn()

      updateOrderIds({
        store,
        generateId,
        entries: [],
        operation: {},
        method: 'get',
        path: '/users',
      })

      expect(generateId).not.toHaveBeenCalled()
    })
  })

  describe('updateOrderIds – tag entries', () => {
    it('replaces the tag entry ID in x-scalar-order of the document parent', () => {
      const store = createWorkspaceStore()
      const docName = 'test-api'

      store.workspace.documents[docName] = {
        openapi: '3.1.0',
        info: { title: 'Test API', version: '1.0.0' },
        'x-scalar-order': ['tag-1', 'tag-2'],
        'x-scalar-original-document-hash': 'abc',
      }

      const generateId = vi.fn().mockReturnValue('tag-renamed')
      const entry = makeTagEntry({ id: 'tag-1' })

      updateOrderIds({
        store,
        generateId,
        entries: [entry],
        tag: { name: 'RenamedUsers' },
      })

      expect(store.workspace.documents[docName]['x-scalar-order']).toEqual(['tag-renamed', 'tag-2'])
      expect(generateId).toHaveBeenCalledOnce()
      expect(generateId).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'tag',
          parentId: entry.parent.id,
          tag: { name: 'RenamedUsers' },
        }),
      )
    })

    it('updates multiple tag entries in the same order array', () => {
      const store = createWorkspaceStore()
      const docName = 'test-api'

      store.workspace.documents[docName] = {
        openapi: '3.1.0',
        info: { title: 'Test API', version: '1.0.0' },
        'x-scalar-order': ['tag-a', 'tag-b', 'tag-c'],
        'x-scalar-original-document-hash': 'abc',
      }

      const docEntry = makeDocumentEntry(docName)
      const entryA = makeTagEntry({ id: 'tag-a', parent: docEntry })
      const entryB = makeTagEntry({ id: 'tag-b', parent: docEntry })

      let callCount = 0
      const generateId = vi.fn(() => `tag-new-${++callCount}`)

      updateOrderIds({
        store,
        generateId,
        entries: [entryA, entryB],
        tag: { name: 'Renamed' },
      })

      expect(store.workspace.documents[docName]['x-scalar-order']).toEqual(['tag-new-1', 'tag-new-2', 'tag-c'])
      expect(generateId).toHaveBeenCalledTimes(2)
    })

    it('does nothing when the tag ID is not in x-scalar-order', () => {
      const store = createWorkspaceStore()
      const docName = 'test-api'

      const originalOrder = ['tag-x', 'tag-y']
      store.workspace.documents[docName] = {
        openapi: '3.1.0',
        info: { title: 'Test API', version: '1.0.0' },
        'x-scalar-order': [...originalOrder],
        'x-scalar-original-document-hash': 'abc',
      }

      const generateId = vi.fn().mockReturnValue('tag-new')
      const entry = makeTagEntry({ id: 'tag-not-in-order' })

      updateOrderIds({
        store,
        generateId,
        entries: [entry],
        tag: { name: 'Whatever' },
      })

      expect(store.workspace.documents[docName]['x-scalar-order']).toEqual(originalOrder)
      expect(generateId).not.toHaveBeenCalled()
    })

    it('does nothing when the parent document is not in the store', () => {
      const store = createWorkspaceStore()
      const generateId = vi.fn()

      const entry = makeTagEntry({ id: 'tag-1' })

      updateOrderIds({
        store,
        generateId,
        entries: [entry],
        tag: { name: 'SomeTag' },
      })

      expect(generateId).not.toHaveBeenCalled()
    })

    it('does nothing when entries array is empty', () => {
      const store = createWorkspaceStore()
      const generateId = vi.fn()

      updateOrderIds({
        store,
        generateId,
        entries: [],
        tag: { name: 'SomeTag' },
      })

      expect(generateId).not.toHaveBeenCalled()
    })
  })

  describe('updateOrderIds – webhook entries', () => {
    it('replaces the webhook entry ID in x-scalar-order of a document parent', () => {
      const store = createWorkspaceStore()
      const docName = 'test-api'

      store.workspace.documents[docName] = {
        openapi: '3.1.0',
        info: { title: 'Test API', version: '1.0.0' },
        'x-scalar-order': ['webhook-1', 'webhook-2'],
        'x-scalar-original-document-hash': 'abc',
      }

      const generateId = vi.fn().mockReturnValue('webhook-new')
      const entry = makeWebhookEntry({ id: 'webhook-1' })

      updateOrderIds({
        store,
        generateId,
        entries: [entry],
        operation: { summary: 'User created webhook' },
        method: 'post',
        path: 'user.created',
      })

      expect(store.workspace.documents[docName]['x-scalar-order']).toEqual(['webhook-new', 'webhook-2'])
      expect(generateId).toHaveBeenCalledOnce()
      expect(generateId).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'operation', method: 'post', path: 'user.created' }),
      )
    })

    it('does nothing when the webhook ID is not in x-scalar-order', () => {
      const store = createWorkspaceStore()
      const docName = 'test-api'

      const originalOrder = ['webhook-x']
      store.workspace.documents[docName] = {
        openapi: '3.1.0',
        info: { title: 'Test API', version: '1.0.0' },
        'x-scalar-order': [...originalOrder],
        'x-scalar-original-document-hash': 'abc',
      }

      const generateId = vi.fn()
      const entry = makeWebhookEntry({ id: 'webhook-not-found' })

      updateOrderIds({
        store,
        generateId,
        entries: [entry],
        operation: {},
        method: 'post',
        path: 'user.created',
      })

      expect(store.workspace.documents[docName]['x-scalar-order']).toEqual(originalOrder)
      expect(generateId).not.toHaveBeenCalled()
    })
  })
})
