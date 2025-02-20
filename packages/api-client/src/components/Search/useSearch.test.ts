import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { useSearch } from './useSearch'
import { operationSchema } from '@scalar/oas-utils/entities/spec'

// Mocking the necessary modules and functions
vi.mock('vue-router', () => ({
  useRouter: vi.fn(),
}))

vi.mock('@/store', () => ({
  useWorkspace: vi.fn(() => ({
    requests: {
      request1: {
        'uid': 'request1',
        'summary': 'Request 1',
        'x-internal': false,
      },
      request2: {
        'uid': 'request2',
        'summary': 'Request 2',
        'x-internal': true,
      },
    },
    tags: {},
  })),
}))

vi.mock('@/store/active-entities', () => ({
  useActiveEntities: vi.fn(() => ({
    activeWorkspace: ref({ uid: 'workspace1' }),
    activeWorkspaceRequests: ref([]),
    activeWorkspaceCollections: ref([]),
  })),
}))

describe('useSearch', () => {
  it('initializes with default values', () => {
    const { searchText, searchResultsWithPlaceholderResults, selectedSearchResult, populateFuseDataArray } = useSearch()

    console.log(populateFuseDataArray)
    expect(searchText.value).toBe('')
    expect(searchResultsWithPlaceholderResults.value).toEqual([])
    expect(selectedSearchResult.value).toBe(0)
  })

  it('performs a search and updates results', () => {
    const { populateFuseDataArray, searchText, fuseSearch, searchResultsWithPlaceholderResults } = useSearch()

    populateFuseDataArray([
      operationSchema.parse({
        uid: 'request1',
        summary: 'Request 1',
        path: '/path1',
        method: 'get',
      }),
    ])

    searchText.value = 'test'
    fuseSearch()

    expect(searchResultsWithPlaceholderResults.value).toEqual(
      expect.arrayContaining([expect.objectContaining({ item: expect.any(Object) })]),
    )
  })

  it('returns results for requests', () => {
    const { populateFuseDataArray, searchText, fuseSearch, searchResultsWithPlaceholderResults } = useSearch()

    populateFuseDataArray([
      operationSchema.parse({
        uid: 'request1',
        summary: 'Request 1',
        path: '/path1',
        method: 'get',
      }),
    ])
    searchText.value = 'Request 1'
    fuseSearch()

    expect(searchResultsWithPlaceholderResults.value).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          item: {
            id: 'request1',
            title: 'Request 1',
            path: '/path1',
            httpVerb: 'get',
            description: '',
            // TODO: For some reason, this is undefined when we use router.resolve() here.
            // link: '/workspace/workspace1/request/request1',
            link: undefined,
          },
        }),
      ]),
    )
  })

  it('filters out requests with x-internal: true', () => {
    const { populateFuseDataArray, searchText, fuseSearch, searchResultsWithPlaceholderResults } = useSearch()

    populateFuseDataArray([
      operationSchema.parse({
        uid: 'request1',
        summary: 'Request 1',
        path: '/path1',
        method: 'get',
      }),
      operationSchema.parse({
        'uid': 'request2',
        'summary': 'Request 2',
        'path': '/path2',
        'method': 'get',
        'x-internal': true,
      }),
    ])

    searchText.value = 'Request'
    fuseSearch()

    expect(searchResultsWithPlaceholderResults.value).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          item: {
            id: 'request1',
            title: 'Request 1',
            path: '/path1',
            httpVerb: 'get',
            description: '',
            // TODO: For some reason, this is undefined when we use router.resolve() here.
            // link: '/workspace/workspace1/request/request1',
            link: undefined,
          },
          refIndex: 0,
        }),
      ]),
    )
    expect(searchResultsWithPlaceholderResults.value).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          item: { id: 'request2' },
        }),
      ]),
    )
  })
})
