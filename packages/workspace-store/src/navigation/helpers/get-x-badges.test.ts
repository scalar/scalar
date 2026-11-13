import { describe, expect, it } from 'vitest'

import { getXBadges } from '@/navigation/helpers/get-x-badges'

describe('getXBadges', () => {
  it('returns the badges with their name, position and color', () => {
    expect(
      getXBadges({
        'x-badges': [
          { name: 'Beta', color: '#f59e0b' },
          { name: 'New', position: 'before' },
        ],
      }),
    ).toStrictEqual([
      { name: 'Beta', color: '#f59e0b' },
      { name: 'New', position: 'before' },
    ])
  })

  it('returns undefined when the object has no badges', () => {
    expect(getXBadges(undefined)).toBeUndefined()
    expect(getXBadges({})).toBeUndefined()
    expect(getXBadges({ 'x-badges': [] })).toBeUndefined()
  })

  it('returns undefined when x-badges is not an array', () => {
    expect(getXBadges({ 'x-badges': { name: 'Beta' } })).toBeUndefined()
    expect(getXBadges({ 'x-badges': 'Beta' })).toBeUndefined()
  })

  it('drops badges without a name and fields with an invalid value', () => {
    expect(
      getXBadges({
        'x-badges': [
          null,
          'Beta',
          { color: '#fff' },
          { name: '' },
          { name: 'Alpha', position: 'middle', color: 42, extra: true },
        ],
      }),
    ).toStrictEqual([{ name: 'Alpha' }])
  })
})
