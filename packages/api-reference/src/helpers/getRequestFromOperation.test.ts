import { describe, expect, it } from 'vitest'

import type { TransformedOperation } from '../types'
import { getRequestFromOperation } from './getRequestFromOperation'

describe('getRequestFromOperation', () => {
  it('transforms a basic operation', () => {
    const request = getRequestFromOperation({
      httpVerb: 'GET',
      path: '/foobar',
    } as TransformedOperation)

    expect(request).toMatchObject({
      method: 'GET',
      path: '/foobar',
      postData: undefined,
    })
  })

  it('transforms a POST operation', () => {
    const request = getRequestFromOperation({
      httpVerb: 'POST',
      path: '/foobar',
    } as TransformedOperation)

    expect(request).toMatchObject({
      method: 'POST',
      path: '/foobar',
      postData: undefined,
    })
  })

  it('adds a json request body', () => {
    const request = getRequestFromOperation({
      httpVerb: 'POST',
      path: '/foobar',
      information: {
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: {
                    example: 1,
                  },
                },
              },
            },
          },
        },
      },
    } as TransformedOperation)

    expect(request).toContain({
      method: 'POST',
      path: '/foobar',
    })

    expect(request.postData).toContain({
      mimeType: 'application/json',
    })

    expect(JSON.parse(request.postData?.text ?? '')).toMatchObject({
      id: 1,
    })
  })

  it.todo('adds encoded form request body', () => {
    const request = getRequestFromOperation({
      httpVerb: 'POST',
      path: '/foobar',
      information: {
        requestBody: {
          content: {
            'application/x-www-form-urlencoded': {
              schema: {
                type: 'object',
                properties: {
                  id: {
                    example: 1,
                  },
                },
              },
            },
          },
        },
      },
    } as TransformedOperation)

    expect(request).toContain({
      method: 'POST',
      path: '/foobar',
    })

    expect(request.postData).toContain({
      mimeType: 'application/x-www-form-urlencoded',
    })

    // TODO: Make this work
    expect(request.postData?.params).toMatchObject([
      {
        name: 'id',
        value: 1,
      },
    ])
  })

  it('adds xml request body', () => {
    const request = getRequestFromOperation({
      httpVerb: 'POST',
      path: '/foobar',
      information: {
        requestBody: {
          content: {
            'application/xml': {
              schema: {
                type: 'object',
                properties: {
                  id: {
                    example: 1,
                  },
                },
              },
            },
          },
        },
      },
    } as TransformedOperation)

    expect(request).toContain({
      method: 'POST',
      path: '/foobar',
    })

    expect(request.postData).toContain({
      mimeType: 'application/xml',
    })

    expect(request.postData?.text).toBe('<id>1</id>')
  })

  it.todo('uses custom xml tag names', () => {
    const request = getRequestFromOperation({
      httpVerb: 'POST',
      path: '/foobar',
      information: {
        requestBody: {
          content: {
            'application/xml': {
              schema: {
                type: 'object',
                properties: {
                  id: {
                    example: 1,
                    xml: 'foo',
                  },
                },
              },
            },
          },
        },
      },
    } as TransformedOperation)

    expect(request).toContain({
      method: 'POST',
      path: '/foobar',
    })

    expect(request.postData).toContain({
      mimeType: 'application/xml',
    })

    expect(request.postData?.text).toBe('<foo>1</foo>')
  })
})
