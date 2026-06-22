import { describe, expect, it } from 'vitest'

import { findPreferredResponseKey } from './find-preferred-response-key'

describe('findPreferredResponseKey', () => {
  it('prefers a defined 2xx success over default', () => {
    expect(findPreferredResponseKey(['default', '200'])).toBe('200')
  })

  it('prefers a concrete error response over default', () => {
    expect(findPreferredResponseKey(['default', '404'])).toBe('404')
  })

  it('falls back to default when only informational responses are defined alongside it', () => {
    expect(findPreferredResponseKey(['default', '100'])).toBe('default')
  })

  it('uses default when it is the only response', () => {
    expect(findPreferredResponseKey(['default'])).toBe('default')
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

  it('ignores informational 1xx responses when other codes are defined', () => {
    expect(findPreferredResponseKey(['100', '404'])).toBe('404')
  })

  it('prefers a 2xx success over an informational 1xx response', () => {
    expect(findPreferredResponseKey(['100', '200'])).toBe('200')
  })

  it('falls back to a 1xx response when nothing else is defined', () => {
    expect(findPreferredResponseKey(['100'])).toBe('100')
  })

  it('treats a 2XX range as a success response', () => {
    expect(findPreferredResponseKey(['2XX', '404'])).toBe('2XX')
  })

  it('prefers an explicit 2xx code over a 2XX range', () => {
    expect(findPreferredResponseKey(['2XX', '200'])).toBe('200')
  })

  it('prefers an explicit 2xx code over a 2XX range even when the code is higher', () => {
    expect(findPreferredResponseKey(['2XX', '201'])).toBe('201')
  })

  it('prefers an explicit error code over a 4XX range', () => {
    expect(findPreferredResponseKey(['4XX', '404'])).toBe('404')
  })

  it('returns undefined when only non-status keys are defined', () => {
    expect(findPreferredResponseKey(['x-extension'])).toBe(undefined)
  })

  it('ignores a 1XX range when other codes are defined', () => {
    expect(findPreferredResponseKey(['1XX', '500'])).toBe('500')
  })

  it('orders range patterns by their lowest member', () => {
    expect(findPreferredResponseKey(['5XX', '4XX'])).toBe('4XX')
  })

  it(`uses what's there`, () => {
    expect(findPreferredResponseKey(['301'])).toBe('301')
  })

  it(`doesn't return anything if there's no key at all`, () => {
    expect(findPreferredResponseKey([])).toBe(undefined)
  })
})
