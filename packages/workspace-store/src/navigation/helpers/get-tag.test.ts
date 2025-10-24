import { describe, expect, it } from 'vitest'

import type { TagsMap } from '@/navigation/types'

import { getTag } from './get-tag'

describe('getTag', () => {
  it('returns existing tag from the dictionary', () => {
    const tagsMap: TagsMap = new Map()
    const existingTag = { name: 'test-tag', description: 'Test description' }
    tagsMap.set('test-tag', { id: 'test-tag', parentId: 'document-1', tag: existingTag, entries: [] })

    const result = getTag({ tagsMap, name: 'test-tag', documentId: 'document-1', generateId: () => 'test-tag' })

    expect(result).toEqual({ id: 'test-tag', parentId: 'document-1', tag: existingTag, entries: [] })
    expect(tagsMap.size).toBe(1)
  })

  it('creates and returns a new tag if it does not exist', () => {
    const tagsMap: TagsMap = new Map()
    const tagName = 'new-tag'

    const result = getTag({ tagsMap, name: tagName, documentId: 'document-1', generateId: () => 'new-tag' })

    expect(result).toEqual({ id: 'new-tag', parentId: 'document-1', tag: { name: tagName }, entries: [] })
    expect(tagsMap.size).toBe(1)
    expect(tagsMap.get(tagName)).toEqual({ id: 'new-tag', parentId: 'document-1', tag: { name: tagName }, entries: [] })
  })

  it('handles multiple tags in the dictionary', () => {
    const tagsMap: TagsMap = new Map()
    const tag1 = { name: 'tag1', description: 'First tag' }
    const tag2 = { name: 'tag2', description: 'Second tag' }
    tagsMap.set('tag1', { id: 'tag1', parentId: 'document-1', tag: tag1, entries: [] })
    tagsMap.set('tag2', { id: 'tag2', parentId: 'document-1', tag: tag2, entries: [] })

    const result1 = getTag({ tagsMap, name: 'tag1', documentId: 'document-1', generateId: () => 'tag1' })
    const result2 = getTag({ tagsMap, name: 'tag2', documentId: 'document-1', generateId: () => 'tag2' })
    const result3 = getTag({ tagsMap, name: 'tag3', documentId: 'document-1', generateId: () => 'tag3' })

    expect(result1).toEqual({ id: 'tag1', parentId: 'document-1', tag: tag1, entries: [] })
    expect(result2).toEqual({ id: 'tag2', parentId: 'document-1', tag: tag2, entries: [] })
    expect(result3).toEqual({ id: 'tag3', parentId: 'document-1', tag: { name: 'tag3' }, entries: [] })
    expect(tagsMap.size).toBe(3)
  })

  it('preserves existing tag properties when retrieving', () => {
    const tagsMap: TagsMap = new Map()
    const existingTag = {
      name: 'test-tag',
      description: 'Test description',
      externalDocs: { url: 'https://example.com' },
    }
    tagsMap.set('test-tag', { id: 'test-tag', parentId: 'document-1', tag: existingTag, entries: [] })

    const result = getTag({ tagsMap, name: 'test-tag', documentId: 'document-1', generateId: () => 'test-tag' })

    expect(result).toEqual({ id: 'test-tag', parentId: 'document-1', tag: existingTag, entries: [] })
    expect(result.tag.description).toBe('Test description')
    expect(result.tag.externalDocs?.url).toBe('https://example.com')
  })
})
