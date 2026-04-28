import { describe, expect, it } from 'vitest'

import { slugify } from './slugify'

describe('slugify', () => {
  it('converts words to a lowercase slug', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('trims surrounding whitespace', () => {
    expect(slugify('  Hello World  ')).toBe('hello-world')
  })

  it('collapses repeated spaces and hyphens', () => {
    expect(slugify('Hello   --   World')).toBe('hello-world')
  })

  it('removes punctuation', () => {
    expect(slugify('Hello, World!')).toBe('hello-world')
  })

  it('removes symbols and emoji', () => {
    expect(slugify('Hello 👋 + World & Friends')).toBe('hello-world-friends')
  })

  it('preserves accented letters', () => {
    expect(slugify('Crème Brûlée')).toBe('crème-brûlée')
  })

  it('normalizes decomposed unicode characters', () => {
    expect(slugify('Cafe\u0301')).toBe('café')
  })

  it('preserves non-latin letters and numbers', () => {
    expect(slugify('東京 API 版本 2')).toBe('東京-api-版本-2')
  })

  it('returns an empty string when no slug characters remain', () => {
    expect(slugify('!@#$%^&*()')).toBe('')
  })

  it('limits slugs to 255 characters', () => {
    expect(slugify('a'.repeat(300))).toBe('a'.repeat(255))
  })
})
