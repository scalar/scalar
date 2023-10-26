import { describe, expect, it } from 'vitest'

import { getHarRequest } from './getHarRequest'

describe('getHarRequest', () => {
  it('creates a basic HAR request', () => {
    const request = getHarRequest({
      url: 'https://example.com',
      path: '/foobar',
    })

    expect(request).toMatchObject({
      url: 'https://example.com/foobar',
    })
  })

  it('merges two HAR requests', () => {
    const request = getHarRequest(
      {
        url: 'https://example.com',
      },
      {
        path: '/foobar',
      },
    )

    expect(request).toMatchObject({
      url: 'https://example.com/foobar',
    })
  })

  it('merges headers', () => {
    const request = getHarRequest(
      {
        url: 'https://example.com',
        headers: [
          {
            name: 'Content-Type',
            value: 'application/json',
          },
        ],
      },
      {
        headers: [
          {
            name: 'X-Custom',
            value: 'foobar',
          },
        ],
      },
    )

    expect(request).toMatchObject({
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
        {
          name: 'X-Custom',
          value: 'foobar',
        },
      ],
    })
  })

  it('merges query strings', () => {
    const request = getHarRequest(
      {
        url: 'https://example.com',
        queryString: [
          {
            name: 'foo',
            value: 'bar',
          },
        ],
      },
      {
        queryString: [
          {
            name: 'custom',
            value: 'value',
          },
        ],
      },
    )

    expect(request).toMatchObject({
      url: 'https://example.com',
      queryString: [
        {
          name: 'foo',
          value: 'bar',
        },
        {
          name: 'custom',
          value: 'value',
        },
      ],
    })
  })

  it('merges cookies', () => {
    const request = getHarRequest(
      {
        url: 'https://example.com',
        cookies: [
          {
            name: 'foo',
            value: 'bar',
          },
        ],
      },
      {
        cookies: [
          {
            name: 'custom',
            value: 'value',
          },
        ],
      },
    )

    expect(request).toMatchObject({
      url: 'https://example.com',
      cookies: [
        {
          name: 'foo',
          value: 'bar',
        },
        {
          name: 'custom',
          value: 'value',
        },
      ],
    })
  })

  it('removes duplicate headers', () => {
    const request = getHarRequest(
      {
        url: 'https://example.com',
        headers: [
          {
            name: 'Content-Type',
            value: 'application/json',
          },
        ],
      },
      {
        headers: [
          {
            name: 'Content-Type',
            value: 'text/html',
          },
        ],
      },
    )

    expect(request).toMatchObject({
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'text/html',
        },
      ],
    })
  })

  it('formats headers', () => {
    const request = getHarRequest({
      url: 'https://example.com',
      headers: [
        {
          name: 'cOnTeNt-TyPe',
          value: 'application/json',
        },
      ],
    })

    expect(request).toMatchObject({
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
    })
  })
})
