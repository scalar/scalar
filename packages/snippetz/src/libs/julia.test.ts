import { describe, expect, it } from 'vitest'

import { formatCollection, formatDict, formatPairVector, formatValue, indent, wrapInDoubleQuotes } from './julia'

describe('wrapInDoubleQuotes', () => {
  it('wraps a plain string', () => {
    expect(wrapInDoubleQuotes('hello')).toBe('"hello"')
  })

  it('escapes quotes, backslashes and whitespace', () => {
    expect(wrapInDoubleQuotes('a "b" \\c\nd\te')).toBe('"a \\"b\\" \\\\c\\nd\\te"')
  })

  it('escapes the interpolation character', () => {
    expect(wrapInDoubleQuotes('$total')).toBe('"\\$total"')
  })
})

describe('indent', () => {
  it('indents with four spaces per level', () => {
    expect(indent(2, 'x')).toBe('        x')
  })
})

describe('formatCollection', () => {
  it('returns an empty collection', () => {
    expect(formatCollection([], '[', ']', 0)).toBe('[]')
  })

  it('keeps a single entry on one line', () => {
    expect(formatCollection(['1'], '[', ']', 0)).toBe('[1]')
  })

  it('puts each entry on its own line', () => {
    expect(formatCollection(['1', '2'], '[', ']', 0)).toBe('[\n    1,\n    2\n]')
  })
})

describe('formatPairVector', () => {
  it('formats headers as a vector of pairs', () => {
    expect(formatPairVector([{ name: 'Accept', value: 'text/plain' }], 0)).toBe('["Accept" => "text/plain"]')
  })
})

describe('formatDict', () => {
  it('formats pairs as a dictionary', () => {
    expect(formatDict([{ name: 'a', value: '1' }], 0)).toBe('Dict("a" => "1")')
  })
})

describe('formatValue', () => {
  it('formats primitives', () => {
    expect(formatValue(null, 0)).toBe('nothing')
    expect(formatValue(true, 0)).toBe('true')
    expect(formatValue(1.5, 0)).toBe('1.5')
    expect(formatValue('a', 0)).toBe('"a"')
  })

  it('formats nested objects and arrays', () => {
    expect(formatValue({ a: [1, 2], b: { c: 'd' } }, 0)).toBe(
      'Dict(\n    "a" => [\n        1,\n        2\n    ],\n    "b" => Dict("c" => "d")\n)',
    )
  })
})
