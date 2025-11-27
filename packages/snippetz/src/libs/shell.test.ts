import { describe, expect, it } from 'vitest'

import { escapeSingleQuotes } from './shell'

describe('strings', () => {
  describe('escapeSingleQuotes', () => {
    it('escapes single quotes in a string', () => {
      const result = escapeSingleQuotes("hell'o")
      expect(result).toBe("hell'\\''o")
    })

    it('handles multiple single quotes', () => {
      const result = escapeSingleQuotes("it's a 'test'")
      expect(result).toBe("it'\\''s a '\\''test'\\''")
    })

    it('handles strings without single quotes', () => {
      const result = escapeSingleQuotes('hello world')
      expect(result).toBe('hello world')
    })

    it('handles empty strings', () => {
      const result = escapeSingleQuotes('')
      expect(result).toBe('')
    })

    it('handles strings with only single quotes', () => {
      const result = escapeSingleQuotes("'''")
      expect(result).toBe("'\\'''\\'''\\''")
    })
  })
})
