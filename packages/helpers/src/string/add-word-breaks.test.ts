import { describe, expect, it } from 'vitest'

import { addWordBreaks } from './add-word-breaks'

describe('addWordBreaks', () => {
  describe('default behavior', () => {
    it('uses path preset by default', () => {
      const label = '/user/signup'
      const result = addWordBreaks(label)
      expect(result).toBe('​/user​/signup')
    })

    it('adds zero-width space before forward slashes', () => {
      const label = '/user/signup'
      const result = addWordBreaks(label)
      expect(result).toBe('​/user​/signup')
    })

    it('adds zero-width space before dashes', () => {
      const label = 'long-string-test'
      const result = addWordBreaks(label)
      expect(result).toBe('long​-string​-test')
    })

    it('handles both slashes and dashes', () => {
      const label = '/api/user-profile'
      const result = addWordBreaks(label)
      expect(result).toBe('​/api​/user​-profile')
    })

    it('handles long URI strings with multiple slashes', () => {
      const label = '/long/uri/that/also/needs/to/be/handled/properly/in/the/sidebar'
      const result = addWordBreaks(label)
      expect(result).toContain('​')
      expect(result).not.toBe(label)
      expect(result.split('​').length).toBeGreaterThan(1)
    })

    it('handles strings without wrap characters', () => {
      const label = 'Long string that needs to wrap to multiple lines'
      const result = addWordBreaks(label)
      expect(result).toBe(label)
    })

    it('handles empty string', () => {
      const label = ''
      const result = addWordBreaks(label)
      expect(result).toBe('')
    })

    it('handles strings with no matching characters', () => {
      const label = 'test'
      const result = addWordBreaks(label)
      expect(result).toBe('test')
    })

    it('handles PascalCase with default settings (should not wrap)', () => {
      const label = 'LongPascalCaseStringThatNeedsToWrapToMultipleLines'
      const result = addWordBreaks(label)
      expect(result).toBe(label)
    })
  })

  describe('path preset', () => {
    it('explicitly uses path preset', () => {
      const label = '/api/user-profile'
      const result = addWordBreaks(label, { preset: 'path' })
      expect(result).toBe('​/api​/user​-profile')
    })

    it('matches forward slashes', () => {
      const label = '/user/signup'
      const result = addWordBreaks(label, { preset: 'path' })
      expect(result).toBe('​/user​/signup')
    })

    it('matches dashes', () => {
      const label = 'long-string-test'
      const result = addWordBreaks(label, { preset: 'path' })
      expect(result).toBe('long​-string​-test')
    })

    it('matches both slashes and dashes', () => {
      const label = '/api/user-profile'
      const result = addWordBreaks(label, { preset: 'path' })
      expect(result).toBe('​/api​/user​-profile')
    })

    it('does not match uppercase letters', () => {
      const label = 'PascalCase'
      const result = addWordBreaks(label, { preset: 'path' })
      expect(result).toBe('PascalCase')
    })

    it('does not match underscores', () => {
      const label = 'snake_case'
      const result = addWordBreaks(label, { preset: 'path' })
      expect(result).toBe('snake_case')
    })

    it('does not match dots', () => {
      const label = 'dot.separated'
      const result = addWordBreaks(label, { preset: 'path' })
      expect(result).toBe('dot.separated')
    })
  })

  describe('property preset', () => {
    it('matches uppercase letters', () => {
      const label = 'PascalCase'
      const result = addWordBreaks(label, { preset: 'property' })
      expect(result).toBe('​Pascal​Case')
    })

    it('matches underscores', () => {
      const label = 'snake_case'
      const result = addWordBreaks(label, { preset: 'property' })
      expect(result).toBe('snake​_case')
    })

    it('matches dots', () => {
      const label = 'dot.separated'
      const result = addWordBreaks(label, { preset: 'property' })
      expect(result).toBe('dot​.separated')
    })

    it('matches dashes', () => {
      const label = 'kebab-case'
      const result = addWordBreaks(label, { preset: 'property' })
      expect(result).toBe('kebab​-case')
    })

    it('handles mixed property separators', () => {
      const label = 'MyProperty_Name.subProperty'
      const result = addWordBreaks(label, { preset: 'property' })
      expect(result).toContain('​')
      expect(result).not.toBe(label)
    })

    it('handles mixed property separators including kebab-case', () => {
      const label = 'MyProperty-Name_subProperty.property-name'
      const result = addWordBreaks(label, { preset: 'property' })
      expect(result).toContain('​')
      expect(result).not.toBe(label)
    })

    it('handles long PascalCase strings', () => {
      const label = 'LongPascalCaseStringThatNeedsToWrapToMultipleLines'
      const result = addWordBreaks(label, { preset: 'property' })
      expect(result).toContain('​')
      expect(result).not.toBe(label)
    })

    it('does not match lowercase text', () => {
      const label = 'lowercase text'
      const result = addWordBreaks(label, { preset: 'property' })
      expect(result).toBe('lowercase text')
    })

    it('does not match slashes', () => {
      const label = '/api/user'
      const result = addWordBreaks(label, { preset: 'property' })
      expect(result).toBe('/api/user')
    })
  })

  describe('custom regex', () => {
    it('uses custom regex for wrap characters', () => {
      const label = 'test.dot.separated'
      const result = addWordBreaks(label, {
        regex: /\./g,
      })
      expect(result).toBe('test​.dot​.separated')
    })

    it('handles multiple custom wrap characters', () => {
      const label = 'test_dot_separated'
      const result = addWordBreaks(label, {
        regex: /[._]/g,
      })
      expect(result).toBe('test​_dot​_separated')
    })

    it('handles custom regex that does not match', () => {
      const label = 'simple text'
      const result = addWordBreaks(label, {
        regex: /X/g,
      })
      expect(result).toBe('simple text')
    })

    it('handles empty regex pattern', () => {
      const label = '/test/path'
      const result = addWordBreaks(label, {
        regex: /(?!)/g,
      })
      expect(result).toBe('/test/path')
    })

    it('overrides preset when regex is provided', () => {
      const label = '/api/user-profile'
      const result = addWordBreaks(label, {
        preset: 'property',
        regex: /\./g,
      })
      expect(result).toBe('/api/user-profile')
    })

    it('handles PascalCase with custom regex', () => {
      const label = 'LongPascalCaseString'
      const result = addWordBreaks(label, {
        regex: /([A-Z])/g,
      })
      expect(result).toBe('​Long​Pascal​Case​String')
    })

    it('handles PascalCase excluding first letter', () => {
      const label = 'PascalCase'
      const result = addWordBreaks(label, {
        regex: /(?<!^)([A-Z])/g,
      })
      expect(result).toBe('Pascal​Case')
    })

    it('handles mixed patterns with custom regex', () => {
      const label = 'LongPascalCase-String/ThatNeedsToWrap'
      const result = addWordBreaks(label, {
        regex: /([A-Z])/g,
      })
      expect(result).toContain('​')
      expect(result).not.toBe(label)
    })
  })

  describe('edge cases', () => {
    it('handles string with only forward slash', () => {
      const label = '/'
      const result = addWordBreaks(label)
      expect(result).toBe('​/')
    })

    it('handles string with only dash', () => {
      const label = '-'
      const result = addWordBreaks(label)
      expect(result).toBe('​-')
    })

    it('handles multiple consecutive wrap characters', () => {
      const label = '///---'
      const result = addWordBreaks(label)
      expect(result).toContain('​')
    })

    it('handles string that starts and ends with wrap characters', () => {
      const label = '/start-and-end/'
      const result = addWordBreaks(label)
      expect(result).toContain('​')
    })

    it('preserves original string structure', () => {
      const label = '/api/v1/users'
      const result = addWordBreaks(label)
      expect(result.replace(/​/g, '')).toBe(label)
    })

    it('handles property preset with single uppercase letter', () => {
      const label = 'A'
      const result = addWordBreaks(label, { preset: 'property' })
      expect(result).toBe('​A')
    })

    it('handles property preset with single underscore', () => {
      const label = '_'
      const result = addWordBreaks(label, { preset: 'property' })
      expect(result).toBe('​_')
    })

    it('handles property preset with single dot', () => {
      const label = '.'
      const result = addWordBreaks(label, { preset: 'property' })
      expect(result).toBe('​.')
    })

    it('handles property preset with single dash', () => {
      const label = '-'
      const result = addWordBreaks(label, { preset: 'property' })
      expect(result).toBe('​-')
    })
  })
})
