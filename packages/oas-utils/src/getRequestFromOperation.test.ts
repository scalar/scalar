import { describe, expect, it } from 'vitest'

import { getRequestFromOperation } from './getRequestFromOperation'
import type { TransformedOperation } from './types'

describe('getRequestFromOperation', () => {
  it('transforms a basic operation', () => {
    const request = getRequestFromOperation({
      httpVerb: 'GET',
      path: '/foobar',
    } as TransformedOperation)

    expect(request).toMatchObject({
      method: 'GET',
      path: '/foobar',
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
    })
  })

  it('adds a json request body a schema', () => {
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

    expect(request).toMatchObject({
      method: 'POST',
      path: '/foobar',
    })

    expect(request.postData).toMatchObject({
      mimeType: 'application/json',
    })

    expect(JSON.parse(request.postData?.text ?? '')).toMatchObject({
      id: 1,
    })
  })

  it('adds a json request body from a given example', () => {
    const request = getRequestFromOperation({
      httpVerb: 'POST',
      path: '/foobar',
      information: {
        requestBody: {
          content: {
            'application/json': {
              example: JSON.stringify({
                id: 1,
              }),
            },
          },
        },
      },
    } as TransformedOperation)

    expect(request).toMatchObject({
      method: 'POST',
      path: '/foobar',
    })

    expect(request.postData).toMatchObject({
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

    expect(request).toMatchObject({
      method: 'POST',
      path: '/foobar',
    })

    expect(request.postData).toMatchObject({
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

    expect(request).toMatchObject({
      method: 'POST',
      path: '/foobar',
    })

    expect(request.postData).toMatchObject({
      mimeType: 'application/xml',
    })

    expect(request.postData?.text).toBe('<id>1</id>')
  })

  it('uses custom xml tag names', () => {
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
                    xml: {
                      name: 'foo',
                    },
                  },
                },
              },
            },
          },
        },
      },
    } as TransformedOperation)

    expect(request).toMatchObject({
      method: 'POST',
      path: '/foobar',
    })

    expect(request.postData).toMatchObject({
      mimeType: 'application/xml',
    })

    expect(request.postData?.text).toBe('<foo>1</foo>')
  })

  it('sends binary data', () => {
    const request = getRequestFromOperation({
      httpVerb: 'POST',
      path: '/foobar',
      information: {
        requestBody: {
          content: {
            'application/octet-stream': {
              schema: {
                type: 'string',
                format: 'binary',
              },
            },
          },
        },
      },
    } as TransformedOperation)

    expect(request).toMatchObject({
      method: 'POST',
      path: '/foobar',
    })

    expect(request.postData).toMatchObject({
      mimeType: 'application/octet-stream',
    })

    expect(request.postData?.text).toBe('BINARY')
  })
})
