import { describe, expect, it } from 'vitest'

import { wrapInDoubleQuotes } from './rust'

describe('rust', () => {
  describe('wrapInDoubleQuotes', () => {
    it('wraps a simple string in double quotes', () => {
      expect(wrapInDoubleQuotes('hello')).toBe('"hello"')
    })

    it('wraps an empty string in double quotes', () => {
      expect(wrapInDoubleQuotes('')).toBe('""')
    })

    it('escapes double quotes', () => {
      expect(wrapInDoubleQuotes('say "hello"')).toBe('"say \\"hello\\""')
    })

    it('escapes multiple double quotes', () => {
      expect(wrapInDoubleQuotes('"hello" "world"')).toBe('"\\"hello\\" \\"world\\""')
    })

    it('escapes backslashes', () => {
      expect(wrapInDoubleQuotes('path\\to\\file')).toBe('"path\\\\to\\\\file"')
    })

    it('escapes backslashes before quotes', () => {
      expect(wrapInDoubleQuotes('path\\"to\\"file')).toBe('"path\\\\\\"to\\\\\\"file"')
    })

    it('escapes newlines', () => {
      expect(wrapInDoubleQuotes('line1\nline2')).toBe('"line1\\nline2"')
    })

    it('escapes carriage returns', () => {
      expect(wrapInDoubleQuotes('line1\rline2')).toBe('"line1\\rline2"')
    })

    it('escapes tabs', () => {
      expect(wrapInDoubleQuotes('col1\tcol2')).toBe('"col1\\tcol2"')
    })

    it('escapes null bytes', () => {
      expect(wrapInDoubleQuotes('text\0more')).toBe('"text\\0more"')
    })

    it('handles multiple special characters', () => {
      expect(wrapInDoubleQuotes('say "hello"\n\tworld\\')).toBe('"say \\"hello\\"\\n\\tworld\\\\"')
    })

    it('handles strings with only special characters', () => {
      expect(wrapInDoubleQuotes('\n\r\t\0')).toBe('"\\n\\r\\t\\0"')
    })

    it('handles strings with unicode characters', () => {
      expect(wrapInDoubleQuotes('hello 世界')).toBe('"hello 世界"')
    })

    it('handles strings with emoji', () => {
      expect(wrapInDoubleQuotes('hello 👋')).toBe('"hello 👋"')
    })

    it('handles strings that already contain escaped sequences', () => {
      expect(wrapInDoubleQuotes('already\\nescaped')).toBe('"already\\\\nescaped"')
    })

    it('handles mixed quotes and backslashes', () => {
      expect(wrapInDoubleQuotes('C:\\Users\\"name"')).toBe('"C:\\\\Users\\\\\\"name\\""')
    })
  })
})
