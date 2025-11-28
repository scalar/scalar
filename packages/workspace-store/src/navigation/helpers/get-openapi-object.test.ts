import { describe, expect, it } from 'vitest'

import { createWorkspaceStore } from '@/client'
import type { TraversedDocument, TraversedOperation, TraversedTag, WithParent } from '@/schemas/navigation'

import { getOpenapiObject } from './get-openapi-object'

describe('getOpenapiObject', () => {
  it('returns the document when entry type is document', () => {
    const store = createWorkspaceStore()

    store.workspace.documents['test-api'] = {
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
      'x-scalar-original-document-hash': 'abc123',
    }

    const documentEntry: TraversedDocument = {
      id: 'doc-1',
      type: 'document',
      title: 'Test API',
      name: 'test-api',
    }

    const result = getOpenapiObject({ store, entry: documentEntry })

    expect(result).toBeDefined()
    expect(result).toBe(store.workspace.documents['test-api'])
    expect(result?.info.title).toBe('Test API')
  })

  it('returns the tag object when entry type is tag', () => {
    const store = createWorkspaceStore()

    store.workspace.documents['test-api'] = {
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
      tags: [
        { name: 'Users', description: 'User management endpoints' },
        { name: 'Posts', description: 'Post management endpoints' },
      ],
      'x-scalar-original-document-hash': 'abc123',
    }

    const documentEntry: TraversedDocument = {
      id: 'doc-1',
      type: 'document',
      title: 'Test API',
      name: 'test-api',
    }

    const tagEntry: WithParent<TraversedTag> = {
      id: 'tag-1',
      type: 'tag',
      title: 'Users',
      name: 'Users',
      isGroup: true,
      parent: documentEntry,
    }

    const result = getOpenapiObject({ store, entry: tagEntry })

    expect(result).toBeDefined()
    expect(result?.name).toBe('Users')
    expect(result?.description).toBe('User management endpoints')
  })

  it('returns the operation object when entry type is operation', () => {
    const store = createWorkspaceStore()

    store.workspace.documents['test-api'] = {
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/users': {
          get: {
            summary: 'Get all users',
            description: 'Retrieve a list of all users',
            operationId: 'getUsers',
          },
        },
      },
      'x-scalar-original-document-hash': 'abc123',
    }

    const documentEntry: TraversedDocument = {
      id: 'doc-1',
      type: 'document',
      title: 'Test API',
      name: 'test-api',
    }

    const operationEntry: WithParent<TraversedOperation> = {
      id: 'op-1',
      type: 'operation',
      title: 'Get all users',
      ref: 'op-ref-1',
      method: 'get',
      path: '/users',
      parent: documentEntry,
    }

    const result = getOpenapiObject({ store, entry: operationEntry })

    expect(result).toBeDefined()
    expect(result?.summary).toBe('Get all users')
    expect(result?.operationId).toBe('getUsers')
  })

  it('returns null when document is not found in the store', () => {
    const store = createWorkspaceStore()

    // Store is empty, no documents loaded

    const documentEntry: TraversedDocument = {
      id: 'doc-1',
      type: 'document',
      title: 'Missing API',
      name: 'missing-api',
    }

    const result = getOpenapiObject({ store, entry: documentEntry })

    expect(result).toBeNull()
  })

  it('returns null when parent document entry is not found', () => {
    const store = createWorkspaceStore()

    // Tag entry with no parent chain to document
    const tagEntry: TraversedTag = {
      id: 'tag-1',
      type: 'tag',
      title: 'Orphaned Tag',
      name: 'Orphaned',
      isGroup: true,
      // No parent property - orphaned entry
    }

    const result = getOpenapiObject({ store, entry: tagEntry })

    expect(result).toBeNull()
  })

  it('returns null when tag is not found in the document', () => {
    const store = createWorkspaceStore()

    store.workspace.documents['test-api'] = {
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
      tags: [{ name: 'Users', description: 'User management endpoints' }],
      'x-scalar-original-document-hash': 'abc123',
    }

    const documentEntry: TraversedDocument = {
      id: 'doc-1',
      type: 'document',
      title: 'Test API',
      name: 'test-api',
    }

    const tagEntry: WithParent<TraversedTag> = {
      id: 'tag-2',
      type: 'tag',
      title: 'NonExistent',
      name: 'NonExistent',
      isGroup: true,
      parent: documentEntry,
    }

    const result = getOpenapiObject({ store, entry: tagEntry })

    expect(result).toBeNull()
  })

  it('returns null when operation path or method does not exist', () => {
    const store = createWorkspaceStore()

    store.workspace.documents['test-api'] = {
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/users': {
          get: {
            summary: 'Get all users',
          },
        },
      },
      'x-scalar-original-document-hash': 'abc123',
    }

    const documentEntry: TraversedDocument = {
      id: 'doc-1',
      type: 'document',
      title: 'Test API',
      name: 'test-api',
    }

    const operationEntry: WithParent<TraversedOperation> = {
      id: 'op-2',
      type: 'operation',
      title: 'Delete user',
      ref: 'op-ref-2',
      method: 'delete',
      path: '/users',
      parent: documentEntry,
    }

    const result = getOpenapiObject({ store, entry: operationEntry })

    expect(result).toBeNull()
  })
})
