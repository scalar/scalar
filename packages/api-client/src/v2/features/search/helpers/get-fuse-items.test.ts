import type { TraversedEntry, WithParent } from '@scalar/workspace-store/schemas/navigation'
import { describe, expect, it } from 'vitest'

import type { FuseData } from '@/v2/features/search/types'

import { getFuseItems } from './get-fuse-items'

describe('get-fuse-items', () => {
  describe('getFuseItems', () => {
    it('returns an empty array when no results are provided', () => {
      const result = getFuseItems([])
      expect(result).toEqual([])
    })

    it('builds a single parent-child hierarchy for one result', () => {
      const document: TraversedEntry = {
        id: 'doc-1',
        type: 'document',
        title: 'API Documentation',
      }

      const tag: WithParent<TraversedEntry> = {
        id: 'tag-1',
        type: 'tag',
        title: 'Authentication',
        parent: document,
      }

      const operation: TraversedEntry = {
        id: 'op-1',
        type: 'operation',
        title: 'Login',
        path: '/auth/login',
        method: 'post',
      }

      const fuseResult: FuseData = {
        id: 'op-1',
        type: 'operation',
        title: 'Login',
        description: 'Login endpoint',
        documentName: 'API Documentation',
        entry: operation,
        parent: tag,
        method: 'post',
        path: '/auth/login',
      }

      const results = getFuseItems([{ item: fuseResult, refIndex: 0, score: 0.5, matches: [] }])

      expect(results).toHaveLength(1)
      expect(results[0].id).toBe('doc-1')
      expect(results[0].children).toHaveLength(1)
      expect(results[0].children?.[0].id).toBe('tag-1')
      expect(results[0].children?.[0].children).toHaveLength(1)
      expect(results[0].children?.[0].children?.[0].id).toBe('op-1')
    })

    it('groups multiple results under the same parent', () => {
      const document: TraversedEntry = {
        id: 'doc-1',
        type: 'document',
        title: 'API Documentation',
      }

      const tag: WithParent<TraversedEntry> = {
        id: 'tag-1',
        type: 'tag',
        title: 'Authentication',
        parent: document,
      }

      const operation1: TraversedEntry = {
        id: 'op-1',
        type: 'operation',
        title: 'Login',
        path: '/auth/login',
        method: 'post',
      }

      const operation2: TraversedEntry = {
        id: 'op-2',
        type: 'operation',
        title: 'Logout',
        path: '/auth/logout',
        method: 'post',
      }

      const fuseResult1: FuseData = {
        id: 'op-1',
        type: 'operation',
        title: 'Login',
        description: 'Login endpoint',
        documentName: 'API Documentation',
        entry: operation1,
        parent: tag,
        method: 'post',
        path: '/auth/login',
      }

      const fuseResult2: FuseData = {
        id: 'op-2',
        type: 'operation',
        title: 'Logout',
        description: 'Logout endpoint',
        documentName: 'API Documentation',
        entry: operation2,
        parent: tag,
        method: 'post',
        path: '/auth/logout',
      }

      const results = getFuseItems([
        { item: fuseResult1, refIndex: 0, score: 0.5, matches: [] },
        { item: fuseResult2, refIndex: 1, score: 0.6, matches: [] },
      ])

      // Should have one document at root
      expect(results).toHaveLength(1)
      expect(results[0].id).toBe('doc-1')

      // Document should have one tag child
      expect(results[0].children).toHaveLength(1)
      expect(results[0].children?.[0].id).toBe('tag-1')

      // Tag should have both operations as children
      expect(results[0].children?.[0].children).toHaveLength(2)
      expect(results[0].children?.[0].children?.[0].id).toBe('op-1')
      expect(results[0].children?.[0].children?.[1].id).toBe('op-2')
    })

    it('handles multiple documents with separate hierarchies', () => {
      const document1: TraversedEntry = {
        id: 'doc-1',
        type: 'document',
        title: 'API v1',
      }

      const document2: TraversedEntry = {
        id: 'doc-2',
        type: 'document',
        title: 'API v2',
      }

      const tag1: WithParent<TraversedEntry> = {
        id: 'tag-1',
        type: 'tag',
        title: 'Users',
        parent: document1,
      }

      const tag2: WithParent<TraversedEntry> = {
        id: 'tag-2',
        type: 'tag',
        title: 'Users',
        parent: document2,
      }

      const operation1: TraversedEntry = {
        id: 'op-1',
        type: 'operation',
        title: 'Get User',
        path: '/users/:id',
        method: 'get',
      }

      const operation2: TraversedEntry = {
        id: 'op-2',
        type: 'operation',
        title: 'Get User',
        path: '/users/:id',
        method: 'get',
      }

      const fuseResult1: FuseData = {
        id: 'op-1',
        type: 'operation',
        title: 'Get User',
        description: '',
        documentName: 'API v1',
        entry: operation1,
        parent: tag1,
        method: 'get',
        path: '/users/:id',
      }

      const fuseResult2: FuseData = {
        id: 'op-2',
        type: 'operation',
        title: 'Get User',
        description: '',
        documentName: 'API v2',
        entry: operation2,
        parent: tag2,
        method: 'get',
        path: '/users/:id',
      }

      const results = getFuseItems([
        { item: fuseResult1, refIndex: 0, score: 0.5, matches: [] },
        { item: fuseResult2, refIndex: 1, score: 0.6, matches: [] },
      ])

      // Should have two documents at root
      expect(results).toHaveLength(2)
      expect(results[0].id).toBe('doc-1')
      expect(results[1].id).toBe('doc-2')

      // Each document should have its own tag
      expect(results[0].children).toHaveLength(1)
      expect(results[0].children?.[0].id).toBe('tag-1')
      expect(results[1].children).toHaveLength(1)
      expect(results[1].children?.[0].id).toBe('tag-2')

      // Each tag should have its own operation
      expect(results[0].children?.[0].children).toHaveLength(1)
      expect(results[0].children?.[0].children?.[0].id).toBe('op-1')
      expect(results[1].children?.[0].children).toHaveLength(1)
      expect(results[1].children?.[0].children?.[0].id).toBe('op-2')
    })

    it('filters out non-API client types', () => {
      const document: TraversedEntry = {
        id: 'doc-1',
        type: 'document',
        title: 'API Documentation',
      }

      const heading: TraversedEntry = {
        id: 'heading-1',
        type: 'text',
        title: 'Introduction',
      }

      const fuseResult: FuseData = {
        id: 'heading-1',
        type: 'heading',
        title: 'Introduction',
        description: 'Heading',
        documentName: 'API Documentation',
        entry: heading,
        parent: document,
      }

      const results = getFuseItems([{ item: fuseResult, refIndex: 0, score: 0.5, matches: [] }])

      // Headings (type: 'text') should be filtered out
      expect(results).toHaveLength(0)
    })

    it('handles results with no parent', () => {
      const document: TraversedEntry = {
        id: 'doc-1',
        type: 'document',
        title: 'API Documentation',
      }

      const fuseResult: FuseData = {
        id: 'doc-1',
        type: 'tag',
        title: 'API Documentation',
        description: '',
        documentName: 'API Documentation',
        entry: document,
        parent: undefined,
      }

      const results = getFuseItems([{ item: fuseResult, refIndex: 0, score: 0.5, matches: [] }])

      expect(results).toHaveLength(1)
      expect(results[0].id).toBe('doc-1')
      expect(results[0].children).toEqual([])
    })
  })
})
