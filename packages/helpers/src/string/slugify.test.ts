import { describe, expect, it } from 'vitest'

import { slugify } from './slugify'

describe('slugify', () => {
  it('converts words to a slug', () => {
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

  it('converts underscores to hyphens (snake_case support)', () => {
    expect(slugify('user_name')).toBe('user-name')
  })

  it('collapses mixed underscores, spaces, and hyphens into a single hyphen', () => {
    expect(slugify('foo__bar--baz  qux')).toBe('foo-bar-baz-qux')
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

  it('lowercases by default', () => {
    expect(slugify('MyAPI Name')).toBe('myapi-name')
  })

  it('preserves original casing when configured', () => {
    expect(slugify('MyAPI Name', { preserveCase: true })).toBe('MyAPI-Name')
  })

  it('preserves mixed case with numbers when configured', () => {
    expect(slugify('CamelCase42', { preserveCase: true })).toBe('CamelCase42')
  })

  it('keeps dots when "." is allowed', () => {
    expect(slugify('v1.2.3', { allowedSpecialChars: '.' })).toBe('v1.2.3')
  })

  it('keeps dots and at-signs when ".@" is allowed', () => {
    expect(slugify('User@v1.2', { allowedSpecialChars: '.@' })).toBe('user@v1.2')
  })

  it('still strips characters not in the allow list', () => {
    expect(slugify('Hello!World.js', { allowedSpecialChars: '.' })).toBe('helloworld.js')
  })

  it('handles regex-special characters in allowedSpecialChars safely', () => {
    expect(slugify('price$9.99', { allowedSpecialChars: '$.' })).toBe('price$9.99')
  })

  it('keeps allowed special chars while preserving case when configured', () => {
    expect(slugify('MyAPI v1.2', { preserveCase: true, allowedSpecialChars: '.' })).toBe('MyAPI-v1.2')
  })
})
