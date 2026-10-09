import { describe, expect, it } from 'vitest'

import { isJsonMediaType } from './is-json-media-type'

describe('is-json-media-type', () => {
  it.each(['application/json', 'Application/Problem+JSON; charset=utf-8', 'text/json'])('recognizes %s', (value) => {
    expect(isJsonMediaType(value)).toBe(true)
  })
  it.each([undefined, '', 'application/json-seq', 'text/plain', 'invalid'])('rejects %s', (value) => {
    expect(isJsonMediaType(value)).toBe(false)
  })
})
