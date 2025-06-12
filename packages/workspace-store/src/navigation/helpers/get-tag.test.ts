import { describe, expect, it } from 'vitest'
import { getTag } from './get-tag'
import type { TraversedEntry } from '@/navigation/types'
import type { TagObject } from '@/schemas/v3.1/strict/tag'

describe('getTag', () => {
  it('returns existing tag from the dictionary', () => {
    const tagsMap = new Map<string, { tag: TagObject; entries: TraversedEntry[] }>()
    const existingTag = { name: 'test-tag', description: 'Test description' }
    tagsMap.set('test-tag', { tag: existingTag, entries: [] })

    const result = getTag(tagsMap, 'test-tag')

    expect(result).toEqual({ tag: existingTag, entries: [] })
    expect(tagsMap.size).toBe(1)
  })

  it('creates and returns a new tag if it does not exist', () => {
    const tagsMap = new Map<string, { tag: TagObject; entries: TraversedEntry[] }>()
    const tagName = 'new-tag'

    const result = getTag(tagsMap, tagName)

    expect(result).toEqual({ tag: { name: tagName }, entries: [] })
    expect(tagsMap.size).toBe(1)
    expect(tagsMap.get(tagName)).toEqual({ tag: { name: tagName }, entries: [] })
  })

  it('handles multiple tags in the dictionary', () => {
    const tagsMap = new Map<string, { tag: TagObject; entries: TraversedEntry[] }>()
    const tag1 = { name: 'tag1', description: 'First tag' }
    const tag2 = { name: 'tag2', description: 'Second tag' }
    tagsMap.set('tag1', { tag: tag1, entries: [] })
    tagsMap.set('tag2', { tag: tag2, entries: [] })

    const result1 = getTag(tagsMap, 'tag1')
    const result2 = getTag(tagsMap, 'tag2')
    const result3 = getTag(tagsMap, 'tag3')

    expect(result1).toEqual({ tag: tag1, entries: [] })
    expect(result2).toEqual({ tag: tag2, entries: [] })
    expect(result3).toEqual({ tag: { name: 'tag3' }, entries: [] })
    expect(tagsMap.size).toBe(3)
  })

  it('preserves existing tag properties when retrieving', () => {
    const tagsMap = new Map<string, { tag: TagObject; entries: TraversedEntry[] }>()
    const existingTag = {
      name: 'test-tag',
      description: 'Test description',
      externalDocs: { url: 'https://example.com' },
    }
    tagsMap.set('test-tag', { tag: existingTag, entries: [] })

    const result = getTag(tagsMap, 'test-tag')

    expect(result).toEqual({ tag: existingTag, entries: [] })
    expect(result.tag.description).toBe('Test description')
    expect(result.tag.externalDocs?.url).toBe('https://example.com')
  })
})
