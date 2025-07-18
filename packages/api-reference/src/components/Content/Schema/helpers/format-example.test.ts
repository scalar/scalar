import { describe, expect, it } from 'vitest'
import { formatExample } from './format-example'

describe('formatExample', () => {
  it('formats array examples by wrapping items in quotes and brackets', () => {
    const input = ['foo', 'bar', ' baz ']
    const result = formatExample(input)
    expect(result).toBe('["foo", "bar", "baz"]')
  })

  it('returns non-array examples unchanged', () => {
    const input = 'just a string'
    const result = formatExample(input)
    expect(result).toBe('just a string')
  })

  it('handles empty array', () => {
    const input: string[] = []
    const result = formatExample(input)
    expect(result).toBe('[]')
  })

  it('handles single item array', () => {
    const input = ['single']
    const result = formatExample(input)
    expect(result).toBe('["single"]')
  })

  it('handles array with number values', () => {
    const input = [123, 456.789]
    const result = formatExample(input)
    expect(result).toBe('[123, 456.789]')
  })

  it('handles array with object values', () => {
    const input = [{ foo: 'bar' }, { baz: 123 }]
    const result = formatExample(input as any)
    expect(result).toBe('[{"foo":"bar"}, {"baz":123}]')
  })

  it('handles array with mixed value types', () => {
    const input = ['string', { obj: 'val' }, '123']
    const result = formatExample(input as any)
    expect(result).toBe('["string", {"obj":"val"}, "123"]')
  })

  it('handles array with null/undefined values', () => {
    const input = [null, undefined] as any
    const result = formatExample(input)
    expect(result).toBe('[null, undefined]')
  })

  it('handles array with whitespace strings', () => {
    const input = ['  leading', 'trailing  ', '  both  ']
    const result = formatExample(input)
    expect(result).toBe('["leading", "trailing", "both"]')
  })

  it('handles non-string/non-array input', () => {
    const input = 123
    const result = formatExample(input)
    expect(result).toBe('123')
  })

  it('handles undefined input', () => {
    const input = undefined
    const result = formatExample(input)
    expect(result).toBe('undefined')
  })

  it('handles null input', () => {
    const input = null
    const result = formatExample(input)
    expect(result).toBe('null')
  })

  it('handles number input', () => {
    const input = 123.456
    const result = formatExample(input)
    expect(result).toBe('123.456')
  })

  it('handles external value', () => {
    const input = {
      externalValue: 'https://example.com',
    }
    const result = formatExample(input)
    expect(result).toBe('https://example.com')
  })

  it('handles object value', () => {
    const input = {
      value: '123',
    }
    const result = formatExample(input)
    expect(result).toBe('123')
  })
})
