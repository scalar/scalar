import { describe, expect, it } from 'vitest'
import { omitUndefinedValues } from './omit-undefined-values'

describe('omitUndefinedValues', () => {
  it('removes undefined values from flat objects', () => {
    const input = {
      name: 'test',
      description: undefined,
      value: 123,
      empty: undefined,
    }

    const result = omitUndefinedValues(input)

    expect(result).toEqual({
      name: 'test',
      value: 123,
    })
  })

  it('preserves null values', () => {
    const input = {
      name: 'test',
      description: null,
      value: undefined,
    }

    const result = omitUndefinedValues(input)

    expect(result).toEqual({
      name: 'test',
      description: null,
    })
  })

  it('handles nested objects', () => {
    const input = {
      name: 'test',
      metadata: {
        description: undefined,
        tags: ['a', 'b'],
        settings: {
          enabled: true,
          config: undefined,
        },
      },
    }

    const result = omitUndefinedValues(input)

    expect(result).toEqual({
      name: 'test',
      metadata: {
        tags: ['a', 'b'],
        settings: {
          enabled: true,
        },
      },
    })
  })

  it('handles empty objects', () => {
    const input = {}

    const result = omitUndefinedValues(input)

    expect(result).toEqual({})
  })

  it('preserves arrays', () => {
    const input = {
      items: [
        { id: 1, name: 'first', description: undefined },
        { id: 2, name: 'second', value: undefined },
      ],
    }

    const result = omitUndefinedValues(input)

    expect(result).toEqual({
      items: [
        { id: 1, name: 'first' },
        { id: 2, name: 'second' },
      ],
    })
  })

  it('preserves falsy values except undefined', () => {
    const input = {
      zero: 0,
      empty: '',
      falsy: false,
      nullish: null,
      notDefined: undefined,
    }

    const result = omitUndefinedValues(input)

    expect(result).toEqual({
      zero: 0,
      empty: '',
      falsy: false,
      nullish: null,
    })
  })
})
