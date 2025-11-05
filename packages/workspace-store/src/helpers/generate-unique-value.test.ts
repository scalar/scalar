import { describe, expect, it, vi } from 'vitest'

import { generateUniqueValue } from './generate-unique-value'

describe('generateUniqueValue', () => {
  it('returns the transformed/default value when it is unique', () => {
    const existing = new Set<string>(['foo 1', 'foo 2'])
    const validation = vi.fn((value: string): boolean => !existing.has(value))

    const result = generateUniqueValue({
      defaultValue: 'foo',
      validation,
      maxRetries: 5,
    })

    expect(result).toBe('foo')
    expect(validation).toHaveBeenCalledTimes(1)
    expect(validation).toHaveBeenCalledWith('foo')
  })

  it('increments until a unique value is found', () => {
    const existing = new Set<string>(['foo', 'foo 1', 'foo 2'])
    const validation = vi.fn((value: string): boolean => !existing.has(value))

    const result = generateUniqueValue({
      defaultValue: 'foo',
      validation,
      maxRetries: 10,
    })

    expect(result).toBe('foo 3')
    // 1 initial check for 'foo' + 3 increment attempts
    expect(validation).toHaveBeenCalledTimes(4)
    expect(validation).toHaveBeenNthCalledWith(1, 'foo')
    expect(validation).toHaveBeenNthCalledWith(2, 'foo 1')
    expect(validation).toHaveBeenNthCalledWith(3, 'foo 2')
    expect(validation).toHaveBeenNthCalledWith(4, 'foo 3')
  })

  it('returns undefined when no unique value is found within maxRetries', () => {
    const existing = new Set<string>(['foo', 'foo 1', 'foo 2', 'foo 3'])
    const validation = vi.fn((value: string): boolean => !existing.has(value))

    const result = generateUniqueValue({
      defaultValue: 'foo',
      validation,
      maxRetries: 3,
    })

    expect(result).toBeUndefined()
    // 1 initial check for 'foo' + 3 increment attempts ('foo 1'..'foo 3')
    expect(validation).toHaveBeenCalledTimes(4)
    expect(validation).toHaveBeenNthCalledWith(1, 'foo')
    expect(validation).toHaveBeenNthCalledWith(2, 'foo 1')
    expect(validation).toHaveBeenNthCalledWith(3, 'foo 2')
    expect(validation).toHaveBeenNthCalledWith(4, 'foo 3')
  })

  it('applies transformation before validation', () => {
    const transformation = (value: string): string => value.toLowerCase().replace(/\s+/g, '-')
    const existing = new Set<string>(['foo-bar 1'])
    const validation = vi.fn((value: string): boolean => !existing.has(value))

    const result = generateUniqueValue({
      defaultValue: 'Foo Bar',
      validation,
      transformation,
      maxRetries: 5,
    })

    expect(result).toBe('foo-bar')
    expect(validation).toHaveBeenCalledTimes(1)
    expect(validation).toHaveBeenCalledWith('foo-bar')
  })

  it('applies transformation and increments when needed', () => {
    const transformation = (value: string): string => value.toLowerCase()
    const existing = new Set<string>(['foo', 'foo 1'])
    const validation = vi.fn((value: string): boolean => !existing.has(value))

    const result = generateUniqueValue({
      defaultValue: 'FOO',
      validation,
      transformation,
      maxRetries: 5,
    })

    expect(result).toBe('foo 2')
    expect(validation).toHaveBeenCalledTimes(3)
    expect(validation).toHaveBeenNthCalledWith(1, 'foo')
    expect(validation).toHaveBeenNthCalledWith(2, 'foo 1')
    expect(validation).toHaveBeenNthCalledWith(3, 'foo 2')
  })
})
