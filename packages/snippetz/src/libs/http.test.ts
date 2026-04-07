import type { HarRequest } from '@scalar/types/snippetz'
import { describe, expect, it } from 'vitest'

import { accumulateRepeatedValue, buildQueryString, reduceQueryParams } from './http'

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
    expect(buildQueryString(queryParams)).toBe('?tags=one,two')
  })

  it('handles mixed unique and repeated parameters', () => {
    const queryParams = [
      { name: 'limit', value: '10' },
      { name: 'tags', value: 'one' },
      { name: 'tags', value: 'two' },
    ]
    expect(buildQueryString(queryParams)).toBe('?limit=10&tags=one,two')
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
