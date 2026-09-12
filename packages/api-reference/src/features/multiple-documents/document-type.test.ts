import { describe, expect, it } from 'vitest'

import { guessDocumentTypeFromUrl } from './document-type'

describe('guessDocumentTypeFromUrl', () => {
  it('returns undefined when the url is undefined', () => {
    expect(guessDocumentTypeFromUrl(undefined)).toBeUndefined()
  })

  it('returns undefined for an empty string', () => {
    expect(guessDocumentTypeFromUrl('')).toBeUndefined()
  })

  it('detects asyncapi from the url', () => {
    expect(guessDocumentTypeFromUrl('https://example.com/asyncapi.yaml')).toBe('asyncapi')
  })

  it('detects openapi from the url', () => {
    expect(guessDocumentTypeFromUrl('https://example.com/openapi.json')).toBe('openapi')
  })

  it('detects openapi from a swagger url', () => {
    expect(guessDocumentTypeFromUrl('https://example.com/swagger.json')).toBe('openapi')
  })

  it('is case insensitive', () => {
    expect(guessDocumentTypeFromUrl('https://example.com/AsyncAPI.YAML')).toBe('asyncapi')
    expect(guessDocumentTypeFromUrl('https://example.com/OpenAPI.JSON')).toBe('openapi')
  })

  it('prefers asyncapi when both hints are present', () => {
    expect(guessDocumentTypeFromUrl('https://example.com/asyncapi/openapi.json')).toBe('asyncapi')
  })

  it('returns undefined when the url has no type hint', () => {
    expect(guessDocumentTypeFromUrl('https://example.com/petstore-3.0.json')).toBeUndefined()
  })
})
