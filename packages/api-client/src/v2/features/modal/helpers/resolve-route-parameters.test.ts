import { createWorkspaceStore } from '@scalar/workspace-store/client'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import { describe, expect, it } from 'vitest'

import 'fake-indexeddb/auto'

import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import {
  resolveDocumentSlug,
  resolveExampleName,
  resolveMethod,
  resolvePath,
  resolveRouteParameters,
} from './resolve-route-parameters'

const getDocument = (overrides: Partial<OpenApiDocument> = {}): OpenApiDocument => ({
  openapi: '3.0.0',
  info: { title: 'Test API', version: '' },
  paths: {},
  'x-scalar-original-document-hash': '123',
  ...overrides,
})

describe('resolve-route-parameters', () => {
  // ─────────────────────────────────────────────────────────────────────────────
  // resolveDocumentSlug
  // ─────────────────────────────────────────────────────────────────────────────

  it('returns the provided slug when it is not "default"', () => {
    const store = createWorkspaceStore()

    const result = resolveDocumentSlug(store, 'my-document')

    expect(result).toBe('my-document')
  })

  it('returns undefined when slug is undefined', () => {
    const store = createWorkspaceStore()

    const result = resolveDocumentSlug(store, undefined)

    expect(result).toBeUndefined()
  })

  it('returns "default" when a document with slug "default" exists', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'default',
      document: getDocument(),
    })

    const result = resolveDocumentSlug(store, 'default')

    expect(result).toBe('default')
  })

  it('falls back to active document when "default" slug has no matching document', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'active-doc',
      document: getDocument(),
    })
    store.update('x-scalar-active-document', 'active-doc')

    const result = resolveDocumentSlug(store, 'default')

    expect(result).toBe('active-doc')
  })

  it('falls back to first available document when no active document is set', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'first-doc',
      document: getDocument(),
    })
    await store.addDocument({
      name: 'second-doc',
      document: getDocument(),
    })

    const result = resolveDocumentSlug(store, 'default')

    expect(result).toBe('first-doc')
  })

  it('returns undefined when "default" is specified but no documents exist', () => {
    const store = createWorkspaceStore()

    const result = resolveDocumentSlug(store, 'default')

    expect(result).toBeUndefined()
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // resolvePath
  // ─────────────────────────────────────────────────────────────────────────────

  it('returns undefined when document does not exist', () => {
    const store = createWorkspaceStore()
    const ctx = { store, documentSlug: 'non-existent' }

    const result = resolvePath(ctx, '/users')

    expect(result).toBeUndefined()
  })

  it('returns the provided path when it is not "default"', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'my-doc',
      document: getDocument({ paths: { '/users': { get: { summary: 'Get users' } } } }),
    })
    const ctx = { store, documentSlug: 'my-doc' }

    const result = resolvePath(ctx, '/users')

    expect(result).toBe('/users')
  })

  it('returns the first available path when "default" is specified', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'my-doc',
      document: getDocument({
        paths: { '/users': { get: { summary: 'Get users' } }, '/posts': { get: { summary: 'Get posts' } } },
      }),
    })
    const ctx = { store, documentSlug: 'my-doc' }

    const result = resolvePath(ctx, 'default')

    expect(result).toBe('/users')
  })

  it('returns undefined when "default" is specified but document has no paths', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'my-doc',
      document: { openapi: '3.0.0', info: { title: 'Test API' }, paths: {} },
    })
    const ctx = { store, documentSlug: 'my-doc' }

    const result = resolvePath(ctx, 'default')

    expect(result).toBeUndefined()
  })

  it('returns undefined when documentSlug is undefined', () => {
    const store = createWorkspaceStore()
    const ctx = { store, documentSlug: undefined }

    const result = resolvePath(ctx, '/users')

    expect(result).toBeUndefined()
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // resolveMethod
  // ─────────────────────────────────────────────────────────────────────────────

  it('returns undefined when document does not exist', () => {
    const store = createWorkspaceStore()
    const ctx = { store, documentSlug: 'non-existent' }

    const result = resolveMethod(ctx, '/users', 'get')

    expect(result).toBeUndefined()
  })

  it('returns undefined when path is not provided', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'my-doc',
      document: getDocument({ paths: { '/users': { get: { summary: 'Get users' } } } }),
    })
    const ctx = { store, documentSlug: 'my-doc' }

    const result = resolveMethod(ctx, undefined, 'get')

    expect(result).toBeUndefined()
  })

  it('returns the provided method when it is a valid HTTP method', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'my-doc',
      document: getDocument({
        paths: { '/users': { get: { summary: 'Get users' }, post: { summary: 'Create user' } } },
      }),
    })
    const ctx = { store, documentSlug: 'my-doc' }

    const result = resolveMethod(ctx, '/users', 'post')

    expect(result).toBe('post')
  })

  it('returns undefined when provided method is not a valid HTTP method', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'my-doc',
      document: getDocument({ paths: { '/users': { get: { summary: 'Get users' } } } }),
    })
    const ctx = { store, documentSlug: 'my-doc' }

    const result = resolveMethod(ctx, '/users', 'invalid-method')

    expect(result).toBeUndefined()
  })

  it('returns the first valid HTTP method when "default" is specified', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'my-doc',
      document: getDocument({
        paths: {
          '/users': {
            parameters: [{ name: 'limit', in: 'query' }],
            get: { summary: 'Get users' },
            post: { summary: 'Create user' },
          },
        },
      }),
    })
    const ctx = { store, documentSlug: 'my-doc' }

    const result = resolveMethod(ctx, '/users', 'default')

    // Should skip 'parameters' and return the first HTTP method
    expect(result).toBe('get')
  })

  it('returns undefined when "default" is specified but path has no HTTP methods', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'my-doc',
      document: getDocument({
        paths: { '/users': { parameters: [{ name: 'limit', in: 'query' }], summary: 'User operations' } },
      }),
    })
    const ctx = { store, documentSlug: 'my-doc' }

    const result = resolveMethod(ctx, '/users', 'default')

    expect(result).toBeUndefined()
  })

  it('returns undefined when "default" is specified but path does not exist', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'my-doc',
      document: getDocument({ paths: { '/users': { get: { summary: 'Get users' } } } }),
    })
    const ctx = { store, documentSlug: 'my-doc' }

    const result = resolveMethod(ctx, '/non-existent', 'default')

    expect(result).toBeUndefined()
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // resolveExampleName
  // ─────────────────────────────────────────────────────────────────────────────

  it('returns "default" when document does not exist', () => {
    const store = createWorkspaceStore()
    const ctx = { store, documentSlug: 'non-existent' }
    const operation: TraversedEntry = {
      id: 'op-1',
      title: 'Get Users',
      type: 'operation',
      ref: '#/paths/~1users/get',
      path: '/users',
      method: 'get',
    }

    const result = resolveExampleName(ctx, operation, 'example-1')

    expect(result).toBe('default')
  })

  it('returns "default" when operation is undefined', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'my-doc',
      document: getDocument(),
    })
    const ctx = { store, documentSlug: 'my-doc' }

    const result = resolveExampleName(ctx, undefined, 'example-1')

    expect(result).toBe('default')
  })

  it('returns "default" when operation type is not "operation"', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'my-doc',
      document: getDocument(),
    })
    const ctx = { store, documentSlug: 'my-doc' }
    const tag: TraversedEntry = { id: 'tag-1', title: 'Users', type: 'tag', name: 'Users', isGroup: false }

    const result = resolveExampleName(ctx, tag, 'example-1')

    expect(result).toBe('default')
  })

  it('returns matching example name when found', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'my-doc',
      document: getDocument(),
    })
    const ctx = { store, documentSlug: 'my-doc' }
    const operation: TraversedEntry = {
      id: 'op-1',
      title: 'Get Users',
      type: 'operation',
      ref: '#/paths/~1users/get',
      path: '/users',
      method: 'get',
      children: [
        { id: 'ex-1', title: 'Example 1', type: 'example', name: 'example-1' },
        { id: 'ex-2', title: 'Example 2', type: 'example', name: 'example-2' },
      ],
    }

    const result = resolveExampleName(ctx, operation, 'example-2')

    expect(result).toBe('example-2')
  })

  it('returns first example name when "default" is specified', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'my-doc',
      document: getDocument(),
    })
    const ctx = { store, documentSlug: 'my-doc' }
    const operation: TraversedEntry = {
      id: 'op-1',
      title: 'Get Users',
      type: 'operation',
      ref: '#/paths/~1users/get',
      path: '/users',
      method: 'get',
      children: [
        { id: 'ex-1', title: 'First Example', type: 'example', name: 'first-example' },
        { id: 'ex-2', title: 'Second Example', type: 'example', name: 'second-example' },
      ],
    }

    const result = resolveExampleName(ctx, operation, 'default')

    expect(result).toBe('first-example')
  })

  it('returns "default" when "default" is specified but operation has no examples', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'my-doc',
      document: getDocument(),
    })
    const ctx = { store, documentSlug: 'my-doc' }
    const operation: TraversedEntry = {
      id: 'op-1',
      title: 'Get Users',
      type: 'operation',
      ref: '#/paths/~1users/get',
      path: '/users',
      method: 'get',
      children: [],
    }

    const result = resolveExampleName(ctx, operation, 'default')

    expect(result).toBe('default')
  })

  it('returns "default" when example key does not match any example', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'my-doc',
      document: getDocument(),
    })
    const ctx = { store, documentSlug: 'my-doc' }
    const operation: TraversedEntry = {
      id: 'op-1',
      title: 'Get Users',
      type: 'operation',
      ref: '#/paths/~1users/get',
      path: '/users',
      method: 'get',
      children: [{ id: 'ex-1', title: 'Example 1', type: 'example', name: 'example-1' }],
    }

    const result = resolveExampleName(ctx, operation, 'non-existent-example')

    expect(result).toBe('default')
  })

  it('filters out non-example children', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'my-doc',
      document: getDocument(),
    })
    const ctx = { store, documentSlug: 'my-doc' }
    const operation: TraversedEntry = {
      id: 'op-1',
      title: 'Get Users',
      type: 'operation',
      ref: '#/paths/~1users/get',
      path: '/users',
      method: 'get',
      children: [
        { id: 'tag-1', title: 'Some Tag', type: 'tag', name: 'some-tag', isGroup: false },
        { id: 'ex-1', title: 'Real Example', type: 'example', name: 'real-example' },
      ],
    }

    const result = resolveExampleName(ctx, operation, 'default')

    expect(result).toBe('real-example')
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // resolveRouteParameters (integration)
  // ─────────────────────────────────────────────────────────────────────────────
  it('resolves all parameters from explicit values', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'my-doc',
      document: getDocument({ paths: { '/users': { get: { summary: 'Get users' } } } }),
    })

    const result = resolveRouteParameters(store, {
      documentSlug: 'my-doc',
      path: '/users',
      method: 'get',
      example: 'default',
    })

    expect(result).toEqual({
      documentSlug: 'my-doc',
      path: '/users',
      method: 'get',
      example: 'default',
    })
  })

  it('resolves all parameters from "default" placeholders', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'first-doc',
      document: getDocument({ paths: { '/pets': { post: { summary: 'Create pet' } } } }),
    })

    const result = resolveRouteParameters(store, {
      documentSlug: 'default',
      path: 'default',
      method: 'default',
      example: 'default',
    })

    expect(result).toEqual({
      documentSlug: 'first-doc',
      path: '/pets',
      method: 'post',
      example: 'default',
    })
  })

  it('returns "default" example when navigation is missing', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'my-doc',
      document: getDocument({ paths: { '/users': { get: { summary: 'Get users' } } } }),
    })

    const result = resolveRouteParameters(store, {
      documentSlug: 'my-doc',
      path: '/users',
      method: 'get',
      example: 'some-example',
    })

    // Navigation exists but no matching example, so falls back to default
    expect(result.example).toBe('default')
  })

  it('handles empty workspace gracefully', () => {
    const store = createWorkspaceStore()

    const result = resolveRouteParameters(store, {
      documentSlug: 'default',
      path: 'default',
      method: 'default',
      example: 'default',
    })

    expect(result).toEqual({
      documentSlug: undefined,
      path: undefined,
      method: undefined,
      example: 'default',
    })
  })

  it('handles partial resolution when some values cannot be resolved', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'my-doc',
      document: getDocument(),
    })

    const result = resolveRouteParameters(store, {
      documentSlug: 'my-doc',
      path: 'default',
      method: 'default',
      example: 'default',
    })

    expect(result).toEqual({
      documentSlug: 'my-doc',
      path: undefined,
      method: undefined,
      example: 'default',
    })
  })

  it('uses active document when resolving "default" document slug', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'inactive-doc',
      document: getDocument({ paths: { '/old': { get: { summary: 'Old endpoint' } } } }),
    })
    await store.addDocument({
      name: 'active-doc',
      document: getDocument({ paths: { '/new': { post: { summary: 'New endpoint' } } } }),
    })
    store.update('x-scalar-active-document', 'active-doc')

    const result = resolveRouteParameters(store, {
      documentSlug: 'default',
      path: 'default',
      method: 'default',
      example: 'default',
    })

    expect(result.documentSlug).toBe('active-doc')
    expect(result.path).toBe('/new')
    expect(result.method).toBe('post')
  })
})
