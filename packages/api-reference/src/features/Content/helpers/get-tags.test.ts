import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { createCollection } from '@scalar/store'
import { describe, expect, it } from 'vitest'
import { getTags } from './get-tags'

// TODO: The store should support those custom properties
type ExtendedTagObject = OpenAPIV3_1.TagObject & {
  'x-internal'?: boolean
  'x-scalar-ignore'?: boolean
  'x-displayName'?: string
  operations?: any[]
}

const collection = createCollection({
  openapi: '3.1.0',
  info: {
    title: 'Hello World',
    version: '1.0.0',
  },
  tags: [
    {
      name: 'Hello',
      description: 'Hello World',
      operations: [],
    },
    {
      name: 'World',
      description: 'World Hello',
      operations: [],
    },
  ],
  paths: {
    '/hello': {
      get: {
        summary: 'Hello World',
        tags: ['Hello'],
      },
    },
    '/world': {
      post: {
        summary: 'World Hello',
        tags: ['World'],
      },
    },
  },
})

describe('getTags', () => {
  it('returns sorted tags when using a custom sorter', () => {
    const tagsSorter = (a: ExtendedTagObject, b: ExtendedTagObject) => a.name?.localeCompare(b.name ?? '') ?? 0
    const tags = getTags(collection.document, { sort: tagsSorter })

    expect(tags).toHaveLength(2)
    expect(tags?.[0].name).toBe('Hello')
    expect(tags?.[1].name).toBe('World')
  })

  it('returns empty array when no tags exist', () => {
    const emptyCollection = createCollection({
      openapi: '3.1.0',
      info: {
        title: 'Empty API',
        version: '1.0.0',
      },
    })

    const tags = getTags(emptyCollection.document)
    expect(tags).toHaveLength(0)
  })

  it('returns unsorted tags when no sort option is provided', () => {
    const tags = getTags(collection.document)
    expect(tags).toHaveLength(2)
    expect(tags).toEqual(collection.document.tags)
  })

  it('sorts tags alphabetically when sort is alpha', () => {
    const unsortedCollection = createCollection({
      openapi: '3.1.0',
      info: {
        title: 'Unsorted API',
        version: '1.0.0',
      },
      tags: [
        {
          name: 'Zebra',
          description: 'Zebra description',
          operations: [],
        },
        {
          name: 'Apple',
          description: 'Apple description',
          operations: [],
        },
      ],
    })

    const tags = getTags(unsortedCollection.document, { sort: 'alpha' })
    expect(tags).toHaveLength(2)
    expect(tags?.[0].name).toBe('Apple')
    expect(tags?.[1].name).toBe('Zebra')
  })

  it('handles tags with missing names', () => {
    const collectionWithMissingNames = createCollection({
      openapi: '3.1.0',
      info: {
        title: 'API with Missing Names',
        version: '1.0.0',
      },
      tags: [
        {
          name: 'Valid',
          description: 'Valid tag',
          operations: [],
        },
        {
          description: 'Missing name tag',
          operations: [],
        },
      ],
    })

    const tags = getTags(collectionWithMissingNames.document, { sort: 'alpha' })
    expect(tags).toHaveLength(2)
    expect(tags?.[0].name).toBe('Valid')
    expect(tags?.[1].name).toBeUndefined()
  })

  it('filters out internal tags', () => {
    const collection = createCollection({
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
      tags: [
        { name: 'Public', operations: [] },
        { name: 'Internal', 'x-internal': true, operations: [] },
      ],
    })

    const tags = getTags(collection.document, { filter: (tag) => tag['x-internal'] !== true })
    expect(tags).toHaveLength(1)
    expect(tags[0].name).toBe('Public')
  })

  it('filters out ignored tags', () => {
    const collection = createCollection({
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
      tags: [
        { name: 'Public', operations: [] },
        { name: 'Ignored', 'x-scalar-ignore': true, operations: [] },
      ],
    })

    const tags = getTags(collection.document, { filter: (tag) => tag['x-scalar-ignore'] !== true })
    expect(tags).toHaveLength(1)
    expect(tags[0].name).toBe('Public')
  })

  it('uses x-displayName for sorting when available', () => {
    const collection = createCollection({
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
      tags: [
        { name: 'b', 'x-displayName': 'Zebra', operations: [] },
        { name: 'a', 'x-displayName': 'Apple', operations: [] },
      ],
    })

    const tags = getTags(collection.document, { sort: 'alpha' })
    expect(tags).toHaveLength(2)
    expect(tags[0].name).toBe('a')
    expect(tags[1].name).toBe('b')
  })

  it('returns empty array when no tags are defined', () => {
    const collection = createCollection({
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/test': {
          get: {
            tags: ['Tag1'],
            operationId: 'test',
          },
        },
      },
    })

    const tags = getTags(collection.document)
    expect(tags).toHaveLength(1)
    expect(tags[0].name).toBe('Tag1')
  })

  it('returns default tag for operations without tags', () => {
    const collection = createCollection({
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/test': {
          get: {
            // No tags here
            operationId: 'test1',
          },
          post: {
            tags: ['Tag1'],
            operationId: 'test2',
          },
        },
      },
    })

    const tags = getTags(collection.document)
    expect(tags).toHaveLength(2)
    expect(tags[0].name).toBe('Tag1')
    expect(tags[1].name).toBe('default')
  })

  it('filters tags based on the filter function', () => {
    const collection = createCollection({
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
      tags: [
        { name: 'Public', description: 'Public tag', operations: [] },
        { name: 'Private', description: 'Private tag', operations: [] },
        { name: 'Admin', description: 'Admin tag', operations: [] },
      ],
    })

    // Test without filter - should get all tags
    const allTags = getTags(collection.document)
    expect(allTags).toHaveLength(3)

    // Test with filter to only include tags with 'Public' in the name
    const filteredTags = getTags(collection.document, {
      filter: (tag) => tag.name?.includes('Public') ?? false,
    })
    expect(filteredTags).toHaveLength(1)
    expect(filteredTags[0].name).toBe('Public')
  })
})
