import { describe, expect, it } from 'vitest'

import { generateUniqueSlug } from './generate-unique-slug'

describe('generateUniqueSlug', () => {
  it('generates a unique slug when the default value is unique', async () => {
    const existingDocuments = new Set<string>(['my-api', 'other-api'])

    const result = await generateUniqueSlug('New API', existingDocuments)

    expect(result).toBe('new-api')
  })

  it('uses "default" as fallback when defaultValue is undefined', async () => {
    const existingDocuments = new Set<string>(['my-api'])

    const result = await generateUniqueSlug(undefined, existingDocuments)

    expect(result).toBe('default')
  })

  it('increments slug when it already exists', async () => {
    const existingDocuments = new Set<string>(['my-api'])

    const result = await generateUniqueSlug('My API', existingDocuments)

    expect(result).toBe('my-api-1')
  })

  it('finds the next available slug with multiple collisions', async () => {
    const existingDocuments = new Set<string>(['my-api', 'my-api-1', 'my-api-2'])

    const result = await generateUniqueSlug('My API', existingDocuments)

    expect(result).toBe('my-api-3')
  })

  it('applies slugify transformation correctly', async () => {
    const existingDocuments = new Set<string>()

    const result = await generateUniqueSlug('Hello World API', existingDocuments)

    expect(result).toBe('hello-world-api')
  })

  it('handles empty string by transforming to empty and incrementing if needed $1', async () => {
    const existingDocuments = new Set<string>()

    const result = await generateUniqueSlug('', existingDocuments)

    expect(result).toBe('')
  })

  it('handles empty string by transforming to empty and incrementing if needed #2', async () => {
    const existingDocuments = new Set<string>([''])

    const result = await generateUniqueSlug('', existingDocuments)

    expect(result).toBe('-1')
  })

  it('handles empty string with collision', async () => {
    const existingDocuments = new Set<string>([''])

    const result = await generateUniqueSlug('', existingDocuments)

    // The slugify function keeps empty strings, so it becomes ' 1' then slugified to '-1'
    expect(result).toBe('-1')
  })

  it('handles special characters in titles', async () => {
    const existingDocuments = new Set<string>()

    const result = await generateUniqueSlug('My@Special#API$Name', existingDocuments)

    // Slugify only handles spaces and lowercase, special chars remain
    expect(result).toBe('my@special#api$name')
  })

  it('handles titles with multiple consecutive spaces', async () => {
    const existingDocuments = new Set<string>()

    const result = await generateUniqueSlug('My   API   Name', existingDocuments)

    // Multiple spaces are treated as a single whitespace group and replaced with one hyphen
    expect(result).toBe('my-api-name')
  })

  it('handles titles with leading and trailing spaces', async () => {
    const existingDocuments = new Set<string>()

    const result = await generateUniqueSlug('  My API  ', existingDocuments)

    // Leading/trailing spaces are treated as single whitespace groups
    expect(result).toBe('-my-api-')
  })

  it('returns undefined when max retries are exceeded', async () => {
    // Create a set with 101 documents: 'my-api', 'my-api 1', 'my-api 2', ..., 'my-api 100'
    // This exhausts the maxRetries of 100
    const existingDocuments = new Set<string>(['my-api', ...Array.from({ length: 100 }, (_, i) => `my-api-${i + 1}`)])

    const result = await generateUniqueSlug('My API', existingDocuments)

    expect(result).toBeUndefined()
  })

  it('handles case-insensitive collisions', async () => {
    const existingDocuments = new Set<string>(['my-api'])

    const result = await generateUniqueSlug('MY API', existingDocuments)

    // Both transform to 'my-api', so should increment
    expect(result).toBe('my-api-1')
  })

  it('handles numeric slugs', async () => {
    const existingDocuments = new Set<string>()

    const result = await generateUniqueSlug('123', existingDocuments)

    expect(result).toBe('123')
  })

  it('handles numeric slugs with collisions', async () => {
    const existingDocuments = new Set<string>(['123'])

    const result = await generateUniqueSlug('123', existingDocuments)

    expect(result).toBe('123-1')
  })

  it('handles mixed case with spaces correctly', async () => {
    const existingDocuments = new Set<string>()

    const result = await generateUniqueSlug('CamelCase API Name', existingDocuments)

    expect(result).toBe('camelcase-api-name')
  })

  it('handles very long titles', async () => {
    const existingDocuments = new Set<string>()
    const longTitle = 'A'.repeat(1000)

    const result = await generateUniqueSlug(longTitle, existingDocuments)

    expect(result).toBe(longTitle.toLowerCase())
  })

  it('handles empty set of existing documents', async () => {
    const existingDocuments = new Set<string>()

    const result = await generateUniqueSlug('My API', existingDocuments)

    expect(result).toBe('my-api')
  })

  it('handles large set of existing documents', async () => {
    const existingDocuments = new Set<string>(Array.from({ length: 1000 }, (_, i) => `api-${i}`))

    const result = await generateUniqueSlug('New API', existingDocuments)

    expect(result).toBe('new-api')
  })

  it('generates unique slug when incremented version exists but base does not', async () => {
    const existingDocuments = new Set<string>(['my-api-1', 'my-api-2'])

    const result = await generateUniqueSlug('My API', existingDocuments)

    // Base 'my-api' does not exist, so it should return it
    expect(result).toBe('my-api')
  })

  it('handles single character titles', async () => {
    const existingDocuments = new Set<string>()

    const result = await generateUniqueSlug('A', existingDocuments)

    expect(result).toBe('a')
  })

  it('handles single character with collision', async () => {
    const existingDocuments = new Set<string>(['a'])

    const result = await generateUniqueSlug('A', existingDocuments)

    expect(result).toBe('a-1')
  })

  it('handles tabs and newlines in titles', async () => {
    const existingDocuments = new Set<string>()

    const result = await generateUniqueSlug('My\tAPI\nName', existingDocuments)

    // Tabs and newlines are whitespace, replaced with hyphens
    expect(result).toBe('my-api-name')
  })

  it('handles unicode characters', async () => {
    const existingDocuments = new Set<string>()

    const result = await generateUniqueSlug('My API 中文 名称', existingDocuments)

    expect(result).toBe('my-api-中文-名称')
  })

  it('handles emoji in titles', async () => {
    const existingDocuments = new Set<string>()

    const result = await generateUniqueSlug('My 🚀 API', existingDocuments)

    expect(result).toBe('my-🚀-api')
  })
})
