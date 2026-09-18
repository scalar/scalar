import { describe, expect, it } from 'vitest'

import { isForbiddenHttpMethod } from './is-forbidden-http-method'

describe('is-forbidden-http-method', () => {
  it.each(['CONNECT', 'Trace', 'track'])('rejects %s independently of body support', (method) => {
    expect(isForbiddenHttpMethod(method)).toBe(true)
  })
  it.each(['GET', 'POST', 'QUERY', 'PROPFIND'])('allows %s', (method) => {
    expect(isForbiddenHttpMethod(method)).toBe(false)
  })
})
