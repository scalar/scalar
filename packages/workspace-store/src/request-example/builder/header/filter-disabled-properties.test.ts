import { describe, expect, it } from 'vitest'

import { filterDisabledProperties } from './filter-disabled-properties'

describe('filterDisabledProperties', () => {
  it('includes only explicitly enabled leaves when the parent starts disabled', () => {
    const value = { email: 'a', user: { address: { city: 'Paris', country: 'FR' } }, ids: ['1', '2'] }
    expect(filterDisabledProperties(value, { '["user","address","city"]': false }, true)).toStrictEqual({
      user: { address: { city: 'Paris' } },
    })
    expect(value).toStrictEqual({ email: 'a', user: { address: { city: 'Paris', country: 'FR' } }, ids: ['1', '2'] })
  })

  it('preserves arrays, falsy values, and literal dotted keys while pruning empty parents', () => {
    expect(
      filterDisabledProperties(
        { ids: [1, 2], count: 0, flag: false, 'a.b': 'literal', a: { b: 'nested' } },
        {
          '["a","b"]': true,
        },
        false,
      ),
    ).toStrictEqual({ ids: [1, 2], count: 0, flag: false, 'a.b': 'literal' })
  })

  it('omits an object when every field is disabled', () => {
    expect(filterDisabledProperties({ a: 1 }, { '["a"]': true }, false)).toBeUndefined()
  })
})
