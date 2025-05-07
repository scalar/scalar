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

// TODO: The store should support those custom properties
type TagGroup = {
  name: string
  tags: string[]
}

// TODO: The store should support those custom properties
type ExtendedDocument = OpenAPIV3_1.Document & {
  'x-tagGroups'?: TagGroup[]
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
    const tags = getTags(collection.document as ExtendedDocument, { sort: tagsSorter })

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

    const tags = getTags(emptyCollection.document as ExtendedDocument)
    expect(tags).toHaveLength(0)
  })

  it('returns unsorted tags when no sort option is provided', () => {
    const tags = getTags(collection.document as ExtendedDocument)
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

    const tags = getTags(unsortedCollection.document as ExtendedDocument, { sort: 'alpha' })
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

    const tags = getTags(collectionWithMissingNames.document as ExtendedDocument, { sort: 'alpha' })
    expect(tags).toHaveLength(2)
    expect(tags?.[0].name).toBe('Valid')
    expect(tags?.[1].name).toBeUndefined()
  })

  it('filters out internal tags by default', () => {
    const collection = createCollection({
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
      tags: [
        { name: 'Public', operations: [] },
        { name: 'Internal', 'x-internal': true, operations: [] },
      ],
    })

    const tags = getTags(collection.document as ExtendedDocument)
    expect(tags).toHaveLength(1)
    expect(tags[0].name).toBe('Public')
  })

  it('filters out ignored tags by default', () => {
    const collection = createCollection({
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
      tags: [
        { name: 'Public', operations: [] },
        { name: 'Ignored', 'x-scalar-ignore': true, operations: [] },
      ],
    })

    const tags = getTags(collection.document as ExtendedDocument)
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

    const tags = getTags(collection.document as ExtendedDocument, { sort: 'alpha' })
    expect(tags).toHaveLength(2)
    expect(tags[0].name).toBe('a')
    expect(tags[1].name).toBe('b')
  })

  // TODO: I don't really know how we want to support tag groups.
  // I'd expect getTags to return a flat array, but we also need the grouping somehow?
  it('supports tag groups', () => {
    const collection = createCollection({
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
      tags: [
        { name: 'Tag1', operations: [] },
        { name: 'Tag2', operations: [] },
        { name: 'Tag3', operations: [] },
      ],
      'x-tagGroups': [{ name: 'Group1', tags: ['Tag1', 'Tag2'] }],
    })

    const tags = getTags(collection.document as ExtendedDocument)
    expect(tags).toHaveLength(2)
    expect(tags[0].name).toBe('Tag1')
    expect(tags[1].name).toBe('Tag2')
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

    const tags = getTags(collection.document as ExtendedDocument)
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

    const tags = getTags(collection.document as ExtendedDocument)
    expect(tags).toHaveLength(2)
    expect(tags[0].name).toBe('Tag1')
    expect(tags[1].name).toBe('default')
  })
})
