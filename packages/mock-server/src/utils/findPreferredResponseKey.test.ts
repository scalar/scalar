import { describe, expect, it } from 'vitest'

import { findPreferredResponseKey } from './findPreferredResponseKey'

describe('findPreferredResponseKey', () => {
  it('returns default over 200', () => {
    expect(findPreferredResponseKey(['default', '200'])).toBe('default')
  })

  it('returns 201 if it’s the only one', () => {
    expect(findPreferredResponseKey(['201'])).toBe('201')
  })

  it('returns 201 over 200 or default', () => {
    expect(findPreferredResponseKey(['default', '200', '201'])).toBe('201')
  })
})
