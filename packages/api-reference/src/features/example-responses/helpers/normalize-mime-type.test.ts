import { describe, expect, it } from 'vitest'

import { normalizeMimeType } from './normalize-mime-type'

describe('normalizeMimeType', () => {
  it('removes charset', () => {
    const content = 'application/json; charset=utf-8'

    expect(normalizeMimeType(content)).toBe('application/json')
  })

  it('removes semicolon', () => {
    const content = 'application/json;'

    expect(normalizeMimeType(content)).toBe('application/json')
  })

  it('removes whitespace', () => {
    const content = ' application/json '

    expect(normalizeMimeType(content)).toBe('application/json')
  })

  it('removes unsupported mimetype variants', () => {
    const content = 'application/problem+json'

    expect(normalizeMimeType(content)).toBe('application/json')
  })

  it('removes all the clutter', () => {
    const content = 'application/problem-foobar+json; charset=utf-8'

    expect(normalizeMimeType(content)).toBe('application/json')
  })

  it('keeps vendor specific mimetypes', () => {
    const content = 'application/vnd.api+json'

    expect(normalizeMimeType(content)).toBe('application/vnd.api+json')
  })

  it('removes all the clutter but keeps vendor specific part', () => {
    const content = 'application/fhir+json; charset=utf-8'

    expect(normalizeMimeType(content)).toBe('application/fhir+json')
  })
})
