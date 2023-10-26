import { describe, expect, it } from 'vitest'

import type { TransformedOperation } from '../types'
import { getHarRequest } from './getHarRequest'

describe('getHarRequest', () => {
  it('transforms a basic operation', () => {
    const request = getHarRequest({
      url: 'https://example.com',
      operation: {
        httpVerb: 'GET',
        path: '/foobar',
      } as TransformedOperation,
    })

    expect(request).toMatchObject({
      method: 'GET',
      url: 'https://example.com/foobar',
      headers: [],
    })
  })

  it('adds headers', () => {
    const request = getHarRequest({
      url: 'https://example.com',
      headers: [
        {
          name: 'Authorization',
          value: 'Bearer 123',
        },
      ],
      operation: {
        httpVerb: 'GET',
        path: '/foobar',
      } as TransformedOperation,
    })

    expect(request).toMatchObject({
      method: 'GET',
      url: 'https://example.com/foobar',
      headers: [
        {
          name: 'Authorization',
          value: 'Bearer 123',
        },
      ],
    })
  })

  it('adds query parameters', () => {
    const request = getHarRequest({
      url: 'https://example.com',
      queryString: [
        {
          name: 'api_key',
          value: '123',
        },
      ],
      operation: {
        httpVerb: 'GET',
        path: '/foobar',
      } as TransformedOperation,
    })

    expect(request).toMatchObject({
      method: 'GET',
      url: 'https://example.com/foobar',
      queryString: [
        {
          name: 'api_key',
          value: '123',
        },
      ],
    })
  })
})
