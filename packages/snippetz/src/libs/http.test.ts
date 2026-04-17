import type { HarRequest } from '@scalar/types/snippetz'
import { describe, expect, it } from 'vitest'

import { accumulateRepeatedValue, buildQueryString, collectHeaders, joinUrlAndQuery, normalizeMethod, normalizeUrl, reduceQueryParams } from './http'

describe('buildQueryString', () => {
  it('returns empty string for undefined query params', () => {
    expect(buildQueryString(undefined)).toBe('')
  })

  it('returns empty string for empty array', () => {
    expect(buildQueryString([])).toBe('')
  })

  it('builds query string from single parameter', () => {
    const queryParams = [{ name: 'foo', value: 'bar' }]
    expect(buildQueryString(queryParams)).toBe('?foo=bar')
  })

  it('builds query string from multiple parameters', () => {
    const queryParams = [
      { name: 'foo', value: 'bar' },
      { name: 'baz', value: 'qux' },
    ]
    expect(buildQueryString(queryParams)).toBe('?foo=bar&baz=qux')
  })

  it('handles repeated parameters by converting to array format', () => {
    const queryParams = [
      { name: 'tags', value: 'one' },
      { name: 'tags', value: 'two' },
    ]
    expect(buildQueryString(queryParams)).toBe('?tags=one&tags=two')
  })

  it('handles mixed unique and repeated parameters', () => {
    const queryParams = [
      { name: 'limit', value: '10' },
      { name: 'tags', value: 'one' },
      { name: 'tags', value: 'two' },
    ]
    expect(buildQueryString(queryParams)).toBe('?limit=10&tags=one&tags=two')
  })

  it('handles parameters with empty values', () => {
    const queryParams = [{ name: 'empty', value: '' }]
    expect(buildQueryString(queryParams)).toBe('?empty=')
  })

  it('handles parameters with special characters in values', () => {
    const queryParams = [{ name: 'query', value: 'hello%20world' }]
    expect(buildQueryString(queryParams)).toBe('?query=hello%20world')
  })
})

describe('reduceQueryParams', () => {
  it('reduces unique query parameters to strings', () => {
    const query: HarRequest['queryString'] = [
      { name: 'foo', value: 'bar' },
      { name: 'baz', value: 'qux' },
    ]

    expect(reduceQueryParams(query)).toEqual({
      foo: 'bar',
      baz: 'qux',
    })
  })

  it('preserves repeated query parameters as arrays', () => {
    const query: HarRequest['queryString'] = [
      { name: 'statuses', value: 'active' },
      { name: 'statuses', value: 'inactive' },
    ]

    expect(reduceQueryParams(query)).toEqual({
      statuses: ['active', 'inactive'],
    })
  })
})

describe('accumulateRepeatedValue', () => {
  it('accumulates values for duplicate names', () => {
    const data: Record<string, string | string[]> = {}

    accumulateRepeatedValue(data, 'statuses', 'active')
    accumulateRepeatedValue(data, 'statuses', 'inactive')
    accumulateRepeatedValue(data, 'statuses', 'pending')

    expect(data).toEqual({
      statuses: ['active', 'inactive', 'pending'],
    })
  })
})

describe('normalizeMethod', () => {
  it('uppercases an explicit method', () => {
    expect(normalizeMethod('post')).toBe('POST')
  })

  it('defaults to GET when method is missing', () => {
    expect(normalizeMethod(undefined)).toBe('GET')
  })
})

describe('normalizeUrl', () => {
  it('keeps origin-only URLs without a trailing slash', () => {
    expect(normalizeUrl('https://example.com')).toBe('https://example.com')
  })

  it('returns malformed URLs unchanged', () => {
    expect(normalizeUrl('not a valid url')).toBe('not a valid url')
  })
})

describe('joinUrlAndQuery', () => {
  it('appends a query string to a URL without existing params', () => {
    expect(joinUrlAndQuery('https://example.com', [{ name: 'foo', value: 'bar' }])).toBe('https://example.com?foo=bar')
  })

  it('appends query parameters to URLs with existing params', () => {
    expect(joinUrlAndQuery('https://example.com?existing=true', [{ name: 'foo', value: 'bar' }])).toBe(
      'https://example.com?existing=true&foo=bar',
    )
  })
})

describe('collectHeaders', () => {
  it('deduplicates headers by name while preserving last value', () => {
    expect(
      collectHeaders([
        { name: 'X-Test', value: 'first' },
        { name: 'X-Test', value: 'second' },
      ]),
    ).toStrictEqual([{ name: 'X-Test', value: 'second' }])
  })

  it('adds encoded cookie headers when provided', () => {
    expect(
      collectHeaders(undefined, [
        { name: 'session id', value: 'a b' },
        { name: 'plain', value: 'value' },
      ]),
    ).toStrictEqual([{ name: 'Cookie', value: 'session%20id=a%20b; plain=value' }])
  })
})
