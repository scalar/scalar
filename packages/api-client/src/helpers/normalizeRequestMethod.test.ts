import { describe, expect, it } from 'vitest'

import { normalizeRequestMethod } from './normalizeRequestMethod'

describe('normalizeRequestMethod', () => {
  it('returns a valid request method', async () => {
    expect(normalizeRequestMethod('GET')).toBe('GET')
  })

  it('makes method uppercase', async () => {
    expect(normalizeRequestMethod('get')).toBe('GET')
  })

  it('return uppercase POST', async () => {
    expect(normalizeRequestMethod('post')).toBe('POST')
  })

  it('trims whitespace', async () => {
    expect(normalizeRequestMethod('post ')).toBe('POST')
  })

  it('uses GET as the default', async () => {
    expect(normalizeRequestMethod()).toBe('GET')
  })

  it('ignores invalid request methods', async () => {
    expect(normalizeRequestMethod('fantasy')).toBe('GET')
  })
})
