import { describe, expect, it, vi } from 'vitest'
import { toRef } from 'vue'

import { parse } from '@/helpers/parse'
import { createEmptySpecification } from '@/libs/openapi'
import { dereference } from '@scalar/openapi-parser'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { useSearchIndex } from './useSearchIndex'

// Mock the useConfig hook
vi.mock('@/hooks/useConfig', () => ({
  useConfig: vi.fn().mockReturnValue({ value: {} }),
}))

vi.mock('@/hooks/useNavState', () => ({
  useNavState: vi.fn().mockReturnValue({
    getTagId: vi.fn(),
    getOperationId: vi.fn(),
  }),
}))

describe('useSearchIndex', () => {
  it('should create the search index from an OpenAPI document', async () => {
    const { schema: dereferencedDocument } = await dereference(
      createEmptySpecification({
        paths: {
          '/foobar': {
            get: {
              summary: 'Get request',
              description: 'Get request description',
            },
          },
        },
      }),
    )

    const specification = await parse(dereferencedDocument as OpenAPIV3_1.Document)

    const { searchText, fuseSearch, searchResultsWithPlaceholderResults } = useSearchIndex({
      specification: toRef(specification),
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
