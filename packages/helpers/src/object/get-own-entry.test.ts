import { describe, expect, it } from 'vitest'

import { getOwnEntry } from './get-own-entry'

describe('get-own-entry', () => {
  it('returns the value of an own entry', () => {
    expect(getOwnEntry({ toString: 'document' }, 'toString')).toBe('document')
  })

  it('ignores inherited entries', () => {
    const record: Record<string, string> = {}

    expect(getOwnEntry(record, 'toString')).toBeUndefined()
    expect(getOwnEntry(record, '__proto__')).toBeUndefined()
  })

  it('returns undefined for a missing entry', () => {
    const record: Record<string, string> = {}

    expect(getOwnEntry(record, 'missing')).toBeUndefined()
  })

  it('returns undefined when the record is absent', () => {
    expect(getOwnEntry<Record<string, string>, string>(undefined, 'missing')).toBeUndefined()
  })
})
