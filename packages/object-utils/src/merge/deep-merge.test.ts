import { describe, expect, it } from 'vitest'

import { deepMerge } from './deep-merge'

describe('deep-merge', () => {
  it.each(['toString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString'])(
    'ignores an untrusted %s property at each merged object level',
    (key) => {
      const input: Record<string, unknown> = {
        [key]: null,
        nested: { [key]: null, value: 'retained' },
      }

      const result = deepMerge<Record<string, unknown>, Record<string, unknown>>({}, input)

      expect(result).toStrictEqual({ nested: { value: 'retained' } })
      expect(String(result)).toBe('[object Object]')
      expect(String(result.nested)).toBe('[object Object]')
    },
  )

  it('merges nested settings and deduplicates arrays without changing its inputs', () => {
    const target: { settings: Record<string, unknown>; tags: string[] } = {
      settings: { timeout: 1000, retries: 1 },
      tags: ['existing'],
    }
    const update = { settings: { retries: 2 }, tags: ['existing', 'new'] }

    expect(deepMerge(target, update)).toStrictEqual({
      settings: { timeout: 1000, retries: 2 },
      tags: ['existing', 'new'],
    })
    expect(target).toStrictEqual({ settings: { timeout: 1000, retries: 1 }, tags: ['existing'] })
    expect(update).toStrictEqual({ settings: { retries: 2 }, tags: ['existing', 'new'] })
  })

  it('preserves explicit undefined overrides', () => {
    const target: { value: string | undefined } = { value: 'initial' }

    expect(deepMerge(target, { value: undefined })).toStrictEqual({ value: undefined })
  })
})
