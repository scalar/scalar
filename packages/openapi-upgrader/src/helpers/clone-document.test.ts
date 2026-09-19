import { assert, describe, expect, it } from 'vitest'

import { cloneDocument } from './clone-document'

describe('clone-document', () => {
  it('permits alias expansion below the copied-entry floor', () => {
    const shared = Array.from({ length: 10 }, () => 'value')
    const input = { values: Array.from({ length: 8000 }, () => shared) }
    const result = cloneDocument(input)
    expect(result).toStrictEqual(input)
    assert(Array.isArray(result.values))
    expect(result.values[0]).not.toBe(result.values[1])
  })

  it('permits large input that stays within tenfold alias expansion', () => {
    const shared = Array.from({ length: 10_000 }, () => 'value')
    const input = { values: Array.from({ length: 10 }, () => shared) }
    expect(cloneDocument(input)).toStrictEqual(input)
  })

  it('rejects expansion only after exceeding both allocation limits', () => {
    const shared = Array.from({ length: 10_000 }, () => 'value')
    const input = { values: Array.from({ length: 11 }, () => shared) }
    expect(() => cloneDocument(input)).toThrow('excessive YAML alias expansion')
    expect(input.values[0]).toBe(shared)
  })
})
