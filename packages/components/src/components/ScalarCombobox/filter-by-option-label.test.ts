import { describe, expect, it } from 'vitest'

import { filterByOptionLabel } from '@/components/ScalarCombobox/filter-by-option-label'

describe('filter-by-option-label', () => {
  const options = [
    { id: '1', label: 'Apple' },
    { id: '2', label: 'Banana' },
    { id: '3', label: 'apricot' },
  ]

  it('returns all options when the query is empty', () => {
    expect(filterByOptionLabel('', options)).toStrictEqual(options)
  })

  it('filters labels case-insensitively', () => {
    expect(filterByOptionLabel('APPLE', options)).toStrictEqual([{ id: '1', label: 'Apple' }])
    expect(filterByOptionLabel('apricot', options)).toStrictEqual([{ id: '3', label: 'apricot' }])
  })

  it('matches substrings within labels', () => {
    expect(filterByOptionLabel('ana', options)).toStrictEqual([{ id: '2', label: 'Banana' }])
  })

  it('returns an empty array when nothing matches', () => {
    expect(filterByOptionLabel('xyz', options)).toStrictEqual([])
  })

  it('handles an empty option list', () => {
    expect(filterByOptionLabel('a', [])).toStrictEqual([])
  })
})
