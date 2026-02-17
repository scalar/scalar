import { describe, expect, it } from 'vitest'

import type { TraversedDocument } from '@/schemas/navigation'

import { getTagEntries } from './get-tag-entries'

describe('get-tag-entries', () => {
  describe('getTagEntries', () => {
    it('returns empty map for document with no tags', () => {
      const document: TraversedDocument = {
        id: 'doc-1',
        type: 'document',
        name: 'Test API',
        title: 'Test API',
        children: [],
      }

      const result = getTagEntries(document)

      expect(result.size).toBe(0)
    })

    it('returns empty map for document with undefined children', () => {
      const document: TraversedDocument = {
        id: 'doc-1',
        type: 'document',
        name: 'Test API',
        title: 'Test API',
      }

      const result = getTagEntries(document)

      expect(result.size).toBe(0)
    })

    it('returns empty map when document only contains operations (no tags)', () => {
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

      const result = getTagEntries(document)

      expect(result.size).toBe(0)
    })

    it('returns map with a single tag entry', () => {
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
            isGroup: false,
          },
        ],
      }

      const result = getTagEntries(document)

      expect(result.size).toBe(1)
      expect(result.has('Users')).toBe(true)
      expect(result.get('Users')).toHaveLength(1)
      expect(result.get('Users')?.[0]).toMatchObject({ id: 'tag-1', name: 'Users' })
    })

    it('attaches the correct parent reference to tag entries', () => {
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
            isGroup: false,
          },
        ],
      }

      const result = getTagEntries(document)

      expect(result.get('Users')?.[0]?.parent).toMatchObject({ id: 'doc-1', type: 'document' })
    })

    it('collects multiple tags at the same level', () => {
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
            isGroup: false,
          },
          {
            id: 'tag-2',
            type: 'tag',
            title: 'Posts',
            name: 'Posts',
            isGroup: false,
          },
          {
            id: 'tag-3',
            type: 'tag',
            title: 'Comments',
            name: 'Comments',
            isGroup: false,
          },
        ],
      }

      const result = getTagEntries(document)

      expect(result.size).toBe(3)
      expect(result.get('Users')?.[0]?.id).toBe('tag-1')
      expect(result.get('Posts')?.[0]?.id).toBe('tag-2')
      expect(result.get('Comments')?.[0]?.id).toBe('tag-3')
    })

    it('groups duplicate tag names into the same array', () => {
      // Tags with the same name can appear in multiple x-tagGroups
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
            isGroup: false,
          },
          {
            id: 'tag-2',
            type: 'tag',
            title: 'Users',
            name: 'Users',
            isGroup: false,
          },
        ],
      }

      const result = getTagEntries(document)

      expect(result.size).toBe(1)
      expect(result.get('Users')).toHaveLength(2)
      expect(result.get('Users')?.[0]?.id).toBe('tag-1')
      expect(result.get('Users')?.[1]?.id).toBe('tag-2')
    })

    it('traverses into nested tags and collects children', () => {
      const document: TraversedDocument = {
        id: 'doc-1',
        type: 'document',
        name: 'Test API',
        title: 'Test API',
        children: [
          {
            id: 'group-1',
            type: 'tag',
            title: 'V1',
            name: 'V1',
            isGroup: true,
            children: [
              {
                id: 'tag-1',
                type: 'tag',
                title: 'Users',
                name: 'Users',
                isGroup: false,
              },
              {
                id: 'tag-2',
                type: 'tag',
                title: 'Posts',
                name: 'Posts',
                isGroup: false,
              },
            ],
          },
        ],
      }

      const result = getTagEntries(document)

      // The outer group and both children should be collected
      expect(result.size).toBe(3)
      expect(result.has('V1')).toBe(true)
      expect(result.has('Users')).toBe(true)
      expect(result.has('Posts')).toBe(true)
    })

    it('attaches the correct parent when tag is nested inside another tag', () => {
      const document: TraversedDocument = {
        id: 'doc-1',
        type: 'document',
        name: 'Test API',
        title: 'Test API',
        children: [
          {
            id: 'group-1',
            type: 'tag',
            title: 'V1',
            name: 'V1',
            isGroup: true,
            children: [
              {
                id: 'tag-1',
                type: 'tag',
                title: 'Users',
                name: 'Users',
                isGroup: false,
              },
            ],
          },
        ],
      }

      const result = getTagEntries(document)

      // The child tag's parent should be the outer group (V1), not the document
      expect(result.get('Users')?.[0]?.parent).toMatchObject({ id: 'group-1', name: 'V1' })
      // And V1's parent should be the document
      expect(result.get('V1')?.[0]?.parent).toMatchObject({ id: 'doc-1' })
    })

    it('ignores non-tag entry types (operations, webhooks, models, text)', () => {
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
            id: 'webhook-1',
            type: 'webhook',
            title: 'User created',
            name: 'user.created',
            ref: 'webhook-ref-1',
            method: 'post',
          },
          {
            id: 'models-1',
            type: 'models',
            title: 'Models',
            name: 'Models',
            children: [],
          },
          {
            id: 'tag-1',
            type: 'tag',
            title: 'Users',
            name: 'Users',
            isGroup: false,
          },
        ],
      }

      const result = getTagEntries(document)

      expect(result.size).toBe(1)
      expect(result.has('Users')).toBe(true)
    })

    it('handles deeply nested tag structures', () => {
      const document: TraversedDocument = {
        id: 'doc-1',
        type: 'document',
        name: 'Test API',
        title: 'Test API',
        children: [
          {
            id: 'group-1',
            type: 'tag',
            title: 'API',
            name: 'API',
            isGroup: true,
            children: [
              {
                id: 'group-2',
                type: 'tag',
                title: 'V1',
                name: 'V1',
                isGroup: true,
                children: [
                  {
                    id: 'group-3',
                    type: 'tag',
                    title: 'Users',
                    name: 'Users',
                    isGroup: true,
                    children: [
                      {
                        id: 'tag-1',
                        type: 'tag',
                        title: 'Admin Users',
                        name: 'Admin Users',
                        isGroup: false,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      }

      const result = getTagEntries(document)

      expect(result.size).toBe(4)
      expect(result.get('API')?.[0]?.parent).toMatchObject({ id: 'doc-1' })
      expect(result.get('V1')?.[0]?.parent).toMatchObject({ id: 'group-1' })
      expect(result.get('Users')?.[0]?.parent).toMatchObject({ id: 'group-2' })
      expect(result.get('Admin Users')?.[0]?.parent).toMatchObject({ id: 'group-3' })
    })

    it('collects tags from inside models containers', () => {
      // Tags nested under a models or other container should still be found
      const document: TraversedDocument = {
        id: 'doc-1',
        type: 'document',
        name: 'Test API',
        title: 'Test API',
        children: [
          {
            id: 'models-1',
            type: 'models',
            title: 'Models',
            name: 'Models',
            children: [
              {
                id: 'tag-1',
                type: 'tag',
                title: 'Schemas',
                name: 'Schemas',
                isGroup: false,
              },
            ],
          },
        ],
      }

      const result = getTagEntries(document)

      expect(result.size).toBe(1)
      expect(result.get('Schemas')?.[0]?.id).toBe('tag-1')
    })
  })
})
