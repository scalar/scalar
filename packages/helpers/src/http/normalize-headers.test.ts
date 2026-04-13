import { describe, expect, it } from 'vitest'

import { normalizeHeaders } from './normalize-headers'

describe('normalizeHeaders', () => {
  it('removes headers listed in `X-Scalar-Modified-Headers`', () => {
    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-Scalar-Modified-Headers': 'Content-Type',
    })

    const normalizedHeaders = normalizeHeaders(headers)

    expect(normalizedHeaders).toStrictEqual({})
  })

  it('sorts headers alphabetically', () => {
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    })

    const normalizedHeaders = normalizeHeaders(headers)

    expect(Object.keys(normalizedHeaders)).toStrictEqual(['Access-Control-Allow-Origin', 'Content-Type'])
  })

  it('restores original headers', () => {
    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-Scalar-Original-Content-Type': 'text/html',
    })

    const normalizedHeaders = normalizeHeaders(headers)

    expect(normalizedHeaders).toStrictEqual({
      'Content-Type': 'text/html',
    })
  })

  it('normalizes the header keys', () => {
    const headers = new Headers({
      'cOntent-tyPe': 'application/json',
    })

    const normalizedHeaders = normalizeHeaders(headers)

    expect(normalizedHeaders).toStrictEqual({
      'Content-Type': 'application/json',
    })
  })
})
