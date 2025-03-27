import { describe, expect, it } from 'vitest'

import { normalizeMimeType } from './normalize-mime-type'

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

  it('removes unsupported mimetype variants', async () => {
    const content = 'application/problem+json'

    expect(normalizeMimeType(content)).toBe('application/json')
  })

  it('removes all the clutter', async () => {
    const content = 'application/problem-foobar+json; charset=utf-8'

    expect(normalizeMimeType(content)).toBe('application/json')
  })

  it('keeps vendor specific mimetypes', async () => {
    const content = 'application/vnd.api+json'

    expect(normalizeMimeType(content)).toBe('application/vnd.api+json')
  })

  it('removes all the clutter but keeps vendor specific part', async () => {
    const content = 'application/fhir+json; charset=utf-8'

    expect(normalizeMimeType(content)).toBe('application/fhir+json')
  })
})
