import { describe, expect, it } from 'vitest'

import { formatSidebarLabel } from './format-sidebar-label'

describe('formatSidebarLabel', () => {
  describe('with default settings', () => {
    it('adds zero-width space before forward slashes', () => {
      const label = '/user/signup'
      const result = formatSidebarLabel(label)
      expect(result).toBe('​/user​/signup')
    })

    it('adds zero-width space before dashes', () => {
      const label = 'long-string-test'
      const result = formatSidebarLabel(label)
      expect(result).toBe('long​-string​-test')
    })

    it('handles both slashes and dashes', () => {
      const label = '/api/user-profile'
      const result = formatSidebarLabel(label)
      expect(result).toBe('​/api​/user​-profile')
    })

    it('handles long URI strings with multiple slashes', () => {
      const label = '/long/uri/that/also/needs/to/be/handled/properly/in/the/sidebar'
      const result = formatSidebarLabel(label)
      expect(result).toContain('​')
      expect(result).not.toBe(label)
      // Check that slashes have zero-width spaces after them
      expect(result.split('​').length).toBeGreaterThan(1)
    })

    it('handles strings without wrap characters', () => {
      const label = 'Long string that needs to wrap to multiple lines'
      const result = formatSidebarLabel(label)
      expect(result).toBe(label)
    })

    it('handles empty string', () => {
      const label = ''
      const result = formatSidebarLabel(label)
      expect(result).toBe('')
    })

    it('handles strings with only one wrap character', () => {
      const label = 'test'
      const result = formatSidebarLabel(label)
      expect(result).toBe('test')
    })
  })

  describe('with custom wrapCharacters', () => {
    it('uses custom regex for wrap characters', () => {
      const label = 'test.dot.separated'
      const result = formatSidebarLabel(label, {
        wrapCharacters: /\./g,
      })
      expect(result).toBe('test​.dot​.separated')
    })

    it('handles multiple custom wrap characters', () => {
      const label = 'test_dot_separated'
      const result = formatSidebarLabel(label, {
        wrapCharacters: /[._]/g,
      })
      expect(result).toBe('test​_dot​_separated')
    })

    it('handles custom regex that does not match', () => {
      const label = 'simple text'
      const result = formatSidebarLabel(label, {
        wrapCharacters: /X/g,
      })
      expect(result).toBe('simple text')
    })

    it('handles empty regex pattern', () => {
      const label = '/test/path'
      const result = formatSidebarLabel(label, {
        wrapCharacters: /(?!)/g, // Never matches
      })
      expect(result).toBe('/test/path')
    })
  })

  describe('with PascalCase regex', () => {
    it('adds zero-width space before uppercase letters in PascalCase', () => {
      const label = 'LongPascalCaseStringThatNeedsToWrapToMultipleLines'
      const result = formatSidebarLabel(label, {
        wrapCharacters: /([A-Z])/g,
      })
      expect(result).toBe('​Long​Pascal​Case​String​That​Needs​To​Wrap​To​Multiple​Lines')
    })

    it('handles PascalCase with default settings (should not wrap)', () => {
      const label = 'LongPascalCaseStringThatNeedsToWrapToMultipleLines'
      const result = formatSidebarLabel(label)
      // With default settings, PascalCase should not be modified
      expect(result).toBe(label)
    })

    it('handles mixed PascalCase and separators', () => {
      const label = 'LongPascalCase-String/ThatNeedsToWrap'
      const result = formatSidebarLabel(label, {
        wrapCharacters: /([A-Z])/g,
      })
      expect(result).toContain('​')
      expect(result).not.toBe(label)
    })

    it('handles single word PascalCase', () => {
      const label = 'PascalCase'
      const result = formatSidebarLabel(label, {
        wrapCharacters: /(?<!^)([A-Z])/g, // Not at start
      })
      expect(result).toContain('​')
    })
  })

  describe('with real-world examples from sidebar-data.ts', () => {
    it('formats "Long string that needs to wrap to multiple lines"', () => {
      const label = 'Long string that needs to wrap to multiple lines'
      const result = formatSidebarLabel(label)
      expect(result).toBe(label)
    })

    it('formats "/long/uri/that/also/needs/to/be/handled/properly/in/the/sidebar"', () => {
      const label = '/long/uri/that/also/needs/to/be/handled/properly/in/the/sidebar'
      const result = formatSidebarLabel(label)
      expect(result).not.toBe(label)
      expect(result).toContain('​')
    })

    it('formats "LongPascalCaseStringThatNeedsToWrapToMultipleLines" with PascalCase regex', () => {
      const label = 'LongPascalCaseStringThatNeedsToWrapToMultipleLines'
      const result = formatSidebarLabel(label, {
        wrapCharacters: /(?<!^)([A-Z])/g,
      })
      expect(result).not.toBe(label)
      expect(result).toContain('​')
    })

    it('formats "tag/authentication/post/user/signup"', () => {
      const label = 'tag/authentication/post/user/signup'
      const result = formatSidebarLabel(label)
      expect(result).toContain('​')
    })

    it('formats "tag/long-string-test/post/user/signup" with both separators', () => {
      const label = 'tag/long-string-test/post/user/signup'
      const result = formatSidebarLabel(label)
      expect(result).toContain('​')
      expect(result).toContain('​-')
    })

    it('formats "Celestial Bodies" (with space)', () => {
      const label = 'Celestial Bodies'
      const result = formatSidebarLabel(label)
      expect(result).toBe(label)
    })

    it('formats "Get all planets" (simple text)', () => {
      const label = 'Get all planets'
      const result = formatSidebarLabel(label)
      expect(result).toBe(label)
    })
  })

  describe('edge cases', () => {
    it('handles string with only forward slash', () => {
      const label = '/'
      const result = formatSidebarLabel(label)
      expect(result).toBe('​/')
    })

    it('handles string with only dash', () => {
      const label = '-'
      const result = formatSidebarLabel(label)
      expect(result).toBe('​-')
    })

    it('handles multiple consecutive wrap characters', () => {
      const label = '///---'
      const result = formatSidebarLabel(label)
      expect(result).toContain('​')
    })

    it('handles string that starts and ends with wrap characters', () => {
      const label = '/start-and-end/'
      const result = formatSidebarLabel(label)
      expect(result).toContain('​')
    })

    it('preserves original string structure', () => {
      const label = '/api/v1/users'
      const result = formatSidebarLabel(label)
      // Should still contain all original characters in order
      expect(result.replace(/​/g, '')).toBe(label)
    })
  })
})
