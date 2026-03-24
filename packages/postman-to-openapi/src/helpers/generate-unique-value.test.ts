import { describe, expect, it } from 'vitest'

import { generateUniqueValue } from './generate-unique-value'

describe('generateUniqueValue', () => {
  it('returns defaultValue when validation returns true for it', () => {
    const result = generateUniqueValue('default', () => true)
    expect(result).toBe('default')
  })

  it('returns defaultValue when validation accepts it', () => {
    const taken = new Set<string>()
    const validation = (value: string) => !taken.has(value)
    const result = generateUniqueValue('example', validation)
    expect(result).toBe('example')
  })

  it('returns "defaultValue 1" when defaultValue fails validation', () => {
    const validation = (value: string) => value !== 'default'
    const result = generateUniqueValue('default', validation)
    expect(result).toBe('default 1')
  })

  it('returns first value that passes validation when several fail', () => {
    const taken = new Set(['foo', 'foo 1', 'foo 2'])
    const validation = (value: string) => !taken.has(value)
    const result = generateUniqueValue('foo', validation)
    expect(result).toBe('foo 3')
  })

  it('increments suffix until validation passes', () => {
    const validation = (value: string) => value === 'bar 3'
    const result = generateUniqueValue('bar', validation)
    expect(result).toBe('bar 3')
  })

  it('calls validation with each candidate value in order', () => {
    const seen: string[] = []
    const validation = (value: string) => {
      seen.push(value)
      return value === 'baz 3'
    }
    const result = generateUniqueValue('baz', validation)
    expect(result).toBe('baz 3')
    expect(seen).toEqual(['baz', 'baz 1', 'baz 2', 'baz 3'])
  })
})
