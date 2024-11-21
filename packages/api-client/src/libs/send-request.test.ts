/**
 * @vitest-environment jsdom
 */
import { createRequestOperation } from '@/libs'
import {
  type RequestPayload,
  type ServerPayload,
  createExampleFromRequest,
  requestExampleSchema,
  requestSchema,
  serverSchema,
} from '@scalar/oas-utils/entities/spec'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import type { z } from 'zod'

const PROXY_PORT = 5051
const VOID_PORT = 5052
const PROXY_URL = `http://127.0.0.1:${PROXY_PORT}`
const VOID_URL = `http://127.0.0.1:${VOID_PORT}`

type RequestExamplePayload = z.input<typeof requestExampleSchema>

type MetaRequestPayload = {
  serverPayload?: ServerPayload
  requestPayload?: RequestPayload
  requestExamplePayload?: RequestExamplePayload
  proxy?: string
}

/** Creates the payload for createRequestOperation */
const createRequestPayload = (metaRequestPayload: MetaRequestPayload = {}) => {
  const request = requestSchema.parse(metaRequestPayload.requestPayload ?? {})
  const server = serverSchema.parse(metaRequestPayload.serverPayload ?? {})
  let example = createExampleFromRequest(request, 'example')

  // Overwrite any example properties
  if (metaRequestPayload.requestExamplePayload)
    example = requestExampleSchema.parse({
      ...example,
      ...metaRequestPayload.requestExamplePayload,
    })

  return {
    auth: {},
    request,
    environment: {},
    globalCookies: [],
    example,
    server,
    proxy: metaRequestPayload.proxy,
    securitySchemes: {},
  }
}

beforeAll(async () => {
  // Check whether the proxy-server is running
  try {
    const result = await fetch(PROXY_URL)

    if (result.ok) {
      return
    }
  } catch (error) {
    throw new Error(`

[sendRequest.test.ts] Looks like you’re not running @scalar/proxy-server on <http://127.0.0.1:${PROXY_PORT}>, but it’s required for this test file.

Try to run it like this:

$ pnpm dev:proxy-server
`)
  }

  // Check whether the void-server is running
  try {
    const result = await fetch(VOID_URL)

    if (result.ok) {
      return
    }
  } catch (error) {
    throw new Error(`

[sendRequest.test.ts] Looks like you’re not running @scalar/void-server on <http://127.0.0.1:${VOID_PORT}>, but it’s required for this test file.

Try to run it like this:

$ pnpm dev:void-server
`)
  }
})

