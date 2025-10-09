import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import { describe, expect, it } from 'vitest'
import { computed } from 'vue'

import { useSearchIndex } from './useSearchIndex'

// Mock AsyncAPI document
const mockAsyncApiDocument = {
  asyncapi: '3.0.0' as const,
  info: {
    title: 'Test AsyncAPI',
    version: '1.0.0',
  },
  channels: {
    'user/signedup': {
      title: 'User signed up',
      operations: {
        publish: 'publishUserSignedUp',
      },
    },
  },
  operations: {
    publishUserSignedUp: {
      action: 'publish' as const,
      channel: 'user/signedup',
      title: 'Publish user signed up event',
    },
  },
  components: {
    schemas: {},
  },
}

// Mock OpenAPI document
const mockOpenApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'Test API',
    version: '1.0.0',
  },
  paths: {
    '/test': {
      get: {
        operationId: 'test-operation',
      },
    },
  },
}

describe('useSearchIndex', () => {
  it('initializes with empty search state and watches for items changes', () => {
    const mockEntries: TraversedEntry[] = [
      {
        type: 'operation',
        ref: 'testOperation',
        id: 'test-operation',
        title: 'Test Operation',
        method: 'get',
        path: '/test',
      },
    ]

    const mockItems = computed(() => ({
      entries: mockEntries,
      entities: new Map(),
    }))

    const { query, selectedIndex, searchResultsWithPlaceholderResults, resetSearch } = useSearchIndex(
      mockItems,
      mockOpenApiDocument,
    )

    // Initial state should be empty
    expect(query.value).toBe('')
    expect(selectedIndex.value).toBeUndefined()
    expect(searchResultsWithPlaceholderResults.value).toMatchObject([
      {
        item: {
          href: '#test-operation',
          id: 'test-operation',
          method: 'get',
          path: '/test',
          title: 'Test Operation',
          type: 'operation',
        },
      },
    ])

    // Test resetSearch function
    resetSearch()
    expect(query.value).toBe('')
    expect(selectedIndex.value).toBeUndefined()
  })

  it('handles AsyncAPI documents gracefully without generating search index', () => {
    const mockEntries: TraversedEntry[] = [
      {
        type: 'asyncapi-operation',
        ref: 'publishUserSignedUp',
        id: 'operation/publish-user-signed-up-event',
        title: 'Publish user signed up event',
        action: 'publish',
        channel: 'user/signedup',
      },
    ]

    const mockItems = computed(() => ({
      entries: mockEntries,
      entities: new Map(),
    }))

    const { query, selectedIndex, searchResultsWithPlaceholderResults } = useSearchIndex(
      mockItems,
      mockAsyncApiDocument,
    )

    // Search index should be empty for AsyncAPI documents
    expect(query.value).toBe('')
    expect(selectedIndex.value).toBeUndefined()
    expect(searchResultsWithPlaceholderResults.value).toEqual([])
  })

  it('handles undefined document gracefully', () => {
    const mockEntries: TraversedEntry[] = [
      {
        type: 'operation',
        ref: 'testOperation',
        id: 'test-operation',
        title: 'Test Operation',
        method: 'get',
        path: '/test',
      },
    ]

    const mockItems = computed(() => ({
      entries: mockEntries,
      entities: new Map(),
    }))

    const { query, selectedIndex, searchResultsWithPlaceholderResults } = useSearchIndex(mockItems, undefined)

    // Should handle undefined document gracefully
    expect(query.value).toBe('')
    expect(selectedIndex.value).toBeUndefined()
    expect(searchResultsWithPlaceholderResults.value).toEqual([])
  })

  it('generates search index only for OpenAPI documents', () => {
    const mockEntries: TraversedEntry[] = [
      {
        type: 'operation',
        ref: 'testOperation',
        id: 'test-operation',
        title: 'Test Operation',
        method: 'get',
        path: '/test',
      },
    ]

    const mockItems = computed(() => ({
      entries: mockEntries,
      entities: new Map(),
    }))

    // Test with OpenAPI document - should generate search index
    const openApiResult = useSearchIndex(mockItems, mockOpenApiDocument)
    expect(openApiResult.searchResultsWithPlaceholderResults.value.length).toBeGreaterThan(0)

    // Test with AsyncAPI document - should not generate search index
    const asyncApiResult = useSearchIndex(mockItems, mockAsyncApiDocument)
    expect(asyncApiResult.searchResultsWithPlaceholderResults.value).toEqual([])
  })
})
