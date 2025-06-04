import { describe, it, expect } from 'vitest'
import { capitalize } from './capitalize'

describe('capitalize', () => {
  it('should capitalize the first letter of a string', () => {
    expect(capitalize('hello')).toBe('Hello')
    expect(capitalize('world')).toBe('World')
  })

  it('should handle single character strings', () => {
    expect(capitalize('a')).toBe('A')
    expect(capitalize('z')).toBe('Z')
  })

  it('should handle already capitalized strings', () => {
    expect(capitalize('Hello')).toBe('Hello')
    expect(capitalize('WORLD')).toBe('WORLD')
  })

  it('should handle empty strings', () => {
    expect(capitalize('')).toBe('')
  })

  it('should handle strings with special characters', () => {
    expect(capitalize('123abc')).toBe('123abc')
    expect(capitalize('!hello')).toBe('!hello')
  })

  it('should handle strings with spaces', () => {
    expect(capitalize(' hello')).toBe(' hello')
    expect(capitalize('  world')).toBe('  world')
  })
})
