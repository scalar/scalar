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

  it('should group operations under sub-tags using xSubTagPath (1 level deep)', () => {
    const document = createMockDocument()
    const tagsMap: TagsMap = new Map([
      [
        'Payer Catalog',
        {
          id: 'tag/payer-catalog',
          parentId: 'doc-1',
          tag: createMockTag('Payer Catalog'),
          entries: [
            {
              id: 'op-list-payers',
              title: 'List all payers',
              method: 'get',
              type: 'operation',
              path: '/fhir/r4/PayerCatalog',
              ref: '#/paths/~1fhir~1r4~1PayerCatalog/get',
              xSubTagPath: ['Payer Operations'],
            },
            {
              id: 'op-register-payer',
              title: 'Register a payer',
              method: 'post',
              type: 'operation',
              path: '/fhir/r4/PayerCatalog',
              ref: '#/paths/~1fhir~1r4~1PayerCatalog/post',
              xSubTagPath: ['Payer Operations'],
            },
            {
              id: 'op-bulk-export',
              title: 'Bulk export payers',
              method: 'get',
              type: 'operation',
              path: '/fhir/r4/PayerCatalog/$bulk',
              ref: '#/paths/~1fhir~1r4~1PayerCatalog~1$bulk/get',
              xSubTagPath: ['Bulk Operations'],
            },
          ],
        },
      ],
    ])

    const result = traverseTags({
      document,
      tagsMap,
      documentId: 'doc-1',
      options: {
        generateId: (props) => (props.type === 'tag' ? `tag/${props.tag.name}` : 'unknown-id'),
        tagsSorter: undefined,
        operationsSorter: undefined,
      },
    })

    assert(result[0]?.type === 'tag')
    const children = result[0].children ?? []
    expect(children).toHaveLength(2)

    assert(children[0]?.type === 'tag')
    expect(children[0].name).toBe('Payer Operations')
    expect(children[0].children).toHaveLength(2)
    expect(children[0].children?.[0]?.title).toBe('List all payers')
    expect(children[0].children?.[1]?.title).toBe('Register a payer')

    assert(children[1]?.type === 'tag')
    expect(children[1].name).toBe('Bulk Operations')
    expect(children[1].children).toHaveLength(1)
    expect(children[1].children?.[0]?.title).toBe('Bulk export payers')
  })

  it('should support arbitrary nesting depth via xSubTagPath (n levels deep)', () => {
    const document = createMockDocument()
    const tagsMap: TagsMap = new Map([
      [
        'Payer Catalog',
        {
          id: 'tag/payer-catalog',
          parentId: 'doc-1',
          tag: createMockTag('Payer Catalog'),
          entries: [
            {
              id: 'op-single',
              title: 'Get single payer',
              method: 'get',
              type: 'operation',
              path: '/fhir/r4/PayerCatalog/single',
              ref: '#/paths/single/get',
              xSubTagPath: ['Payer Operations', 'Single Payer', 'Details'],
            },
            {
              id: 'op-list',
              title: 'List all payers',
              method: 'get',
              type: 'operation',
              path: '/fhir/r4/PayerCatalog',
              ref: '#/paths/list/get',
              xSubTagPath: ['Payer Operations', 'Single Payer'],
            },
            {
              id: 'op-bulk',
              title: 'Bulk export',
              method: 'get',
              type: 'operation',
              path: '/fhir/r4/PayerCatalog/$bulk',
              ref: '#/paths/bulk/get',
              xSubTagPath: ['Bulk Operations'],
            },
          ],
        },
      ],
    ])

    const result = traverseTags({
      document,
      tagsMap,
      documentId: 'doc-1',
      options: {
        generateId: (props) => (props.type === 'tag' ? `tag/${props.tag.name}` : 'unknown-id'),
        tagsSorter: undefined,
        operationsSorter: undefined,
      },
    })

    assert(result[0]?.type === 'tag')
    const l1 = result[0].children ?? []
    // Payer Operations + Bulk Operations
    expect(l1).toHaveLength(2)

    assert(l1[0]?.type === 'tag')
    expect(l1[0].name).toBe('Payer Operations')
    const l2 = l1[0].children ?? []
    // Single Payer sub-group
    expect(l2).toHaveLength(1)
    assert(l2[0]?.type === 'tag')
    expect(l2[0].name).toBe('Single Payer')
    const l3 = l2[0].children ?? []
    // Details sub-group + List all payers (path length 2, stops here)
    expect(l3).toHaveLength(2)
    assert(l3[0]?.type === 'tag')
    expect(l3[0].name).toBe('Details')
    expect(l3[0].children?.[0]?.title).toBe('Get single payer')
    assert(l3[1]?.type === 'operation')
    expect(l3[1].title).toBe('List all payers')

    assert(l1[1]?.type === 'tag')
    expect(l1[1].name).toBe('Bulk Operations')
    expect(l1[1].children?.[0]?.title).toBe('Bulk export')
  })

  it('should place operations without xSubTagPath flat under the tag', () => {
    const document = createMockDocument()
    const tagsMap: TagsMap = new Map([
      [
        'Payer Catalog',
        {
          id: 'tag/payer-catalog',
          parentId: 'doc-1',
          tag: createMockTag('Payer Catalog'),
          entries: [
            {
              id: 'op-grouped',
              title: 'List all payers',
              method: 'get',
              type: 'operation',
              path: '/fhir/r4/PayerCatalog',
              ref: '#/paths/~1fhir~1r4~1PayerCatalog/get',
              xSubTagPath: ['Payer Operations'],
            },
            {
              id: 'op-ungrouped',
              title: 'Health check',
              method: 'get',
              type: 'operation',
              path: '/health',
              ref: '#/paths/~1health/get',
            },
          ],
        },
      ],
    ])

    const result = traverseTags({
      document,
      tagsMap,
      documentId: 'doc-1',
      options: {
        generateId: (props) => (props.type === 'tag' ? `tag/${props.tag.name}` : 'unknown-id'),
        tagsSorter: undefined,
        operationsSorter: undefined,
      },
    })

    assert(result[0]?.type === 'tag')
    const children = result[0].children ?? []
    expect(children).toHaveLength(2)
    assert(children[0]?.type === 'tag')
    expect(children[0].name).toBe('Payer Operations')
    assert(children[1]?.type === 'operation')
    expect(children[1].title).toBe('Health check')
  })

  it('should work with x-tagGroups and xSubTagPath together (n-level nesting)', () => {
    const tagGroups = [{ name: 'Automated Prior Authorization', tags: ['Payer Catalog'] }]
    const document = createMockDocument(tagGroups)
    const tagsMap: TagsMap = new Map([
      [
        'Payer Catalog',
        {
          id: 'tag/payer-catalog',
          parentId: 'doc-1',
          tag: createMockTag('Payer Catalog'),
          entries: [
            {
              id: 'op-list-payers',
              title: 'List all payers',
              method: 'get',
              type: 'operation',
              path: '/fhir/r4/PayerCatalog',
              ref: '#/paths/~1fhir~1r4~1PayerCatalog/get',
              xSubTagPath: ['Payer Operations'],
            },
          ],
        },
      ],
    ])

    const result = traverseTags({
      document,
      tagsMap,
      documentId: 'doc-1',
      options: {
        generateId: (props) => (props.type === 'tag' ? `tag/${props.tag.name}` : 'unknown-id'),
        tagsSorter: undefined,
        operationsSorter: undefined,
      },
    })

    // Level 1: x-tagGroups group
    expect(result).toHaveLength(1)
    assert(result[0]?.type === 'tag')
    expect(result[0].isGroup).toBe(true)
    expect(result[0].name).toBe('Automated Prior Authorization')

    // Level 2: tag
    const level2 = result[0].children ?? []
    assert(level2[0]?.type === 'tag')
    expect(level2[0].name).toBe('Payer Catalog')

    // Level 3: sub-tag from xSubTagPath[0]
    const level3 = level2[0].children ?? []
    assert(level3[0]?.type === 'tag')
    expect(level3[0].name).toBe('Payer Operations')

    // Level 4: operation
    const level4 = level3[0].children ?? []
    assert(level4[0]?.type === 'operation')
    expect(level4[0].title).toBe('List all payers')
  })

  it('should not affect tags without xSubTagPath on any operation', () => {
    const document = createMockDocument()
    const tagsMap: TagsMap = new Map([
      [
        'Authentication',
        {
          id: 'tag/authentication',
          parentId: 'doc-1',
          tag: createMockTag('Authentication'),
          entries: [createMockEntry('Get a token', 'post'), createMockEntry('Get authenticated user', 'get')],
        },
      ],
    ])

    const result = traverseTags({
      document,
      tagsMap,
      documentId: 'doc-1',
      options: {
        generateId: (props) => (props.type === 'tag' ? `tag/${props.tag.name}` : 'unknown-id'),
        tagsSorter: undefined,
        operationsSorter: undefined,
      },
    })

    assert(result[0]?.type === 'tag')
    // Children are flat operations, no sub-tag wrapping
    expect(result[0].children).toHaveLength(2)
    expect(result[0].children?.[0]?.type).toBe('operation')
    expect(result[0].children?.[1]?.type).toBe('operation')
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

  it('should produce the exact structure: x-tagGroups > tag > level1 > level2 > level3 > endpoint', () => {
    // This is the primary use-case: full 6-level sidebar nesting
    // x-tagGroups group (non-collapsible section header)
    //   └── Tag (collapsible)
    //         └── Level 1 (collapsible, xSubTagPath[0])
    //               └── Level 2 (collapsible, xSubTagPath[1])
    //                     └── Level 3 (collapsible, xSubTagPath[2])
    //                           └── Endpoint (operation)
    const tagGroups = [{ name: 'Automated Prior Authorization (CMS-0057)', tags: ['Payer Catalog'] }]
    const document = createMockDocument(tagGroups)
    const tagsMap: TagsMap = new Map([
      [
        'Payer Catalog',
        {
          id: 'tag/payer-catalog',
          parentId: 'doc-1',
          tag: createMockTag('Payer Catalog'),
          entries: [
            {
              id: 'op-1',
              title: 'List all payers in the catalog',
              method: 'get' as const,
              type: 'operation' as const,
              path: '/fhir/r4/PayerCatalog',
              ref: '#/paths/~1fhir~1r4~1PayerCatalog/get',
              xSubTagPath: ['Payer Operations', 'Single Payer', 'Read'],
            },
          ],
        },
      ],
    ])

    const result = traverseTags({
      document,
      tagsMap,
      documentId: 'doc-1',
      options: {
        generateId: (props) => (props.type === 'tag' ? `tag/${props.tag.name}` : 'unknown-id'),
        tagsSorter: undefined,
        operationsSorter: undefined,
      },
    })

    // x-tagGroups group
    expect(result).toHaveLength(1)
    assert(result[0]?.type === 'tag')
    expect(result[0].isGroup).toBe(true)
    expect(result[0].title).toBe('Automated Prior Authorization (CMS-0057)')

    // Tag
    const tagChildren = result[0].children ?? []
    expect(tagChildren).toHaveLength(1)
    assert(tagChildren[0]?.type === 'tag')
    expect(tagChildren[0].name).toBe('Payer Catalog')
    expect(tagChildren[0].isGroup).toBe(false)

    // Level 1
    const level1Children = tagChildren[0].children ?? []
    expect(level1Children).toHaveLength(1)
    assert(level1Children[0]?.type === 'tag')
    expect(level1Children[0].name).toBe('Payer Operations')

    // Level 2
    const level2Children = level1Children[0].children ?? []
    expect(level2Children).toHaveLength(1)
    assert(level2Children[0]?.type === 'tag')
    expect(level2Children[0].name).toBe('Single Payer')

    // Level 3
    const level3Children = level2Children[0].children ?? []
    expect(level3Children).toHaveLength(1)
    assert(level3Children[0]?.type === 'tag')
    expect(level3Children[0].name).toBe('Read')

    // Endpoint
    const endpoints = level3Children[0].children ?? []
    expect(endpoints).toHaveLength(1)
    assert(endpoints[0]?.type === 'operation')
    expect(endpoints[0].title).toBe('List all payers in the catalog')
    expect(endpoints[0].method).toBe('get')
  })

  it('should handle operations at mixed nesting depths within the same tag', () => {
    // Some operations are nested 1 level, some 2, some 3, some flat
    const document = createMockDocument()
    const tagsMap: TagsMap = new Map([
      [
        'Payer Catalog',
        {
          id: 'tag/payer-catalog',
          parentId: 'doc-1',
          tag: createMockTag('Payer Catalog'),
          entries: [
            {
              id: 'op-flat',
              title: 'Health check',
              method: 'get' as const,
              type: 'operation' as const,
              path: '/health',
              ref: '#/paths/~1health/get',
              // no xSubTagPath — flat
            },
            {
              id: 'op-l1',
              title: 'List payers',
              method: 'get' as const,
              type: 'operation' as const,
              path: '/payers',
              ref: '#/paths/~1payers/get',
              xSubTagPath: ['Payer Operations'],
            },
            {
              id: 'op-l2',
              title: 'Get single payer',
              method: 'get' as const,
              type: 'operation' as const,
              path: '/payers/single',
              ref: '#/paths/~1payers~1single/get',
              xSubTagPath: ['Payer Operations', 'Single'],
            },
            {
              id: 'op-l3',
              title: 'Get payer details',
              method: 'get' as const,
              type: 'operation' as const,
              path: '/payers/single/details',
              ref: '#/paths/~1payers~1single~1details/get',
              xSubTagPath: ['Payer Operations', 'Single', 'Details'],
            },
          ],
        },
      ],
    ])

    const result = traverseTags({
      document,
      tagsMap,
      documentId: 'doc-1',
      options: {
        generateId: (props) => (props.type === 'tag' ? `tag/${props.tag.name}` : 'unknown-id'),
        tagsSorter: undefined,
        operationsSorter: undefined,
      },
    })

    assert(result[0]?.type === 'tag')
    const tagChildren = result[0].children ?? []
    // 'Payer Operations' group + flat 'Health check'
    expect(tagChildren).toHaveLength(2)

    // Level 1 group
    assert(tagChildren[0]?.type === 'tag')
    expect(tagChildren[0].name).toBe('Payer Operations')
    const l1Children = tagChildren[0].children ?? []
    // 'Single' group + 'List payers' (path length 1, stops at l1)
    expect(l1Children).toHaveLength(2)

    assert(l1Children[0]?.type === 'tag')
    expect(l1Children[0].name).toBe('Single')
    const l2Children = l1Children[0].children ?? []
    // 'Details' group + 'Get single payer' (path length 2, stops at l2)
    expect(l2Children).toHaveLength(2)

    assert(l2Children[0]?.type === 'tag')
    expect(l2Children[0].name).toBe('Details')
    expect(l2Children[0].children?.[0]?.title).toBe('Get payer details')

    assert(l2Children[1]?.type === 'operation')
    expect(l2Children[1].title).toBe('Get single payer')

    assert(l1Children[1]?.type === 'operation')
    expect(l1Children[1].title).toBe('List payers')

    // Flat operation
    assert(tagChildren[1]?.type === 'operation')
    expect(tagChildren[1].title).toBe('Health check')
  })

  it('should handle multiple operations at the same nesting path', () => {
    const document = createMockDocument()
    const tagsMap: TagsMap = new Map([
      [
        'Payer Catalog',
        {
          id: 'tag/payer-catalog',
          parentId: 'doc-1',
          tag: createMockTag('Payer Catalog'),
          entries: [
            {
              id: 'op-get',
              title: 'Get payer',
              method: 'get' as const,
              type: 'operation' as const,
              path: '/payers/{id}',
              ref: '#/paths/~1payers~1{id}/get',
              xSubTagPath: ['Payer Operations', 'Single'],
            },
            {
              id: 'op-put',
              title: 'Update payer',
              method: 'put' as const,
              type: 'operation' as const,
              path: '/payers/{id}',
              ref: '#/paths/~1payers~1{id}/put',
              xSubTagPath: ['Payer Operations', 'Single'],
            },
            {
              id: 'op-delete',
              title: 'Delete payer',
              method: 'delete' as const,
              type: 'operation' as const,
              path: '/payers/{id}',
              ref: '#/paths/~1payers~1{id}/delete',
              xSubTagPath: ['Payer Operations', 'Single'],
            },
          ],
        },
      ],
    ])

    const result = traverseTags({
      document,
      tagsMap,
      documentId: 'doc-1',
      options: {
        generateId: (props) => (props.type === 'tag' ? `tag/${props.tag.name}` : 'unknown-id'),
        tagsSorter: undefined,
        operationsSorter: undefined,
      },
    })

    assert(result[0]?.type === 'tag')
    const l1 = result[0].children ?? []
    expect(l1).toHaveLength(1)
    assert(l1[0]?.type === 'tag')
    expect(l1[0].name).toBe('Payer Operations')

    const l2 = l1[0].children ?? []
    expect(l2).toHaveLength(1)
    assert(l2[0]?.type === 'tag')
    expect(l2[0].name).toBe('Single')

    // All 3 operations land under the same sub-tag
    const ops = l2[0].children ?? []
    expect(ops).toHaveLength(3)
    expect(ops[0]?.title).toBe('Get payer')
    expect(ops[1]?.title).toBe('Update payer')
    expect(ops[2]?.title).toBe('Delete payer')
  })
})
