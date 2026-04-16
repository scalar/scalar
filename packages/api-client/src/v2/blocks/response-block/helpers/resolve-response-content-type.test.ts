import { describe, expect, it } from 'vitest'

import {
  DEFAULT_RESPONSE_CONTENT_TYPE,
  resolveResponseContentType,
  resolveResponseMimeType,
} from './resolve-response-content-type'

describe('resolveResponseContentType', () => {
  it('returns the provided content type when present', () => {
    const contentType = 'application/json; charset=utf-8'
    expect(resolveResponseContentType(contentType)).toBe(contentType)
  })

  it('falls back to text/plain when content type is missing', () => {
    expect(resolveResponseContentType(undefined)).toBe(DEFAULT_RESPONSE_CONTENT_TYPE)
    expect(resolveResponseContentType(null)).toBe(DEFAULT_RESPONSE_CONTENT_TYPE)
  })

  it('resolves the fallback MIME essence when content type is missing', () => {
    expect(resolveResponseMimeType(undefined).essence).toBe('text/plain')
  })
})
