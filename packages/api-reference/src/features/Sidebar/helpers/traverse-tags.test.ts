import { describe, it, expect } from 'vitest'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { TagGroup } from '@scalar/types/legacy'
import type { SidebarEntry } from '@/features/Sidebar/types'
import { traverseTags } from './traverse-tags'

describe('traverseTags', () => {
  // Helper function to create a mock OpenAPI document
  const createMockDocument = (tagGroups?: TagGroup[]): OpenAPIV3_1.Document => ({
    openapi: '3.1.0',
    info: { title: 'Test API', version: '1.0.0' },
    paths: {},
    ...(tagGroups && { 'x-tagGroups': tagGroups }),
  })

  // Helper function to create a mock tag
  const createMockTag = (name: string, displayName?: string): OpenAPIV3_1.TagObject => ({
    name,
    ...(displayName && { 'x-displayName': displayName }),
  })

  // Helper function to create a mock sidebar entry
  const createMockEntry = (title: string, httpVerb?: string): SidebarEntry => ({
    id: `entry-${title}`,
    title,
    ...(httpVerb && { httpVerb }),
  })

  it('should handle empty tags map', () => {
    const document = createMockDocument()
    const tagsMap = new Map<string, SidebarEntry[]>()
    const tagsDict = new Map<string, OpenAPIV3_1.TagObject>()
    const titlesMap = new Map<string, string>()
    const options = {
      getTagId: (tag: OpenAPIV3_1.TagObject) => tag.name,
      tagsSorter: 'alpha' as const,
      operationsSorter: 'alpha' as const,
    }

    const result = traverseTags(document, tagsMap, tagsDict, titlesMap, options)
    expect(result).toEqual([])
  })

  it('should handle single default tag', () => {
    const document = createMockDocument()
    const tagsMap = new Map([['default', [createMockEntry('Test Operation')]]])
    const tagsDict = new Map([['default', createMockTag('default')]])
    const titlesMap = new Map<string, string>()
    const options = {
      getTagId: (tag: OpenAPIV3_1.TagObject) => tag.name,
      tagsSorter: 'alpha' as const,
      operationsSorter: 'alpha' as const,
    }

    const result = traverseTags(document, tagsMap, tagsDict, titlesMap, options)
    expect(result).toEqual([createMockEntry('Test Operation')])
  })

  it('should sort tags alphabetically', () => {
    const document = createMockDocument()
    const tagsMap = new Map([
      ['zebra', [createMockEntry('Zebra Operation')]],
      ['alpha', [createMockEntry('Alpha Operation')]],
    ])
    const tagsDict = new Map([
      ['zebra', createMockTag('zebra')],
      ['alpha', createMockTag('alpha')],
    ])
    const titlesMap = new Map<string, string>()
    const options = {
      getTagId: (tag: OpenAPIV3_1.TagObject) => tag.name,
      tagsSorter: 'alpha' as const,
      operationsSorter: 'alpha' as const,
    }

    const result = traverseTags(document, tagsMap, tagsDict, titlesMap, options)
    expect(result[0].title).toBe('alpha')
    expect(result[1].title).toBe('zebra')
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
      ['tag1', [createMockEntry('Operation 1')]],
      ['tag2', [createMockEntry('Operation 2')]],
    ])
    const tagsDict = new Map([
      ['tag1', createMockTag('tag1')],
      ['tag2', createMockTag('tag2')],
    ])
    const titlesMap = new Map<string, string>()
    const options = {
      getTagId: (tag: OpenAPIV3_1.TagObject) => tag.name,
      tagsSorter: 'alpha' as const,
      operationsSorter: 'alpha' as const,
    }

    const result = traverseTags(document, tagsMap, tagsDict, titlesMap, options)
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Group A')
    expect(result[0].children).toHaveLength(2)
  })

  it('should sort operations by HTTP method', () => {
    const document = createMockDocument()
    const tagsMap = new Map([
      ['default', [createMockEntry('POST Operation', 'post'), createMockEntry('GET Operation', 'get')]],
    ])
    const tagsDict = new Map([['default', createMockTag('default')]])
    const titlesMap = new Map<string, string>()
    const options = {
      getTagId: (tag: OpenAPIV3_1.TagObject) => tag.name,
      tagsSorter: 'alpha' as const,
      operationsSorter: 'method' as const,
    }

    const result = traverseTags(document, tagsMap, tagsDict, titlesMap, options)
    expect(result[0].httpVerb).toBe('get')
    expect(result[1].httpVerb).toBe('post')
  })

  it('should handle custom tag sorter', () => {
    const document = createMockDocument()
    const tagsMap = new Map([
      ['tag1', [createMockEntry('Operation 1')]],
      ['tag2', [createMockEntry('Operation 2')]],
    ])
    const tagsDict = new Map([
      ['tag1', createMockTag('tag1', 'Zebra')],
      ['tag2', createMockTag('tag2', 'Alpha')],
    ])
    const titlesMap = new Map<string, string>()
    const options = {
      getTagId: (tag: OpenAPIV3_1.TagObject) => tag.name,
      tagsSorter: (a: OpenAPIV3_1.TagObject, b: OpenAPIV3_1.TagObject) =>
        (a['x-displayName'] || '').localeCompare(b['x-displayName'] || ''),
      operationsSorter: 'alpha' as const,
    }

    const result = traverseTags(document, tagsMap, tagsDict, titlesMap, options)
    expect(result[0].title).toBe('Alpha')
    expect(result[1].title).toBe('Zebra')
  })

  it('should handle custom operations sorter', () => {
    const document = createMockDocument()
    const tagsMap = new Map([['default', [createMockEntry('Operation B'), createMockEntry('Operation A')]]])
    const tagsDict = new Map([['default', createMockTag('default')]])
    const titlesMap = new Map<string, string>()
    const options = {
      getTagId: (tag: OpenAPIV3_1.TagObject) => tag.name,
      tagsSorter: 'alpha' as const,
      operationsSorter: (
        a: { path: string; method: string; operationId?: string; summary?: string },
        b: { path: string; method: string; operationId?: string; summary?: string },
      ) => (a.summary || '').localeCompare(b.summary || ''),
    }

    const result = traverseTags(document, tagsMap, tagsDict, titlesMap, options)
    expect(result[0].title).toBe('Operation A')
    expect(result[1].title).toBe('Operation B')
  })

  it('should handle internal tags', () => {
    const document = createMockDocument()
    const tagsMap = new Map([
      ['internal', [createMockEntry('Internal Operation')]],
      ['public', [createMockEntry('Public Operation')]],
    ])
    const tagsDict = new Map([
      ['internal', { ...createMockTag('internal'), 'x-internal': true }],
      ['public', createMockTag('public')],
    ])
    const titlesMap = new Map<string, string>()
    const options = {
      getTagId: (tag: OpenAPIV3_1.TagObject) => tag.name,
      tagsSorter: 'alpha' as const,
      operationsSorter: 'alpha' as const,
    }

    const result = traverseTags(document, tagsMap, tagsDict, titlesMap, options)
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('public')
  })

  it('should handle scalar-ignore tags', () => {
    const document = createMockDocument()
    const tagsMap = new Map([
      ['ignored', [createMockEntry('Ignored Operation')]],
      ['visible', [createMockEntry('Visible Operation')]],
    ])
    const tagsDict = new Map([
      ['ignored', { ...createMockTag('ignored'), 'x-scalar-ignore': true }],
      ['visible', createMockTag('visible')],
    ])
    const titlesMap = new Map<string, string>()
    const options = {
      getTagId: (tag: OpenAPIV3_1.TagObject) => tag.name,
      tagsSorter: 'alpha' as const,
      operationsSorter: 'alpha' as const,
    }

    const result = traverseTags(document, tagsMap, tagsDict, titlesMap, options)
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('visible')
  })
})
