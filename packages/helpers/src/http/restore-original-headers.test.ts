import { describe, expect, it } from 'vitest'

import { restoreOriginalHeaders } from './restore-original-headers'

describe('restore-original-headers', () => {
  it('replaces headers set by the proxy with the upstream values', () => {
    const headers = new Headers({
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'X-Scalar-Modified-Headers': 'Content-Security-Policy, X-Content-Type-Options',
      'X-Scalar-Original-Content-Security-Policy': "default-src 'self'",
      'X-Scalar-Original-Refresh': '5',
    })

    expect(Object.fromEntries(restoreOriginalHeaders(headers))).toStrictEqual({
      'content-security-policy': "default-src 'self'",
      'content-type': 'application/json',
      'refresh': '5',
    })
  })

  it('hides headers the proxy added when the API did not send them', () => {
    const headers = new Headers({
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'X-Scalar-Modified-Headers': 'Content-Security-Policy, X-Content-Type-Options',
    })

    expect(Object.fromEntries(restoreOriginalHeaders(headers))).toStrictEqual({
      'content-type': 'application/json',
    })
  })

  it('keeps every other header, including other X-Scalar-* headers', () => {
    const headers = new Headers({
      'Access-Control-Allow-Origin': '*',
      'X-Request-Id': 'req-123',
      'X-Scalar-Set-Cookie': 'session=abc',
    })

    expect(Object.fromEntries(restoreOriginalHeaders(headers))).toStrictEqual({
      'access-control-allow-origin': '*',
      'x-request-id': 'req-123',
      'x-scalar-set-cookie': 'session=abc',
    })
  })

  it('ignores an original header without a name', () => {
    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-Scalar-Original-': 'broken',
    })

    expect(Object.fromEntries(restoreOriginalHeaders(headers))).toStrictEqual({
      'content-type': 'application/json',
    })
  })

  it('restores empty upstream headers instead of dropping them', () => {
    const headers = new Headers({
      'Cache-Control': 'private',
      'X-Scalar-Modified-Headers': 'Cache-Control',
      'X-Scalar-Original-Cache-Control': '',
      'X-Scalar-Original-Refresh': '',
    })

    expect(Object.fromEntries(restoreOriginalHeaders(headers))).toStrictEqual({
      'cache-control': '',
      'refresh': '',
    })
  })

  it('does not change the headers it was given', () => {
    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-Scalar-Modified-Headers': 'Content-Type',
    })

    restoreOriginalHeaders(headers)

    expect(headers.get('content-type')).toBe('application/json')
  })
})
