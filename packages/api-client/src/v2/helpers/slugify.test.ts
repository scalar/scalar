import { describe, expect, it } from 'vitest'

import { slugify } from './slugify'

describe('slugify', () => {
  it('converts basic string with spaces to lowercase hyphenated slug', () => {
    expect(slugify('Hello World Example')).toBe('hello-world-example')
  })

  it('converts single word to lowercase', () => {
    expect(slugify('Hello')).toBe('hello')
  })

  it('converts multiple consecutive spaces to single hyphen', () => {
    expect(slugify('Hello   World')).toBe('hello-world')
  })

  it('converts mixed case strings to lowercase', () => {
    expect(slugify('HeLLo WoRLd')).toBe('hello-world')
  })

  it('handles already lowercase strings', () => {
    expect(slugify('hello world')).toBe('hello-world')
  })

  it('handles empty string', () => {
    expect(slugify('')).toBe('')
  })

  it('converts string with only spaces to hyphen', () => {
    expect(slugify('   ')).toBe('-')
  })

  it('handles leading spaces', () => {
    expect(slugify('  Hello World')).toBe('-hello-world')
  })

  it('handles tabs and newlines as whitespace', () => {
    expect(slugify('Hello\tWorld\nExample')).toBe('hello-world-example')
  })

  it('preserves special characters that are not whitespace', () => {
    expect(slugify('Hello-World!')).toBe('hello-world!')
  })

  it('handles string with no spaces', () => {
    expect(slugify('HelloWorld')).toBe('helloworld')
  })

  it('handles unicode characters', () => {
    expect(slugify('Hello 世界 World')).toBe('hello-世界-world')
  })
})
