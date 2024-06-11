import { describe, expect, it } from 'vitest'

import { normalizeMimeType } from './normalizeMimeType'

describe('normalizeMimeType', () => {
  it('removes charset', async () => {
    const content = 'application/json; charset=utf-8'

    expect(normalizeMimeType(content)).toBe('application/json')
  })

  it('removes semicolon', async () => {
    const content = 'application/json;'

    expect(normalizeMimeType(content)).toBe('application/json')
  })

  it('removes whitespace', async () => {
    const content = ' application/json '

    expect(normalizeMimeType(content)).toBe('application/json')
  })

  it('removes mimetype variants', async () => {
    const content = 'application/problem+json'

    expect(normalizeMimeType(content)).toBe('application/json')
  })

  it('removes mimetype variants with special characters', async () => {
    const content = 'application/vnd.api+json'

    expect(normalizeMimeType(content)).toBe('application/json')
  })

  it('removes all the clutter', async () => {
    const content = 'application/problem-foobar+json; charset=utf-8'

    expect(normalizeMimeType(content)).toBe('application/json')
  })
})
