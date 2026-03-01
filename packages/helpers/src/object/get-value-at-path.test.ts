import { describe, expect, it } from 'vitest'

import { getValueAtPath } from './get-value-at-path'

describe('getValueAtPath', () => {
  it('returns nested values from objects', () => {
    const target = {
      components: {
        schemas: {
          User: { type: 'object' },
        },
      },
    }

    expect(getValueAtPath(target, ['components', 'schemas', 'User'])).toEqual({ type: 'object' })
  })

  it('returns nested values from arrays using numeric segments', () => {
    const target = {
      items: [{ id: 'first' }, { id: 'second' }],
    }

    expect(getValueAtPath(target, ['items', '1', 'id'])).toBe('second')
  })

  it('returns undefined when a segment does not exist', () => {
    const target = { foo: { bar: 'baz' } }

    expect(getValueAtPath(target, ['foo', 'missing'])).toBeUndefined()
  })

  it('returns undefined when traversing through null', () => {
    const target = {
      foo: null,
    }

    expect(getValueAtPath(target, ['foo', 'bar'])).toBeUndefined()
  })

  it('returns undefined when traversing through undefined', () => {
    const target = {
      foo: undefined as { bar: string } | undefined,
    }

    expect(getValueAtPath(target, ['foo', 'bar'])).toBeUndefined()
  })

  it('returns undefined for out-of-bounds array access', () => {
    const target = {
      items: [{ id: 'first' }],
    }

    expect(getValueAtPath(target, ['items', '4', 'id'])).toBeUndefined()
  })

  it('returns undefined when root object is null', () => {
    expect(getValueAtPath(null, ['foo'])).toBeUndefined()
  })

  it('returns undefined when root object is undefined', () => {
    expect(getValueAtPath(undefined, ['foo'])).toBeUndefined()
  })

  it('returns falsy leaf values as-is', () => {
    const target = {
      values: {
        zero: 0,
        empty: '',
        bool: false,
      },
    }

    expect(getValueAtPath(target, ['values', 'zero'])).toBe(0)
    expect(getValueAtPath(target, ['values', 'empty'])).toBe('')
    expect(getValueAtPath(target, ['values', 'bool'])).toBe(false)
  })

  it('returns the original value when segments are empty', () => {
    const target = { foo: 'bar' }

    expect(getValueAtPath(target, [])).toEqual(target)
  })
})
