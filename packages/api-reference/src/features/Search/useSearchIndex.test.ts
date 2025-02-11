import { createWorkspaceStore } from '@scalar/api-client/store'
import type { OpenAPI } from '@scalar/openapi-types'
import { describe, expect, it } from 'vitest'

import { useSearchIndex } from './useSearchIndex'

describe('useSearchIndex', () => {
  it('should create the search index from an OpenAPI document', async () => {
    const store = await createStore({
      info: {
        title: 'Test API',
        description: 'Test API description',
      },
      tags: [
        {
          name: 'test',
          description: 'test description',
        },
      ],
      paths: {
        '/foobar': {
          get: {
            summary: 'Get request',
            description: 'Get request description',
          },
        },
      },
    })

    const { searchText, fuseSearch, searchResultsWithPlaceholderResults } =
      useSearchIndex({
        store,
      })

    searchText.value = 'request'

    fuseSearch()

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(searchResultsWithPlaceholderResults.value).toMatchObject([
      {
        item: {
          operation: {
            name: 'Get request',
          },
        },
      },
    ])
  })
})

/**
 * Utility to quickly create a store with a given definition
 */
async function createStore(definition: OpenAPI.Document) {
  const store = createWorkspaceStore({
    themeId: 'default',
    useLocalStorage: false,
    hideClientButton: false,
    integration: 'html',
  })

  await store.importSpecFile(definition, 'default', {
    shouldLoad: false,
    setCollectionSecurity: true,
  })

  return store
}
