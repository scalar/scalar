import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { describe, expect, it } from 'vitest'
import { getTag } from './get-tag'

describe('getTag', () => {
  it('returns existing tag from the dictionary', () => {
    const tagsDict = new Map<string, OpenAPIV3_1.TagObject>()
    const existingTag = { name: 'test-tag', description: 'Test description' }
    tagsDict.set('test-tag', existingTag)

    const result = getTag(tagsDict, 'test-tag')

    expect(result).toBe(existingTag)
    expect(tagsDict.size).toBe(1)
  })

  it('creates and returns a new tag if it does not exist', () => {
    const tagsDict = new Map<string, OpenAPIV3_1.TagObject>()
    const tagName = 'new-tag'

    const result = getTag(tagsDict, tagName)

    expect(result).toEqual({ name: tagName })
    expect(tagsDict.size).toBe(1)
    expect(tagsDict.get(tagName)).toEqual({ name: tagName })
  })

  it('handles multiple tags in the dictionary', () => {
    const tagsDict = new Map<string, OpenAPIV3_1.TagObject>()
    const tag1 = { name: 'tag1', description: 'First tag' }
    const tag2 = { name: 'tag2', description: 'Second tag' }
    tagsDict.set('tag1', tag1)
    tagsDict.set('tag2', tag2)

    const result1 = getTag(tagsDict, 'tag1')
    const result2 = getTag(tagsDict, 'tag2')
    const result3 = getTag(tagsDict, 'tag3')

    expect(result1).toBe(tag1)
    expect(result2).toBe(tag2)
    expect(result3).toEqual({ name: 'tag3' })
    expect(tagsDict.size).toBe(3)
  })

  it('preserves existing tag properties when retrieving', () => {
    const tagsDict = new Map<string, OpenAPIV3_1.TagObject>()
    const existingTag = {
      name: 'test-tag',
      description: 'Test description',
      externalDocs: { url: 'https://example.com' },
    }
    tagsDict.set('test-tag', existingTag)

    const result = getTag(tagsDict, 'test-tag')

    expect(result).toEqual(existingTag)
    expect(result.description).toBe('Test description')
    expect(result.externalDocs?.url).toBe('https://example.com')
  })
})
