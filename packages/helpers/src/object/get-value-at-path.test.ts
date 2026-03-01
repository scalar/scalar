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

  it('returns the original value when segments are empty', () => {
    const target = { foo: 'bar' }

    expect(getValueAtPath(target, [])).toEqual(target)
  })
})
