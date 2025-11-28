import { describe, expect, it } from 'vitest'

import type { TraversedDocument } from '@/schemas/navigation'

import { getOperationEntries } from './get-operation-entries'

describe('getOperationEntries', () => {
  it('returns empty map for document with no operations', () => {
    const document: TraversedDocument = {
      id: 'doc-1',
      type: 'document',
      name: 'Test API',
      title: 'Test API',
      children: [],
    }

    const result = getOperationEntries(document)

    expect(result.size).toBe(0)
  })

  it('returns map with single operation entry', () => {
    const document: TraversedDocument = {
      id: 'doc-1',
      type: 'document',
      name: 'Test API',
      title: 'Test API',
      children: [
        {
          id: 'op-1',
          type: 'operation',
          title: 'Get users',
          ref: 'op-ref-1',
          method: 'get',
          path: '/users',
        },
      ],
    }

    const result = getOperationEntries(document)

    expect(result.size).toBe(1)
    expect(result.has('/users|get')).toBe(true)
    expect(result.get('/users|get')).toHaveLength(1)
    expect(result.get('/users|get')?.[0]).toMatchObject({
      id: 'op-1',
      method: 'get',
      path: '/users',
    })
  })

  it('groups multiple operations with different paths correctly', () => {
    const document: TraversedDocument = {
      id: 'doc-1',
      type: 'document',
      name: 'Test API',
      title: 'Test API',
      children: [
        {
          id: 'op-1',
          type: 'operation',
          title: 'Get users',
          ref: 'op-ref-1',
          method: 'get',
          path: '/users',
        },
        {
          id: 'tag-1',
          type: 'tag',
          title: 'Users',
          name: 'Users',
          isGroup: true,
          children: [
            {
              id: 'op-1.5',
              type: 'operation',
              title: 'Get users (tagged)',
              ref: 'op-ref-1.5',
              method: 'get',
              path: '/users',
            },
          ],
        },
        {
          id: 'op-2',
          type: 'operation',
          title: 'Create user',
          ref: 'op-ref-2',
          method: 'post',
          path: '/users',
        },
        {
          id: 'op-3',
          type: 'operation',
          title: 'Get posts',
          ref: 'op-ref-3',
          method: 'get',
          path: '/posts',
        },
      ],
    }

    const result = getOperationEntries(document)

    expect(result.size).toBe(3)
    expect(result.has('/users|get')).toBe(true)
    expect(result.has('/users|post')).toBe(true)
    expect(result.has('/posts|get')).toBe(true)
    expect(result.get('/users|get')?.[0]?.id).toBe('op-1')
    expect(result.get('/users|get')?.[0]?.parent?.id).toBe('doc-1')
    expect(result.get('/users|get')?.[1]?.id).toBe('op-1.5')
    expect(result.get('/users|post')?.[0]?.id).toBe('op-2')
    expect(result.get('/posts|get')?.[0]?.id).toBe('op-3')
  })

  it('traverses nested tags to collect operations', () => {
    const document: TraversedDocument = {
      id: 'doc-1',
      type: 'document',
      name: 'Test API',
      title: 'Test API',
      children: [
        {
          id: 'tag-1',
          type: 'tag',
          title: 'Users',
          name: 'Users',
          isGroup: true,
          children: [
            {
              id: 'op-1',
              type: 'operation',
              title: 'Get users',
              ref: 'op-ref-1',
              method: 'get',
              path: '/users',
            },
            {
              id: 'tag-2',
              type: 'tag',
              title: 'Admin',
              name: 'Admin',
              isGroup: true,
              children: [
                {
                  id: 'op-2',
                  type: 'operation',
                  title: 'Admin get users',
                  ref: 'op-ref-2',
                  method: 'get',
                  path: '/admin/users',
                },
                {
                  id: 'tag-3',
                  type: 'tag',
                  title: 'Super Admin',
                  name: 'Super Admin',
                  isGroup: true,
                  children: [
                    {
                      id: 'op-3',
                      type: 'operation',
                      title: 'Super admin operations',
                      ref: 'op-ref-3',
                      method: 'delete',
                      path: '/admin/users',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'op-4',
          type: 'operation',
          title: 'Health check',
          ref: 'op-ref-4',
          method: 'get',
          path: '/health',
        },
      ],
    }

    const result = getOperationEntries(document)

    expect(result.size).toBe(4)
    expect(result.has('/users|get')).toBe(true)
    expect(result.has('/admin/users|get')).toBe(true)
    expect(result.has('/admin/users|delete')).toBe(true)
    expect(result.has('/health|get')).toBe(true)
    expect(result.get('/users|get')?.[0]?.id).toBe('op-1')
    expect(result.get('/users|get')?.[0]?.parent?.id).toBe('tag-1')
    expect(result.get('/users|get')?.[0]?.parent).toMatchObject({ parent: { id: 'doc-1' } })
    expect(result.get('/admin/users|get')?.[0]?.id).toBe('op-2')
    expect(result.get('/admin/users|get')?.[0]?.parent?.id).toBe('tag-2')
    expect(result.get('/admin/users|delete')?.[0]?.id).toBe('op-3')
    expect(result.get('/admin/users|delete')?.[0]?.parent?.id).toBe('tag-3')
    expect(result.get('/admin/users|delete')?.[0]?.id).toBe('op-3')
    expect(result.get('/health|get')?.[0]?.id).toBe('op-4')
  })

  it('handles documents with mixed entry types including webhooks', () => {
    const document: TraversedDocument = {
      id: 'doc-1',
      type: 'document',
      name: 'Test API',
      title: 'Test API',
      children: [
        {
          id: 'text-1',
          type: 'text',
          title: 'Introduction',
        },
        {
          id: 'op-1',
          type: 'operation',
          title: 'Get users',
          ref: 'op-ref-1',
          method: 'get',
          path: '/users',
        },
        {
          id: 'models-1',
          type: 'models',
          title: 'Models',
          name: 'Models',
          children: [
            {
              id: 'model-1',
              type: 'model',
              title: 'User',
              name: 'User',
              ref: 'model-ref-1',
            },
          ],
        },
        {
          id: 'webhook-1',
          type: 'webhook',
          title: 'User created',
          name: 'user.created',
          ref: 'webhook-ref-1',
          method: 'post',
        },
        {
          id: 'op-2',
          type: 'operation',
          title: 'Create user',
          ref: 'op-ref-2',
          method: 'post',
          path: '/users',
        },
      ],
    }

    const result = getOperationEntries(document)

    expect(result.size).toBe(3)
    expect(result.get('/users|get')?.[0]?.id).toBe('op-1')
    expect(result.get('/users|post')?.[0]?.id).toBe('op-2')
    expect(result.get('user.created|post')?.[0]?.id).toBe('webhook-1')
  })
})
