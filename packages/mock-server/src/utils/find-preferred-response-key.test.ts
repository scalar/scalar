import { describe, expect, it } from 'vitest'

import { findPreferredResponseKey } from './find-preferred-response-key'

describe('findPreferredResponseKey', () => {
  it('returns default over 200', () => {
    expect(findPreferredResponseKey(['default', '200'])).toBe('default')
  })

  it('returns default over other success responses', () => {
    expect(findPreferredResponseKey(['default', '202'])).toBe('default')
  })

  it(`returns 201 if it's the only one`, () => {
    expect(findPreferredResponseKey(['201'])).toBe('201')
  })

  it('returns 200 over 201', () => {
    expect(findPreferredResponseKey(['200', '201'])).toBe('200')
  })

  it('returns a 2xx response over an error response', () => {
    expect(findPreferredResponseKey(['202', '404'])).toBe('202')
  })

  it('returns the lowest 2xx response when multiple success responses are defined', () => {
    expect(findPreferredResponseKey(['206', '202', '204'])).toBe('202')
  })

  it('returns the lowest status code when no success response is defined', () => {
    expect(findPreferredResponseKey(['500', '404'])).toBe('404')
  })

  it(`uses what's there`, () => {
    expect(findPreferredResponseKey(['301'])).toBe('301')
  })

  it(`doesn't return anything if there's no key at all`, () => {
    expect(findPreferredResponseKey([])).toBe(undefined)
  })
})
