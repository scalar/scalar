import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { assert, describe, expect, it } from 'vitest'

import type { TagsMap } from '@/navigation/types'
import type { TraversedEntry, TraversedTag } from '@/schemas/navigation'
import type { OpenApiDocument, TagObject } from '@/schemas/v3.1/strict/openapi-document'

import { traverseTags } from './traverse-tags'

type TagGroup = { name: string; tags: string[] }

describe('traverseTags', () => {
  // Helper function to create a mock OpenAPI document
  const createMockDocument = (tagGroups?: TagGroup[]): OpenApiDocument => ({
    openapi: '3.1.0',
    info: { title: 'Test API', version: '1.0.0' },
    paths: {},
    ...(tagGroups && { 'x-tagGroups': tagGroups }),
    'x-scalar-original-document-hash': '',
  })

  // Helper function to create a mock tag
  const createMockTag = (name: string, displayName?: string): TagObject => ({
    name,
    ...(displayName && { 'x-displayName': displayName }),
  })

  // Helper function to create a mock sidebar entry
  const createMockEntry = (title: string, method?: HttpMethod): TraversedEntry => ({
    id: `entry-${title}`,
    title,
    method: method ?? 'get',
    type: 'operation',
    path: '',
    ref: '',
  })

  it('should handle empty tags map', () => {
    const document = createMockDocument()
    const tagsMap: TagsMap = new Map()

    const result = traverseTags({
      document,
      tagsMap,
      documentId: 'doc-1',
      options: {
        generateId: (props) => {
          if (props.type === 'tag') {
            return props.tag.name ?? ''
          }

          return 'unknown-id'
        },
        tagsSorter: 'alpha' as const,
        operationsSorter: 'alpha' as const,
      },
    })
    expect(result).toEqual([])
  })

  it('should return empty tags', () => {
    const document = createMockDocument()
    const tagsMap: TagsMap = new Map([
      [
        'empty-tag',
        {
          id: 'tag/empty-tag',
          parentId: 'doc-1',
          tag: createMockTag('empty-tag'),
          entries: [],
        },
      ],
      [
        'tag-with-entries',
        {
          id: 'tag/tag-with-entries',
          parentId: 'doc-1',
          tag: createMockTag('tag-with-entries'),
          entries: [createMockEntry('Test Operation')],
        },
      ],
    ])

    const result = traverseTags({
      document,
      tagsMap,
      documentId: 'doc-1',
      options: {
        generateId: (props) => {
          if (props.type === 'tag') {
            return props.tag.name ?? ''
          }

          return 'unknown-id'
        },
        tagsSorter: 'alpha' as const,
        operationsSorter: 'alpha' as const,
      },
    })

    expect(result).toHaveLength(2)
    assert(result[0]?.type === 'tag')
    expect(result[0]?.name).toBe('empty-tag')
    expect(result[0]?.children).toEqual([])
    assert(result[1]?.type === 'tag')
    expect(result[1]?.name).toBe('tag-with-entries')
    expect(result[1]?.children).toHaveLength(1)
  })

  it('should handle single default tag', () => {
    const document = createMockDocument()
    const tagsMap: TagsMap = new Map([
      [
        'default',
        {
          id: 'default',
          parentId: 'doc-1',
          tag: createMockTag('default'),
          entries: [createMockEntry('Test Operation')],
        },
      ],
    ])

    const result = traverseTags({
      document,
      tagsMap,
      documentId: 'doc-1',
      options: {
        tagsSorter: 'alpha' as const,
        operationsSorter: 'alpha' as const,
        generateId: (props) => {
          if (props.type === 'tag') {
            return props.tag.name ?? ''
          }

          return 'unknown-id'
        },
      },
    })
    // Default tag is now treated like any other tag (not flattened)
    expect(result).toEqual([
      {
        type: 'tag',
        id: 'default',
        title: 'default',
        name: 'default',
        isWebhooks: false,
        description: undefined,
        children: [createMockEntry('Test Operation')],
        isGroup: false,
        xKeys: {
          'x-scalar-order': ['entry-Test Operation'],
        },
      },
    ])
  })

  it('should handle a mix of tags and default tag', () => {
    const document = createMockDocument()
    const tagsMap: TagsMap = new Map([
      [
        'default',
        {
          id: 'tag/default',
          parentId: 'doc-1',
          tag: createMockTag('default'),
          entries: [createMockEntry('Test Operation')],
        },
      ],
      [
        'tag1',
        { id: 'tag/tag1', parentId: 'doc-1', tag: createMockTag('tag1'), entries: [createMockEntry('Test Operation')] },
      ],
    ])

    const result = traverseTags({
      document,
      tagsMap,
      documentId: 'doc-1',
      options: {
        tagsSorter: 'alpha' as const,
        operationsSorter: 'alpha' as const,
        generateId: (props) => {
          if (props.type === 'tag') {
            return props.tag.name ?? ''
          }

          return 'unknown-id'
        },
      },
    })
    expect(result).toEqual([
      {
        type: 'tag',
        id: 'default',
        title: 'default',
        name: 'default',
        isWebhooks: false,
        description: undefined,
        children: [createMockEntry('Test Operation')],
        isGroup: false,
        xKeys: {
          'x-scalar-order': ['entry-Test Operation'],
        },
      },
      {
        type: 'tag',
        id: 'tag1',
        title: 'tag1',
        name: 'tag1',
        isWebhooks: false,
        description: undefined,
        children: [createMockEntry('Test Operation')],
        isGroup: false,
        xKeys: {
          'x-scalar-order': ['entry-Test Operation'],
        },
      },
    ])
  })

  it('should sort tags alphabetically', () => {
    const document = createMockDocument()
    const tagsMap: TagsMap = new Map([
      [
        'zebra',
        {
          id: 'tag/zebra',
          parentId: 'doc-1',
          tag: createMockTag('zebra'),
          entries: [createMockEntry('Zebra Operation')],
        },
      ],
      [
        'alpha',
        {
          id: 'tag/alpha',
          parentId: 'doc-1',
          tag: createMockTag('alpha'),
          entries: [createMockEntry('Alpha Operation')],
        },
      ],
    ])

    const result = traverseTags({
      document,
      tagsMap,
      options: {
        tagsSorter: 'alpha' as const,
        operationsSorter: 'alpha' as const,
        generateId: (props) => {
          if (props.type === 'tag') {
            return props.tag.name ?? ''
          }

          return 'unknown-id'
        },
      },
      documentId: 'doc-1',
    })
    expect(result[0]?.title).toBe('alpha')
    expect(result[1]?.title).toBe('zebra')
  })

  it('should handle tag groups', () => {
    const tagGroups: TagGroup[] = [
      {
        name: 'Group A',
        tags: ['tag1', 'tag2'],
      },
    ]
    const document = createMockDocument(tagGroups)
    const tagsMap: TagsMap = new Map([
      [
        'tag1',
        { id: 'tag/tag1', parentId: 'doc-1', tag: createMockTag('tag1'), entries: [createMockEntry('Operation 1')] },
      ],
      [
        'tag2',
        { id: 'tag/tag2', parentId: 'doc-1', tag: createMockTag('tag2'), entries: [createMockEntry('Operation 2')] },
      ],
    ])

    const result = traverseTags({
      document,
      tagsMap,
      options: {
        tagsSorter: 'alpha' as const,
        operationsSorter: 'alpha' as const,
        generateId: (props) => {
          if (props.type === 'tag') {
            return props.tag.name ?? ''
          }

          return 'unknown-id'
        },
      },
      documentId: 'doc-1',
    })
    expect(result).toHaveLength(1)
    expect(result[0]?.title).toBe('Group A')
    expect((result[0] as TraversedTag).children).toHaveLength(2)
  })

  it('should sort operations by HTTP method', () => {
    const document = createMockDocument()
    const tagsMap: TagsMap = new Map([
      [
        'default',
        {
          id: 'tag/default',
          parentId: 'doc-1',
          tag: createMockTag('default'),
          entries: [createMockEntry('POST Operation', 'post'), createMockEntry('GET Operation', 'get')],
        },
      ],
    ])

    const result = traverseTags({
      document,
      tagsMap,
      options: {
        tagsSorter: 'alpha',
        operationsSorter: 'method',
        generateId: (props) => {
          if (props.type === 'tag') {
            return props.tag.name ?? ''
          }

          return 'unknown-id'
        },
      },
      documentId: 'doc-1',
    })
    expect(result[0]?.type).toBe('tag')
    expect(result[0]?.title).toBe('default')
    assert(result[0]?.type === 'tag')
    expect(result[0]?.children).toHaveLength(2)
    assert(result[0]?.children?.[0]?.type === 'operation')
    assert(result[0]?.children?.[1]?.type === 'operation')
    expect(result[0]?.children?.[0].method).toBe('get')
    expect(result[0]?.children?.[1].method).toBe('post')
  })

  it('should handle custom operationSorter using [deprecated] httpVerb', () => {
    const document = createMockDocument()
    const tagsMap: TagsMap = new Map([
      [
        'default',
        {
          id: 'tag/default',
          parentId: 'doc-1',
          tag: createMockTag('default'),
          entries: [createMockEntry('POST Operation', 'post'), createMockEntry('GET Operation', 'get')],
        },
      ],
    ])
    const result = traverseTags({
      document,
      tagsMap,
      options: {
        tagsSorter: 'alpha' as const,
        operationsSorter: (a: { httpVerb: string }, b: { httpVerb: string }) =>
          (a.httpVerb || '').localeCompare(b.httpVerb || ''),

        generateId: (props) => {
          if (props.type === 'tag') {
            return props.tag.name ?? ''
          }

          return 'unknown-id'
        },
      },
      documentId: 'doc-1',
    })
    expect(result[0]?.type).toBe('tag')
    expect(result[0]?.title).toBe('default')
    assert(result[0]?.type === 'tag')
    expect(result[0]?.children).toHaveLength(2)
    assert(result[0]?.children?.[0]?.type === 'operation')
    assert(result[0]?.children?.[1]?.type === 'operation')
    expect(result[0]?.children?.[0].method).toBe('get')
    expect(result[0]?.children?.[1].method).toBe('post')
  })

  it('should handle custom tag sorter', () => {
    const document = createMockDocument()
    const tagsMap: TagsMap = new Map([
      [
        'tag1',
        {
          id: 'tag/tag1',
          parentId: 'doc-1',
          tag: createMockTag('tag1', 'Zebra'),
          entries: [createMockEntry('Operation 1')],
        },
      ],
      [
        'tag2',
        {
          id: 'tag/tag2',
          parentId: 'doc-1',
          tag: createMockTag('tag2', 'Alpha'),
          entries: [createMockEntry('Operation 2')],
        },
      ],
    ])

    const result = traverseTags({
      document,
      tagsMap,
      options: {
        tagsSorter: (a: TagObject, b: TagObject) => (a['x-displayName'] ?? '').localeCompare(b['x-displayName'] || ''),
        operationsSorter: 'alpha' as const,
        generateId: (props) => {
          if (props.type === 'tag') {
            return props.tag.name ?? ''
          }

          return 'unknown-id'
        },
      },
      documentId: 'doc-1',
    })
    expect(result[0]?.title).toBe('Alpha')
    expect(result[1]?.title).toBe('Zebra')
  })

  it('should handle custom operations sorter', () => {
    const document = createMockDocument()
    const tagsMap: TagsMap = new Map([
      [
        'default',
        {
          id: 'tag/default',
          parentId: 'doc-1',
          tag: createMockTag('default'),
          entries: [createMockEntry('Operation B', 'post'), createMockEntry('Operation A', 'get')],
        },
      ],
    ])

    const result = traverseTags({
      document,
      tagsMap,
      options: {
        tagsSorter: 'alpha' as const,
        operationsSorter: (a: { method: string }, b: { method: string }) =>
          (a.method || '').localeCompare(b.method || ''),
        generateId: (props) => {
          if (props.type === 'tag') {
            return props.tag.name ?? ''
          }

          return 'unknown-id'
        },
      },
      documentId: 'doc-1',
    })

    expect(result).toHaveLength(1)
    expect(result[0]?.title).toBe('default')
    assert(result[0]?.type === 'tag')
    expect(result[0].children).toHaveLength(2)
    expect(result[0].children?.[0]?.title).toBe('Operation A')
    expect(result[0].children?.[1]?.title).toBe('Operation B')
  })

  it('should handle internal tags', () => {
    const document = createMockDocument()
    const tagsMap: TagsMap = new Map([
      [
        'internal',
        {
          id: 'tag/internal',
          parentId: 'doc-1',
          tag: { ...createMockTag('internal'), 'x-internal': true },
          entries: [createMockEntry('Internal Operation')],
        },
      ],
      [
        'public',
        {
          id: 'tag/public',
          parentId: 'doc-1',
          tag: createMockTag('public'),
          entries: [createMockEntry('Public Operation')],
        },
      ],
    ])

    const result = traverseTags({
      document,
      tagsMap,
      options: {
        tagsSorter: 'alpha' as const,
        operationsSorter: 'alpha' as const,
        generateId: (props) => {
          if (props.type === 'tag') {
            return props.tag.name ?? ''
          }

          return 'unknown-id'
        },
      },
      documentId: 'doc-1',
    })
    expect(result).toHaveLength(1)
    expect(result[0]?.title).toBe('public')
  })

  it('should handle scalar-ignore tags', () => {
    const document = createMockDocument()
    const tagsMap: TagsMap = new Map([
      [
        'ignored',
        {
          id: 'tag/ignored',
          parentId: 'doc-1',
          tag: { ...createMockTag('ignored'), 'x-scalar-ignore': true },
          entries: [createMockEntry('Ignored Operation')],
        },
      ],
      [
        'visible',
        {
          id: 'tag/visible',
          parentId: 'doc-1',
          tag: createMockTag('visible'),
          entries: [createMockEntry('Visible Operation')],
        },
      ],
    ])

    const result = traverseTags({
      document,
      tagsMap,
      options: {
        tagsSorter: 'alpha' as const,
        operationsSorter: 'alpha' as const,
        generateId: (props) => {
          if (props.type === 'tag') {
            return props.tag.name ?? ''
          }

          return 'unknown-id'
        },
      },
      documentId: 'doc-1',
    })
    expect(result).toHaveLength(1)
    expect(result[0]?.title).toBe('visible')
  })
})
