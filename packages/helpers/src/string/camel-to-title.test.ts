import { describe, it, expect } from 'vitest'
import { camelToTitleWords } from './camel-to-title'

describe('camelToTitleWords', () => {
  it('converts single word camelCase to Title Case', () => {
    expect(camelToTitleWords('hello')).toBe('Hello')
  })

  it('converts multi-word camelCase to Title Words', () => {
    expect(camelToTitleWords('helloWorld')).toBe('Hello World')
    expect(camelToTitleWords('thisIsATest')).toBe('This Is A Test')
  })

  it('handles camelCase with numbers', () => {
    expect(camelToTitleWords('user123')).toBe('User123')
    expect(camelToTitleWords('test123Case')).toBe('Test123 Case')
  })

  it('handles camelCase with consecutive capitals', () => {
    expect(camelToTitleWords('userID')).toBe('User ID')
    expect(camelToTitleWords('parseHTML')).toBe('Parse HTML')
  })

  it('handles empty string', () => {
    expect(camelToTitleWords('')).toBe('')
  })

  it('handles single character', () => {
    expect(camelToTitleWords('a')).toBe('A')
  })

  it('handles already capitalized words', () => {
    expect(camelToTitleWords('HelloWorld')).toBe('Hello World')
  })
})
