import { describe, expect, it, vi } from 'vitest'
import { toRef } from 'vue'

import type { TraversedEntry } from '@/features/traverse-schema'
import { parse } from '@/helpers/parse'
import { createEmptySpecification } from '@/libs/openapi'
import { dereference } from '@scalar/openapi-parser'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { useSearchIndex } from './useSearchIndex'

vi.mock('@/hooks/useNavState', () => ({
  useNavState: vi.fn().mockReturnValue({
    getTagId: vi.fn(),
    getOperationId: vi.fn(),
    getModelId: vi.fn((model) => `model/${model?.name || 'models'}`),
    getHeadingId: vi.fn(),
  }),
}))

describe('useSearchIndex', () => {
  it('creates search index from OpenAPI document and finds matching operations', async () => {
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

    const items: TraversedEntry[] = [
      {
        id: 'tag/default',
        isGroup: true,
        title: 'Default',
        tag: {
          name: 'default',
          description: 'Default tag',
        },
        children: [
          {
            id: 'tag/default/foobar',
            method: 'get',
            path: '/foobar',
            title: 'Get request',
            operation: {
              summary: 'Get request',
              description: 'Get request description',
            },
          },
        ],
      },
    ]

    const specification = await parse(dereferencedDocument as OpenAPIV3_1.Document, items)

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
            description: 'Get request description',
            summary: 'Get request',
          },
        },
      },
    ])
  })

  describe('hideModels', () => {
    it('includes models in search index when hideModels is false', async () => {
      const { schema: dereferencedDocument } = await dereference(
        createEmptySpecification({
          components: {
            schemas: {
              User: {
                type: 'object',
                title: 'User Model',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                },
              },
              Product: {
                type: 'object',
                title: 'Product Model',
                properties: {
                  id: { type: 'string' },
                  price: { type: 'number' },
                },
              },
            },
          },
        }),
      )

      const items: TraversedEntry[] = []

      const specification = await parse(dereferencedDocument as OpenAPIV3_1.Document, items)

      const { searchResultsWithPlaceholderResults } = useSearchIndex({
        specification: toRef(specification),
        hideModels: false,
      })

      // Wait for the watcher to process the specification
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Should include models in the search results
      const modelResults = searchResultsWithPlaceholderResults.value.filter((result) => result.item.type === 'model')

      expect(modelResults).toHaveLength(2)
      expect(modelResults).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            item: expect.objectContaining({
              type: 'model',
              title: 'User Model',
              description: 'Model',
              tag: 'User',
            }),
          }),
          expect.objectContaining({
            item: expect.objectContaining({
              type: 'model',
              title: 'Product Model',
              description: 'Model',
              tag: 'Product',
            }),
          }),
        ]),
      )
    })

    it('excludes models from search index when hideModels is true', async () => {
      const { schema: dereferencedDocument } = await dereference(
        createEmptySpecification({
          components: {
            schemas: {
              User: {
                type: 'object',
                title: 'User Model',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                },
              },
              Product: {
                type: 'object',
                title: 'Product Model',
                properties: {
                  id: { type: 'string' },
                  price: { type: 'number' },
                },
              },
            },
          },
        }),
      )

      const items: TraversedEntry[] = []

      const specification = await parse(dereferencedDocument as OpenAPIV3_1.Document, items)

      const { searchResultsWithPlaceholderResults } = useSearchIndex({
        specification: toRef(specification),
        hideModels: true,
      })

      // Wait for the watcher to process the specification
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Should not include any models in the search results
      const modelResults = searchResultsWithPlaceholderResults.value.filter((result) => result.item.type === 'model')

      expect(modelResults).toHaveLength(0)
    })

    it('includes models by default', async () => {
      const { schema: dereferencedDocument } = await dereference(
        createEmptySpecification({
          components: {
            schemas: {
              User: {
                type: 'object',
                title: 'User Model',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                },
              },
            },
          },
        }),
      )

      const items: TraversedEntry[] = []

      const specification = await parse(dereferencedDocument as OpenAPIV3_1.Document, items)

      const { searchResultsWithPlaceholderResults } = useSearchIndex({
        specification: toRef(specification),
        // hideModels not specified, should default to false
      })

      // Wait for the watcher to process the specification
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Should include models in the search results (default behavior)
      const modelResults = searchResultsWithPlaceholderResults.value.filter((result) => result.item.type === 'model')

      expect(modelResults).toHaveLength(1)
      expect(modelResults[0]).toEqual(
        expect.objectContaining({
          item: expect.objectContaining({
            type: 'model',
            title: 'User Model',
            description: 'Model',
            tag: 'User',
          }),
        }),
      )
    })
  })
})
