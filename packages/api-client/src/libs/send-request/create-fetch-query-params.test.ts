import type { RequestExample } from '@scalar/oas-utils/entities/spec'
import { describe, expect, it } from 'vitest'

import { createFetchQueryParams } from './create-fetch-query-params'

describe('createFetchQueryParams', () => {
  it('creates query paramer from an example', () => {
    const requestExample: Pick<RequestExample, 'parameters'> = {
      parameters: {
        headers: [],
        path: [],
        cookies: [],
        query: [
          { key: 'page', value: '1', enabled: true },
          { key: 'limit', value: '10', enabled: true },
          { key: 'search', value: 'John', enabled: true },
        ],
      },
    }

    const result = createFetchQueryParams(requestExample, {})

    expect(result.toString()).toEqual('page=1&limit=10&search=John')
  })

  it('handles array parameters (same name multiple times)', () => {
    const requestExample: Pick<RequestExample, 'parameters'> = {
      parameters: {
        headers: [],
        path: [],
        cookies: [],
        query: [
          { key: 'color', value: 'red', enabled: true },
          { key: 'color', value: 'blue', enabled: true },
          { key: 'size', value: 'large', enabled: true },
        ],
      },
    }

    const result = createFetchQueryParams(requestExample, {})

    expect(result.toString()).toEqual('color=red&color=blue&size=large')
  })

  it('returns empty URLSearchParams when no query parameters are provided', () => {
    const requestExample: Pick<RequestExample, 'parameters'> = {
      parameters: {
        headers: [],
        path: [],
        cookies: [],
        query: [],
      },
    }

    const result = createFetchQueryParams(requestExample, {})

    expect(result.toString()).toEqual('')
    expect(result).toBeInstanceOf(URLSearchParams)
    expect([...result.entries()]).toHaveLength(0)
  })

  it('handles query parameters for array type value', () => {
    const requestExample: Pick<RequestExample, 'parameters'> = {
      parameters: {
        headers: [],
        path: [],
        cookies: [],
        query: [
          { key: 'key', value: 'one, two', enabled: true, type: 'array' },
        ],
      },
    }

    const result = createFetchQueryParams(requestExample, {})

    expect(result.toString()).toEqual('key=one&key=two')
  })
})
