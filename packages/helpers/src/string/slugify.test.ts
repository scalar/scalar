import { describe, expect, it } from 'vitest'

import { slugify } from './slugify'

describe('slugify', () => {
  it('converts words to a slug', () => {
    expect(slugify('Hello World')).toBe('Hello-World')
  })

  it('trims surrounding whitespace', () => {
    expect(slugify('  Hello World  ')).toBe('Hello-World')
  })

  it('collapses repeated spaces and hyphens', () => {
    expect(slugify('Hello   --   World')).toBe('Hello-World')
  })

  it('removes punctuation', () => {
    expect(slugify('Hello, World!')).toBe('Hello-World')
  })

  it('removes symbols and emoji', () => {
    expect(slugify('Hello 👋 + World & Friends')).toBe('Hello-World-Friends')
  })

  it('converts underscores to hyphens (snake_case support)', () => {
    expect(slugify('user_name')).toBe('user-name')
  })

  it('collapses mixed underscores, spaces, and hyphens into a single hyphen', () => {
    expect(slugify('foo__bar--baz  qux')).toBe('foo-bar-baz-qux')
  })

  it('preserves accented letters', () => {
    expect(slugify('Crème Brûlée')).toBe('Crème-Brûlée')
  })

  it('normalizes decomposed unicode characters', () => {
    expect(slugify('Cafe\u0301')).toBe('Café')
  })

  it('preserves non-latin letters and numbers', () => {
    expect(slugify('東京 API 版本 2')).toBe('東京-API-版本-2')
  })

  it('returns an empty string when no slug characters remain', () => {
    expect(slugify('!@#$%^&*()')).toBe('')
  })

  it('limits slugs to 255 characters', () => {
    expect(slugify('a'.repeat(300))).toBe('a'.repeat(255))
  })

  it('preserves original casing by default', () => {
    expect(slugify('MyAPI Name')).toBe('MyAPI-Name')
  })

  it('lowercases when configured', () => {
    expect(slugify('MyAPI Name', { lowercase: true })).toBe('myapi-name')
  })

  it('lowercases mixed case with numbers when configured', () => {
    expect(slugify('CamelCase42', { lowercase: true })).toBe('camelcase42')
  })

  it('keeps dots when "." is allowed', () => {
    expect(slugify('v1.2.3', { allowedSpecialChars: '.' })).toBe('v1.2.3')
  })

  it('keeps dots and at-signs when ".@" is allowed', () => {
    expect(slugify('user@v1.2', { allowedSpecialChars: '.@' })).toBe('user@v1.2')
  })

  it('still strips characters not in the allow list', () => {
    expect(slugify('hello!world.js', { allowedSpecialChars: '.' })).toBe('helloworld.js')
  })

  it('handles regex-special characters in allowedSpecialChars safely', () => {
    expect(slugify('price$9.99', { allowedSpecialChars: '$.' })).toBe('price$9.99')
  })

  it('keeps allowed special chars and lowercases together', () => {
    expect(slugify('MyAPI v1.2', { lowercase: true, allowedSpecialChars: '.' })).toBe('myapi-v1.2')
  })
})
