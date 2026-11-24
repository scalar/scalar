import { parseMimeType } from '@scalar/helpers/http/mime-type'
import { describe, expect, it } from 'vitest'

import { isJsonContentType } from './is-json-content-type'

describe('is-json-content-type', () => {
  it.each([
    'application/json',
    'Application/JSON',
    'application/json; charset=utf-8',
    'application/vnd.api+json',
    'application/merge-patch+json',
  ])('treats %s as JSON', (contentType) => {
    expect(isJsonContentType(parseMimeType(contentType))).toBe(true)
  })

  it.each([
    'text/plain',
    'text/json',
    'application/x-www-form-urlencoded',
    'application/json-seq',
    'multipart/form-data',
  ])('does not treat %s as JSON', (contentType) => {
    expect(isJsonContentType(parseMimeType(contentType))).toBe(false)
  })
})
