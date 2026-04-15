import { describe, expect, it } from 'vitest'

import { isObjectEqual } from './is-object-equal'

describe('isObjectEqual', () => {
  it('uses Object.is semantics for primitive edge cases', () => {
    expect(isObjectEqual(Number.NaN, Number.NaN)).toBe(true)
    expect(isObjectEqual(0, -0)).toBe(false)
  })

  it('returns false for different primitive values', () => {
    expect(isObjectEqual('1', 1)).toBe(false)
    expect(isObjectEqual(true, false)).toBe(false)
  })

  it('returns true for deeply equal nested objects', () => {
    const left = {
      id: 'user-1',
      profile: {
        name: 'Alice',
        tags: ['admin', 'editor'],
        meta: { active: true, retries: 0 },
      },
    }
    const right = {
      id: 'user-1',
      profile: {
        name: 'Alice',
        tags: ['admin', 'editor'],
        meta: { active: true, retries: 0 },
      },
    }

    expect(isObjectEqual(left, right)).toBe(true)
  })

  it('returns false when a nested object value differs', () => {
    const left = {
      profile: {
        meta: { active: true },
      },
    }
    const right = {
      profile: {
        meta: { active: false },
      },
    }

    expect(isObjectEqual(left, right)).toBe(false)
  })

  it('returns true for deeply equal arrays with nested values', () => {
    const left = [1, { flags: [true, false] }, ['x', 'y']]
    const right = [1, { flags: [true, false] }, ['x', 'y']]

    expect(isObjectEqual(left, right)).toBe(true)
  })

  it('returns false for arrays with different lengths or ordering', () => {
    expect(isObjectEqual([1, 2, 3], [1, 2])).toBe(false)
    expect(isObjectEqual([1, 2, 3], [3, 2, 1])).toBe(false)
  })

  it('returns false when comparing an array to an object', () => {
    expect(isObjectEqual([1, 2], { 0: 1, 1: 2, length: 2 })).toBe(false)
  })

  it('ignores inherited properties when checking equality', () => {
    const proto = { inherited: 'value' }
    const left = Object.create(proto) as Record<string, unknown>
    const right = Object.create(proto) as Record<string, unknown>

    left.own = 'same'
    right.own = 'same'

    expect(isObjectEqual(left, right)).toBe(true)
  })

  it('detects own-key count differences even when inherited values match', () => {
    const proto = { role: 'admin' }
    const left = { role: 'admin' }
    const right = Object.create(proto)

    expect(isObjectEqual(left, right)).toBe(false)
  })

  it('treats Date instances as equal when they have no own enumerable properties', () => {
    const left = new Date('2020-01-01T00:00:00.000Z')
    const right = new Date('2030-01-01T00:00:00.000Z')

    expect(isObjectEqual(left, right)).toBe(true)
  })
})