describe('sendRequest', () => {
  it('shows a warning when scalar_url is missing', async () => {
    const [error, requestOperation] = createRequestOperation(
      createRequestPayload({
        serverPayload: { url: PROXY_URL },
      }),
    )
    if (error) throw error

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    expect(result?.response.data as string).toContain(
      'The `scalar_url` query parameter is required.',
    )
  })

  it('builds a request with a relative server url', async () => {
    // Mock the origin to make the relative request work
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      origin: VOID_URL,
    })

    const [error, requestOperation] = createRequestOperation(
      createRequestPayload({
        serverPayload: { url: `/api` },
        requestPayload: {
          path: '/{path}',
          parameters: [
            {
              in: 'path',
              name: 'path',
            },
          ],
        },
        requestExamplePayload: {
          parameters: {
            path: [
              {
                key: 'path',
                value: 'example',
                enabled: true,
              },
            ],
          },
        },
      }),
    )
    if (error) throw error

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    expect(JSON.parse(result?.response.data as string)).toMatchObject({
      method: 'GET',
      path: '/api/example',
      body: '',
    })
  })

  it('builds a request with no server and a path', async () => {
    const [error, requestOperation] = createRequestOperation(
      createRequestPayload({
        requestPayload: {
          path: 'https://void.scalar.com/me',
        },
      }),
    )
    if (error) throw error
    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    expect(JSON.parse(result?.response.data as string)).toMatchObject({
      method: 'GET',
      path: '/me',
      body: '',
    })
  })

  it('builds a request with no server and no path', async () => {
    const [error, requestOperation] = createRequestOperation(
      createRequestPayload({
        requestPayload: {
          path: 'https://void.scalar.com',
        },
      }),
    )
    if (error) throw error
    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    expect(JSON.parse(result?.response.data as string)).toMatchObject({
      method: 'GET',
      path: '/',
      body: '',
    })
  })

  it('reaches the echo server *without* the proxy', async () => {
    const [error, requestOperation] = createRequestOperation(
      createRequestPayload({
        serverPayload: { url: VOID_URL },
      }),
    )
    if (error) throw error

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    expect(JSON.parse(result?.response.data as string)).not.toContain(
      'ECONNREFUSED',
    )
    expect(requestError).toBe(null)
    expect(JSON.parse(result?.response.data as string)).toMatchObject({
      method: 'GET',
      path: '/',
    })
  })

  // TODO: this doesn't actually hit the proxy due to 127.0.0.1
  it('reaches the echo server *with* the proxy', async () => {
    const [error, requestOperation] = createRequestOperation(
      createRequestPayload({
        serverPayload: { url: VOID_URL },
        proxy: PROXY_URL,
      }),
    )
    if (error) throw error

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    expect(JSON.parse(result?.response.data as string)).toMatchObject({
      method: 'GET',
      path: '/',
    })
  })

  it('replaces variables in urls', async () => {
    const [error, requestOperation] = createRequestOperation(
      createRequestPayload({
        serverPayload: { url: VOID_URL },
        requestPayload: {
          path: '/{path}',
          parameters: [
            {
              in: 'path',
              name: 'path',
            },
          ],
        },
        requestExamplePayload: {
          parameters: {
            path: [
              {
                key: 'path',
                value: 'example',
                enabled: true,
              },
            ],
          },
        },
      }),
    )
    if (error) throw error

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    expect(JSON.parse(result?.response.data as string)).toMatchObject({
      method: 'GET',
      path: '/example',
    })
  })

  it('sends query parameters', async () => {
    const [error, requestOperation] = createRequestOperation(
      createRequestPayload({
        serverPayload: { url: VOID_URL },
        requestExamplePayload: {
          parameters: {
            query: [
              {
                key: 'foo',
                value: 'bar',
                enabled: true,
              },
            ],
          },
        },
      }),
    )
    if (error) throw error

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    expect(JSON.parse(result?.response.data as string).query).toMatchObject({
      foo: 'bar',
    })
  })

  it('sends query parameters as arrays', async () => {
    const [error, requestOperation] = createRequestOperation(
      createRequestPayload({
        serverPayload: { url: VOID_URL },
        requestExamplePayload: {
          parameters: {
            query: [
              {
                key: 'foo',
                value: 'foo',
                enabled: true,
              },
              {
                key: 'foo',
                value: 'bar',
                enabled: true,
              },
            ],
          },
        },
      }),
    )
    if (error) throw error

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    expect(JSON.parse(result?.response.data as string)).toMatchObject({
      query: {
        foo: ['foo', 'bar'],
      },
    })
  })

  it('returns the request object with an uppercase method', async () => {
    const [error, requestOperation] = createRequestOperation(
      createRequestPayload({
        serverPayload: { url: VOID_URL },
        requestPayload: {
          // Lowercase method
          method: 'post',
        },
      }),
    )
    if (error) throw error

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    expect(JSON.parse(result?.response.data as string)).toMatchObject({
      method: 'POST',
    })
    expect(requestOperation.request).toBeInstanceOf(Request)
    expect(requestOperation.request).toMatchObject({
      // Uppercase method
      method: 'POST',
      url: 'http://127.0.0.1:5052/',
    })
  })

  it('merges query parameters', async () => {
    const [error, requestOperation] = createRequestOperation(
      createRequestPayload({
        serverPayload: {
          url: `${VOID_URL}/api?orange=apple`,
        },
        requestPayload: {
          path: '?example=parameter',
        },
        requestExamplePayload: {
          parameters: {
            query: [
              {
                key: 'foo',
                value: 'bar',
                enabled: true,
              },
            ],
          },
        },
      }),
    )
    if (error) throw error

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    expect(JSON.parse(result?.response.data as string)).toMatchObject({
      query: {
        example: 'parameter',
        foo: 'bar',
        orange: 'apple',
      },
    })
  })

  it('doesnt have any query parameters', async () => {
    const [error, requestOperation] = createRequestOperation(
      createRequestPayload({
        serverPayload: {
          url: VOID_URL,
        },
      }),
    )
    if (error) throw error

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    expect(JSON.parse(result?.response.data as string)).toMatchObject({
      query: {},
    })
  })

  it('should ignore query parameters with empty values', async () => {
    const [error, requestOperation] = createRequestOperation(
      createRequestPayload({
        serverPayload: {
          url: VOID_URL,
        },
        requestExamplePayload: {
          parameters: {
            query: [
              {
                key: 'foo',
                value: '',
                enabled: true,
              },
            ],
          },
        },
      }),
    )
    if (error) throw error

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    expect(JSON.parse(result?.response.data as string).query).toStrictEqual({})
  })

  it('works with no content', async () => {
    const [error, requestOperation] = createRequestOperation(
      createRequestPayload({
        serverPayload: { url: `${VOID_URL}/204` },
      }),
    )
    if (error) throw error

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    expect(result?.response.data).toBe('')
  })

  it('skips the proxy for requests to 127.0.0.1 (localhost)', async () => {
    const [error, requestOperation] = createRequestOperation(
      createRequestPayload({
        serverPayload: { url: `http://127.0.0.1:${VOID_PORT}/v1` },
      }),
    )
    if (error) throw error

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    expect(JSON.parse(result?.response.data as string)).toMatchObject({
      method: 'GET',
      path: '/v1',
    })
  })

  it('keeps the trailing slash', async () => {
    const [error, requestOperation] = createRequestOperation(
      createRequestPayload({
        serverPayload: { url: `${VOID_URL}/v1/` },
      }),
    )
    if (error) throw error

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    expect(JSON.parse(result?.response.data as string)).toMatchObject({
      method: 'GET',
      path: '/v1/',
    })
  })

  it('sends a multipart/form-data request with string values', async () => {
    const [error, requestOperation] = createRequestOperation(
      createRequestPayload({
        serverPayload: { url: VOID_URL },
        requestPayload: { path: '', method: 'post' },
        requestExamplePayload: {
          body: {
            activeBody: 'formData',
            formData: {
              encoding: 'form-data',
              value: [
                {
                  key: 'name',
                  value: 'John Doe',
                  enabled: true,
                },
              ],
            },
          },
        },
      }),
    )
    if (error) throw error

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    expect(JSON.parse(result?.response.data as string)).toMatchObject({
      method: 'POST',
      path: '/',
      body: {
        name: 'John Doe',
      },
    })
  })

  /**
   * If we pass FormData with a file to fetch(), it seems to switch to a streaming mode and
   * the void-server doesn't receive the body properly.
   * It does work on other echo servers such as https://echo.free.beeceptor.com
   *
   * It’s not clear to me, whether we need to make the void-server handle that, or
   * if we should disable the streaming, or
   * if there’s another way to test this properly.
   *
   * - @hanspagel
   */
  it.todo('sends a multipart/form-data request with files', async () => {
    const [error, requestOperation] = createRequestOperation(
      createRequestPayload({
        serverPayload: { url: VOID_URL },
        requestPayload: { path: '', method: 'post' },
        requestExamplePayload: {
          body: {
            activeBody: 'formData',
            formData: {
              encoding: 'form-data',
              value: [
                {
                  key: 'file',
                  file: new File(['hello'], 'hello.txt', {
                    type: 'text/plain',
                  }),
                  enabled: true,
                },
                {
                  key: 'image',
                  file: new File(['hello'], 'hello.png', { type: 'image/png' }),
                  value: 'ignore me',
                  enabled: true,
                },
              ],
            },
          },
        },
      }),
    )
    if (error) throw error

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    expect(JSON.parse(result?.response.data as string)).toMatchObject({
      method: 'POST',
      path: '/',
      body: {
        file: {
          name: 'hello.txt',
          sizeInBytes: 5,
          type: 'text/plain',
        },
        image: {
          name: 'hello.png',
          sizeInBytes: 5,
          type: 'image/png',
        },
      },
    })
  })

  it('adds http://', async () => {
    const [error, requestOperation] = createRequestOperation(
      createRequestPayload({
        requestPayload: {
          path: 'void.scalar.com/me',
        },
      }),
    )
    if (error) throw error
    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    expect(JSON.parse(result?.response.data as string)).toMatchObject({
      method: 'GET',
      path: '/me',
      body: '',
    })
  })
})
