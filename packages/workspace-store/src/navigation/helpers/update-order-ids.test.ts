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

    // -------------------------------------------------------------------------
    // Child x-scalar-order rewrite (tag rename)
    // -------------------------------------------------------------------------

    it('rewrites child IDs in the tag x-scalar-order when the tag ID changes', () => {
      // Operation IDs are prefixed with the parent tag slug, e.g.
      // "test-api/tag/users/GET/users". When the tag is renamed the prefix
      // changes and the stored IDs become stale. updateOrderIds must also
      // update the tag's own x-scalar-order so sortByOrder keeps working.
      const store = createWorkspaceStore()
      const docName = 'test-api'

      store.workspace.documents[docName] = {
        openapi: '3.1.0',
        info: { title: 'Test API', version: '1.0.0' },
        tags: [
          {
            name: 'customers',
            'x-scalar-order': ['test-api/tag/users/GET/users', 'test-api/tag/users/POST/users'],
          },
        ],
        'x-scalar-order': ['test-api/tag/users'],
        'x-scalar-original-document-hash': 'abc',
      }

      // generateId returns the old ID for the parent lookup, new ID for the tag
      const generateId = vi.fn((props) => {
        if (props.type === 'tag') return 'test-api/tag/customers'
        return props.id ?? 'unknown'
      })

      const docEntry = makeDocumentEntry(docName)
      const entry = makeTagEntry({
        id: 'test-api/tag/users',
        name: 'users',
        parent: docEntry,
      })

      updateOrderIds({
        store,
        generateId,
        entries: [entry],
        tag: { name: 'customers' },
      })

      const tag = store.workspace.documents[docName].tags?.[0]
      expect(tag?.['x-scalar-order']).toEqual(['test-api/tag/customers/GET/users', 'test-api/tag/customers/POST/users'])
    })

    it('skips the rewrite when the direct parent is a tagGroup (getOpenapiObject returns null for x-tagGroups)', () => {
      // When x-tagGroups are used the tag entry's immediate parent is the tagGroup
      // node. getOpenapiObject resolves tags via document.tags, not x-tagGroups,
      // so the lookup returns null and updateOrderIds exits early — the child
      // x-scalar-order is intentionally left untouched for now.
      const store = createWorkspaceStore()
      const docName = 'test-api'
      const originalChildOrder = ['test-api/tag/users/GET/users']

      store.workspace.documents[docName] = {
        openapi: '3.1.0',
        info: { title: 'Test API', version: '1.0.0' },
        tags: [{ name: 'customers', 'x-scalar-order': [...originalChildOrder] }],
        'x-scalar-order': ['test-api/tag/users'],
        'x-scalar-original-document-hash': 'abc',
      }

      const generateId = vi.fn().mockReturnValue('test-api/tag/customers')

      const docEntry = makeDocumentEntry(docName)
      const tagGroupEntry: WithParent<TraversedTag> = {
        id: 'test-api/tag/user-management',
        type: 'tag',
        title: 'User Management',
        name: 'User Management',
        isGroup: true,
        parent: docEntry,
      }
      const entry = makeTagEntry({
        id: 'test-api/tag/users',
        name: 'users',
        parent: tagGroupEntry,
      })

      updateOrderIds({
        store,
        generateId,
        entries: [entry],
        tag: { name: 'customers' },
      })

      // Early exit: nothing was changed because the tagGroup parent cannot be
      // resolved via getOpenapiObject (it searches document.tags, not x-tagGroups)
      const tag = store.workspace.documents[docName].tags?.[0]
      expect(tag?.['x-scalar-order']).toEqual(originalChildOrder)
    })

    it('does not touch child order when old and new tag IDs are identical', () => {
      // If the slug does not change (e.g. same name), no rewrite is needed.
      const store = createWorkspaceStore()
      const docName = 'test-api'
      const sameId = 'test-api/tag/users'
      const originalChildOrder = ['test-api/tag/users/GET/users']

      store.workspace.documents[docName] = {
        openapi: '3.1.0',
        info: { title: 'Test API', version: '1.0.0' },
        tags: [{ name: 'users', 'x-scalar-order': [...originalChildOrder] }],
        'x-scalar-order': [sameId],
        'x-scalar-original-document-hash': 'abc',
      }

      // generateId returns the same ID as the entry — no rename happened
      const generateId = vi.fn().mockReturnValue(sameId)
      const entry = makeTagEntry({ id: sameId, name: 'users', parent: makeDocumentEntry(docName) })

      updateOrderIds({
        store,
        generateId,
        entries: [entry],
        tag: { name: 'users' },
      })

      const tag = store.workspace.documents[docName].tags?.[0]
      expect(tag?.['x-scalar-order']).toEqual(originalChildOrder)
    })

    it('leaves unrelated IDs unchanged when rewriting child order', () => {
      // IDs that do not start with the old tag prefix must be left as-is.
      const store = createWorkspaceStore()
      const docName = 'test-api'

      store.workspace.documents[docName] = {
        openapi: '3.1.0',
        info: { title: 'Test API', version: '1.0.0' },
        tags: [
          {
            name: 'customers',
            'x-scalar-order': [
              'test-api/tag/users/GET/users', // should be rewritten
              'some-other-prefix/GET/other', // should NOT be touched
            ],
          },
        ],
        'x-scalar-order': ['test-api/tag/users'],
        'x-scalar-original-document-hash': 'abc',
      }

      const generateId = vi.fn().mockReturnValue('test-api/tag/customers')
      const entry = makeTagEntry({
        id: 'test-api/tag/users',
        name: 'users',
        parent: makeDocumentEntry(docName),
      })

      updateOrderIds({
        store,
        generateId,
        entries: [entry],
        tag: { name: 'customers' },
      })

      const tag = store.workspace.documents[docName].tags?.[0]
      expect(tag?.['x-scalar-order']).toEqual(['test-api/tag/customers/GET/users', 'some-other-prefix/GET/other'])
    })

    it('skips child order rewrite when the renamed tag is not found in document.tags', () => {
      // Should not throw when the tag object cannot be found by new name.
      const store = createWorkspaceStore()
      const docName = 'test-api'

      store.workspace.documents[docName] = {
        openapi: '3.1.0',
        info: { title: 'Test API', version: '1.0.0' },
        tags: [{ name: 'admin' }], // no 'customers' tag exists
        'x-scalar-order': ['test-api/tag/users'],
        'x-scalar-original-document-hash': 'abc',
      }

      const generateId = vi.fn().mockReturnValue('test-api/tag/customers')
      const entry = makeTagEntry({
        id: 'test-api/tag/users',
        name: 'users',
        parent: makeDocumentEntry(docName),
      })

      // Should not throw
      expect(() =>
        updateOrderIds({
          store,
          generateId,
          entries: [entry],
          tag: { name: 'customers' },
        }),
      ).not.toThrow()
    })

    it('skips child order rewrite when the tag has no x-scalar-order', () => {
      // A tag that was never reordered has no x-scalar-order; must be a no-op.
      const store = createWorkspaceStore()
      const docName = 'test-api'

      store.workspace.documents[docName] = {
        openapi: '3.1.0',
        info: { title: 'Test API', version: '1.0.0' },
        tags: [{ name: 'customers' }], // no x-scalar-order property
        'x-scalar-order': ['test-api/tag/users'],
        'x-scalar-original-document-hash': 'abc',
      }

      const generateId = vi.fn().mockReturnValue('test-api/tag/customers')
      const entry = makeTagEntry({
        id: 'test-api/tag/users',
        name: 'users',
        parent: makeDocumentEntry(docName),
      })

      expect(() =>
        updateOrderIds({
          store,
          generateId,
          entries: [entry],
          tag: { name: 'customers' },
        }),
      ).not.toThrow()

      // The tag object should remain unchanged (no x-scalar-order added)
      expect(store.workspace.documents[docName].tags?.[0]).not.toHaveProperty('x-scalar-order')
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
