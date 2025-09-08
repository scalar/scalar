import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { describe, expect, it } from 'vitest'

import type { TraversedEntry, TraversedOperation, TraversedTag } from '@/schemas/navigation'
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
    const tagsMap = new Map<string, { tag: TagObject; entries: TraversedEntry[] }>()
    const titlesMap = new Map<string, string>()
    const options = {
      getTagId: (tag: TagObject) => tag.name ?? '',
      tagsSorter: 'alpha' as const,
      operationsSorter: 'alpha' as const,
    }

    const result = traverseTags(document, tagsMap, titlesMap, options)
    expect(result).toEqual([])
  })

  it('should handle single default tag', () => {
    const document = createMockDocument()
    const tagsMap = new Map([
      ['default', { tag: createMockTag('default'), entries: [createMockEntry('Test Operation')] }],
    ])
    const titlesMap = new Map<string, string>()
    const options = {
      getTagId: (tag: TagObject) => tag.name ?? '',
      tagsSorter: 'alpha' as const,
      operationsSorter: 'alpha' as const,
    }

    const result = traverseTags(document, tagsMap, titlesMap, options)
    expect(result).toEqual([createMockEntry('Test Operation')])
  })

  it('should handle a mix of tags and default tag', () => {
    const document = createMockDocument()
    const tagsMap = new Map([
      ['default', { tag: createMockTag('default'), entries: [createMockEntry('Test Operation')] }],
      ['tag1', { tag: createMockTag('tag1'), entries: [createMockEntry('Test Operation')] }],
    ])
    const titlesMap = new Map<string, string>()
    const options = {
      getTagId: (tag: TagObject) => tag.name ?? '',
      tagsSorter: 'alpha' as const,
      operationsSorter: 'alpha' as const,
    }

    const result = traverseTags(document, tagsMap, titlesMap, options)
    expect(result).toEqual([
      {
        type: 'tag',
        id: 'tag1',
        title: 'tag1',
        name: 'tag1',
        children: [createMockEntry('Test Operation')],
        isGroup: false,
      },
      {
        type: 'tag',
        id: 'default',
        title: 'default',
        name: 'default',
        children: [createMockEntry('Test Operation')],
        isGroup: false,
      },
    ])
  })

  it('should sort tags alphabetically', () => {
    const document = createMockDocument()
    const tagsMap = new Map([
      ['zebra', { tag: createMockTag('zebra'), entries: [createMockEntry('Zebra Operation')] }],
      ['alpha', { tag: createMockTag('alpha'), entries: [createMockEntry('Alpha Operation')] }],
    ])
    const titlesMap = new Map<string, string>()
    const options = {
      getTagId: (tag: TagObject) => tag.name ?? '',
      tagsSorter: 'alpha' as const,
      operationsSorter: 'alpha' as const,
    }

    const result = traverseTags(document, tagsMap, titlesMap, options)
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
    const tagsMap = new Map([
      ['tag1', { tag: createMockTag('tag1'), entries: [createMockEntry('Operation 1')] }],
      ['tag2', { tag: createMockTag('tag2'), entries: [createMockEntry('Operation 2')] }],
    ])
    const titlesMap = new Map<string, string>()
    const options = {
      getTagId: (tag: TagObject) => tag.name ?? '',
      tagsSorter: 'alpha' as const,
      operationsSorter: 'alpha' as const,
    }

    const result = traverseTags(document, tagsMap, titlesMap, options)
    expect(result).toHaveLength(1)
    expect(result[0]?.title).toBe('Group A')
    expect((result[0] as TraversedTag).children).toHaveLength(2)
  })

  it('should sort operations by HTTP method', () => {
    const document = createMockDocument()
    const tagsMap = new Map([
      [
        'default',
        {
          tag: createMockTag('default'),
          entries: [createMockEntry('POST Operation', 'post'), createMockEntry('GET Operation', 'get')],
        },
      ],
    ])
    const titlesMap = new Map<string, string>()
    const options = {
      getTagId: (tag: TagObject) => tag.name ?? '',
      tagsSorter: 'alpha',
      operationsSorter: 'method',
    } as const

    const result = traverseTags(document, tagsMap, titlesMap, options)
    expect((result[0] as TraversedOperation).method).toBe('get')
    expect((result[1] as TraversedOperation).method).toBe('post')
  })

  it('should handle custom operationSorter using [deprecated] httpVerb', () => {
    const document = createMockDocument()
    const tagsMap = new Map([
      [
        'default',
        {
          tag: createMockTag('default'),
          entries: [createMockEntry('POST Operation', 'post'), createMockEntry('GET Operation', 'get')],
        },
      ],
    ])
    const titlesMap = new Map<string, string>()
    const options = {
      getTagId: (tag: TagObject) => tag.name ?? '',
      tagsSorter: 'alpha',
      operationsSorter: (a: { httpVerb: string }, b: { httpVerb: string }) =>
        (a.httpVerb || '').localeCompare(b.httpVerb || ''),
    } as const

    const result = traverseTags(document, tagsMap, titlesMap, options)
    expect((result[0] as TraversedOperation).method).toBe('get')
    expect((result[1] as TraversedOperation).method).toBe('post')
  })

  it('should handle custom tag sorter', () => {
    const document = createMockDocument()
    const tagsMap = new Map([
      ['tag1', { tag: createMockTag('tag1', 'Zebra'), entries: [createMockEntry('Operation 1')] }],
      ['tag2', { tag: createMockTag('tag2', 'Alpha'), entries: [createMockEntry('Operation 2')] }],
    ])
    const titlesMap = new Map<string, string>()
    const options = {
      getTagId: (tag: TagObject) => tag.name ?? '',
      tagsSorter: (a: TagObject, b: TagObject) => (a['x-displayName'] ?? '').localeCompare(b['x-displayName'] || ''),
      operationsSorter: 'alpha' as const,
    }

    const result = traverseTags(document, tagsMap, titlesMap, options)
    expect(result[0]?.title).toBe('Alpha')
    expect(result[1]?.title).toBe('Zebra')
  })

  it('should handle custom operations sorter', () => {
    const document = createMockDocument()
    const tagsMap = new Map([
      [
        'default',
        {
          tag: createMockTag('default'),
          entries: [createMockEntry('Operation B', 'post'), createMockEntry('Operation A', 'get')],
        },
      ],
    ])
    const titlesMap = new Map<string, string>()

    const options = {
      getTagId: (tag: TagObject) => tag.name ?? '',
      tagsSorter: 'alpha' as const,
      operationsSorter: (a: { method: string }, b: { method: string }) =>
        (a.method || '').localeCompare(b.method || ''),
    }

    const result = traverseTags(document, tagsMap, titlesMap, options)
    expect(result[0]?.title).toBe('Operation A')
    expect(result[1]?.title).toBe('Operation B')
  })

  it('should handle internal tags', () => {
    const document = createMockDocument()
    const tagsMap = new Map([
      [
        'internal',
        { tag: { ...createMockTag('internal'), 'x-internal': true }, entries: [createMockEntry('Internal Operation')] },
      ],
      ['public', { tag: createMockTag('public'), entries: [createMockEntry('Public Operation')] }],
    ])
    const titlesMap = new Map<string, string>()
    const options = {
      getTagId: (tag: TagObject) => tag.name ?? '',
      tagsSorter: 'alpha' as const,
      operationsSorter: 'alpha' as const,
    }

    const result = traverseTags(document, tagsMap, titlesMap, options)
    expect(result).toHaveLength(1)
    expect(result[0]?.title).toBe('public')
  })

  it('should handle scalar-ignore tags', () => {
    const document = createMockDocument()
    const tagsMap = new Map([
      [
        'ignored',
        {
          tag: { ...createMockTag('ignored'), 'x-scalar-ignore': true },
          entries: [createMockEntry('Ignored Operation')],
        },
      ],
      ['visible', { tag: createMockTag('visible'), entries: [createMockEntry('Visible Operation')] }],
    ])
    const titlesMap = new Map<string, string>()
    const options = {
      getTagId: (tag: TagObject) => tag.name ?? '',
      tagsSorter: 'alpha' as const,
      operationsSorter: 'alpha' as const,
    }

    const result = traverseTags(document, tagsMap, titlesMap, options)
    expect(result).toHaveLength(1)
    expect(result[0]?.title).toBe('visible')
  })
})
