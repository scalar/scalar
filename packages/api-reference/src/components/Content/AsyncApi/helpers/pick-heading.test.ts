import { describe, expect, it } from 'vitest'

import { pickHeading } from './pick-heading'

describe('pickHeading', () => {
  it('returns the first non-empty candidate', () => {
    expect(pickHeading('Title', 'Fallback')).toBe('Title')
  })

  it('skips empty and whitespace-only candidates', () => {
    expect(pickHeading(undefined, '', '   ', 'Address')).toBe('Address')
  })

  it('trims the chosen candidate', () => {
    expect(pickHeading('  Padded  ')).toBe('Padded')
  })

  it('returns an empty string when every candidate is blank', () => {
    expect(pickHeading(undefined, '', '  ')).toBe('')
  })
})
