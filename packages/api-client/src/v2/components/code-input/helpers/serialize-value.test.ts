import { describe, expect, it } from 'vitest'

import { serializeValue } from './serialize-value'

describe('serialize-value', () => {
  it('returns strings unchanged', () => {
    expect(serializeValue('hello')).toBe('hello')
  })

  it('returns an empty string for the empty string', () => {
    expect(serializeValue('')).toBe('')
  })

  it('returns an empty string for null', () => {
    // @ts-expect-error - exercise nullish runtime behavior even though the type forbids null
    expect(serializeValue(null)).toBe('')
  })

  it('returns an empty string for undefined', () => {
    // @ts-expect-error - exercise nullish runtime behavior even though the type forbids undefined
    expect(serializeValue(undefined)).toBe('')
  })

  it('JSON-stringifies numbers', () => {
    expect(serializeValue(42)).toBe('42')
    expect(serializeValue(0)).toBe('0')
  })

  it('JSON-stringifies booleans', () => {
    expect(serializeValue(true)).toBe('true')
    expect(serializeValue(false)).toBe('false')
  })

  it('JSON-stringifies arrays', () => {
    expect(serializeValue(['a', 1, true])).toBe('["a",1,true]')
  })

  it('JSON-stringifies plain objects', () => {
    expect(serializeValue({ a: 1, b: 'two' })).toBe('{"a":1,"b":"two"}')
  })
})
