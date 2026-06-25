import { describe, expect, it } from 'vitest'

import { mergeObjects } from './merge-objects'

describe('mergeObjects', () => {
  it('merges nested objects recursively', () => {
    expect(mergeObjects({ a: { x: 1, y: 2 } }, { a: { y: 3 } })).toEqual({ a: { x: 1, y: 3 } })
  })

  it('skips undefined override values so the base is preserved', () => {
    expect(mergeObjects({ a: 1, b: 2 }, { a: undefined })).toEqual({ a: 1, b: 2 })
  })

  it('replaces non-object values, including arrays, instead of merging them', () => {
    expect(mergeObjects({ a: [1, 2] }, { a: [3] })).toEqual({ a: [3] })
  })

  it('returns a copy of the base when the override is missing or not a plain object', () => {
    const base = { a: 1 }

    expect(mergeObjects(base)).toEqual({ a: 1 })
    expect(mergeObjects(base)).not.toBe(base)
    expect(mergeObjects(base, 42 as unknown)).toEqual({ a: 1 })
  })

  it('does not mutate the base', () => {
    const base = { a: { x: 1 } }

    mergeObjects(base, { a: { x: 2 } })

    expect(base).toEqual({ a: { x: 1 } })
  })
})
