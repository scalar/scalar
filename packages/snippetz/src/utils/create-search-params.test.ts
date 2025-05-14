import { describe, expect, it } from 'vitest'
import { createSearchParams } from './create-search-params'
import type { HarRequest } from '@scalar/types/snippetz'

describe('createSearchParams', () => {
  it('creates search params from empty query array', () => {
    const query: HarRequest['queryString'] = []
    const result = createSearchParams(query)
    expect(result.toString()).toBe('')
  })

  it('creates search params from single query parameter', () => {
    const query: HarRequest['queryString'] = [{ name: 'foo', value: 'bar' }]
    const result = createSearchParams(query)
    expect(result.toString()).toBe('foo=bar')
  })

  it('creates search params from multiple query parameters', () => {
    const query: HarRequest['queryString'] = [
      { name: 'foo', value: 'bar' },
      { name: 'baz', value: 'qux' },
    ]
    const result = createSearchParams(query)
    expect(result.toString()).toBe('foo=bar&baz=qux')
  })

  it('handles multiple parameters with the same name', () => {
    const query: HarRequest['queryString'] = [
      { name: 'foo', value: 'bar' },
      { name: 'foo', value: 'baz' },
    ]
    const result = createSearchParams(query)
    expect(result.toString()).toBe('foo=bar&foo=baz')
  })

  it('handles special characters in parameter names and values', () => {
    const query: HarRequest['queryString'] = [
      { name: 'special!@#', value: 'value!@#' },
      { name: 'space name', value: 'space value' },
    ]
    const result = createSearchParams(query)
    expect(result.toString()).toBe('special%21%40%23=value%21%40%23&space+name=space+value')
  })

  it('handles empty parameter values', () => {
    const query: HarRequest['queryString'] = [{ name: 'empty', value: '' }]
    const result = createSearchParams(query)
    expect(result.toString()).toBe('empty=')
  })

  it('handles URL-encoded values', () => {
    const query: HarRequest['queryString'] = [{ name: 'encoded', value: 'hello%20world' }]
    const result = createSearchParams(query)
    expect(result.toString()).toBe('encoded=hello%2520world')
  })
})
