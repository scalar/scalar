import {
  type RequestPayload,
  type ServerPayload,
  createExampleFromRequest,
  requestExampleSchema,
  requestSchema,
  securitySchemeSchema,
  serverSchema,
} from '@scalar/oas-utils/entities/spec'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import type { z } from 'zod'

import type { SelectedSecuritySchemeUids } from '@scalar/oas-utils/entities/shared'
import * as electron from '../electron'
import { createRequestOperation } from './create-request-operation'

const PROXY_PORT = 5051
const VOID_PORT = 5052
const PROXY_URL = `http://127.0.0.1:${PROXY_PORT}`
// biome-ignore lint/suspicious/noExportsInTest: yolo
export const VOID_URL = `http://127.0.0.1:${VOID_PORT}`

type RequestExamplePayload = z.input<typeof requestExampleSchema>

type MetaRequestPayload = {
  serverPayload?: ServerPayload
  requestPayload?: RequestPayload
  requestExamplePayload?: RequestExamplePayload
  proxyUrl?: string
}

/** Creates the payload for createRequestOperation */
export const createRequestPayload = (metaRequestPayload: MetaRequestPayload = {}) => {
  const request = requestSchema.parse(metaRequestPayload.requestPayload ?? {})
  const server = metaRequestPayload.serverPayload ? serverSchema.parse(metaRequestPayload.serverPayload) : undefined
  let example = createExampleFromRequest(request, 'example')

  // Overwrite any example properties
  if (metaRequestPayload.requestExamplePayload) {
    example = requestExampleSchema.parse({
      ...example,
      ...metaRequestPayload.requestExamplePayload,
    })
  }

  return {
    auth: {},
    request,
    environment: {},
    globalCookies: [],
    example,
    server,
    proxyUrl: metaRequestPayload.proxyUrl,
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
  } catch (_error) {
    throw new Error(`

[sendRequest.test.ts] Looks like you're not running @scalar/proxy-server on <http://127.0.0.1:${PROXY_PORT}>, but it's required for this test file.

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
  } catch (_error) {
    throw new Error(`

[sendRequest.test.ts] Looks like you're not running @scalar/void-server on <http://127.0.0.1:${VOID_PORT}>, but it's required for this test file.

Try to run it like this:

$ pnpm dev:void-server
`)
  }
})

describe('create-request-operation', () => {
  it('builds a request with a relative server url', async () => {
    // Mock the origin to make the relative request work
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      origin: VOID_URL,
    })

    const [error, requestOperation] = createRequestOperation(
      createRequestPayload({
        serverPayload: { url: '/api' },
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
    if (error) {
      throw error
    }
    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
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
          path: `${VOID_URL}/me`,
        },
      }),
    )
    if (error) {
      throw error
    }
    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
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
          path: `${VOID_URL}`,
        },
      }),
    )
    if (error) {
      throw error
    }
    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
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
    if (error) {
      throw error
    }

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    expect(result?.response.data).not.toContain('ECONNREFUSED')
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
    if (error) {
      throw error
    }

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
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
    if (error) {
      throw error
    }

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    expect(JSON.parse(result?.response.data as string)).toMatchObject({
      query: {
        foo: 'bar',
      },
    })
  })

  it('creates query parameters from the url', async () => {
    const [error, requestOperation] = createRequestOperation(
      createRequestPayload({
        serverPayload: { url: VOID_URL },
        requestPayload: {
          path: '/path?test=query',
        },
      }),
    )
    if (error) {
      throw error
    }

    expect(requestOperation.request.url).toBe(`${VOID_URL}/path?test=query`)
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
    if (error) {
      throw error
    }

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
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
    if (error) {
      throw error
    }

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    expect(JSON.parse(result?.response.data as string).query).toMatchObject({
      foo: ['foo', 'bar'],
    })
  })

  it('builds a request with User-Agent header', async () => {
    const spy = vi.spyOn(electron, 'isElectron').mockReturnValue(true)

    const [error, requestOperation] = createRequestOperation({
      ...createRequestPayload({
        serverPayload: { url: VOID_URL },
        requestExamplePayload: {
          parameters: {
            headers: [
              {
                key: 'User-Agent',
                value: 'custom-user-agent',
                enabled: true,
              },
            ],
          },
        },
      }),
    })
    if (error) {
      throw error
    }

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    const responseHeaders = JSON.parse(result?.response.data as string).headers
    expect(responseHeaders['x-scalar-user-agent']).toBe('custom-user-agent')

    spy.mockRestore()
  })

  describe('merges query parameters', () => {
    it('with server url', async () => {
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
      if (error) {
        throw error
      }

      const [requestError, result] = await requestOperation.sendRequest()

      expect(requestError).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      expect(JSON.parse(result?.response.data as string).query).toStrictEqual({
        example: 'parameter',
        foo: 'bar',
        orange: 'apple',
      })
    })

    it('without server url', async () => {
      const [error, requestOperation] = createRequestOperation(
        createRequestPayload({
          serverPayload: {
            url: '',
          },
          requestPayload: {
            path: `${VOID_URL}/?example=parameter`,
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
      if (error) {
        throw error
      }

      const [requestError, result] = await requestOperation.sendRequest()

      expect(requestError).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      expect(JSON.parse(result?.response.data as string).query).toStrictEqual({
        example: 'parameter',
        foo: 'bar',
      })
    })
  })

  it(`doesn't have any query parameters`, async () => {
    const [error, requestOperation] = createRequestOperation(
      createRequestPayload({
        serverPayload: {
          url: VOID_URL,
        },
      }),
    )
    if (error) {
      throw error
    }

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    expect(JSON.parse(result?.response.data as string).query).toStrictEqual({})
  })

  it('should ignore query parameters with empty values that are not enabled', async () => {
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
                enabled: false,
              },
            ],
          },
        },
      }),
    )
    if (error) {
      throw error
    }

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    expect(JSON.parse(result?.response.data as string).query).toStrictEqual({})
  })

  it('should maintain query parameters with empty values that are enabled', async () => {
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
    if (error) {
      throw error
    }

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    expect(JSON.parse(result?.response.data as string).query).toStrictEqual({
      foo: '',
    })
  })

  it('works with no content', async () => {
    const [error, requestOperation] = createRequestOperation(
      createRequestPayload({
        serverPayload: { url: `${VOID_URL}/204` },
      }),
    )
    if (error) {
      throw error
    }

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    expect(result?.response.data).toBe('')
  })

  it('skips the proxy for requests to 127.0.0.1 (localhost)', async () => {
    const [error, requestOperation] = createRequestOperation(
      createRequestPayload({
        serverPayload: { url: `http://127.0.0.1:${VOID_PORT}/v1` },
      }),
    )
    if (error) {
      throw error
    }

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
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
    if (error) {
      throw error
    }

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
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
    if (error) {
      throw error
    }

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
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
   * It's not clear to me, whether we need to make the void-server handle that, or
   * if we should disable the streaming, or
   * if there's another way to test this properly.
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
    if (error) {
      throw error
    }

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
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
          path: `${VOID_URL}/me`,
        },
      }),
    )
    if (error) {
      throw error
    }
    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    expect(JSON.parse(result?.response.data as string)).toMatchObject({
      method: 'GET',
      path: '/me',
      body: '',
    })
  })

  it('sends cookies', async () => {
    const [error, requestOperation] = createRequestOperation({
      ...createRequestPayload({
        serverPayload: { url: VOID_URL },
        requestExamplePayload: {
          parameters: {
            cookies: [
              {
                key: 'cookie',
                value: 'custom-value',
                enabled: true,
              },
            ],
            headers: [
              {
                key: 'Cookie',
                value: 'cookie-header=example-value;',
                enabled: true,
              },
            ],
          },
        },
      }),
      securitySchemes: {
        'api-key': securitySchemeSchema.parse({
          uid: 'api-key',
          type: 'apiKey',
          nameKey: 'api_key',
          name: 'auth-cookie',
          in: 'cookie',
          value: 'super-secret-token',
          description: 'API key',
        }),
      },
      selectedSecuritySchemeUids: ['api-key'] as SelectedSecuritySchemeUids,
    })

    if (error) {
      throw error
    }

    const [requestError, result] = await requestOperation.sendRequest()

    expect(requestError).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    expect(JSON.parse(result?.response.data as string)?.cookies).toStrictEqual({
      'cookie': 'custom-value',
      'auth-cookie': 'super-secret-token',
      'cookie-header': 'example-value',
    })
  })

  it('should safely create a new response when body is empty', async () => {
    const originalFetch = global.fetch
    try {
      const mockEmptyStream = new ReadableStream({
        start(controller) {
          controller.close()
        },
      })

      const mockResponse = {
        status: 204,
        headers: new Headers(),
        body: mockEmptyStream,
        ok: true,
        statusText: 'No Content',
        // Add the methods your code uses
        clone: () => mockResponse,
        text: async () => '',
        json: async () => ({}),
        arrayBuffer: async () => new ArrayBuffer(0),
      } as unknown as Response

      global.fetch = vi.fn().mockResolvedValue(mockResponse)

      const [error, requestOperation] = createRequestOperation({
        ...createRequestPayload({
          serverPayload: { url: VOID_URL },
        }),
      })

      if (error) {
        throw error
      }

      const [requestError, result] = await requestOperation.sendRequest()

      expect(requestError).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      expect(result?.response.data).toBe('')
    } finally {
      global.fetch = originalFetch
    }
  })

  describe('authentication', () => {
    it('adds apiKey auth in header', async () => {
      const [error, requestOperation] = createRequestOperation({
        ...createRequestPayload({
          serverPayload: { url: VOID_URL },
        }),
        securitySchemes: {
          'api-key': securitySchemeSchema.parse({
            type: 'apiKey',
            name: 'X-API-KEY',
            in: 'header',
            value: 'test-key',
            uid: 'api-key',
            nameKey: 'X-API-KEY',
          }),
        },
        selectedSecuritySchemeUids: ['api-key'] as SelectedSecuritySchemeUids,
      })
      if (error) {
        throw error
      }

      const [requestError, result] = await requestOperation.sendRequest()

      expect(requestError).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      expect(JSON.parse(result?.response.data as string).headers).toMatchObject({
        'x-api-key': 'test-key',
      })
    })

    it('adds apiKey auth in query', async () => {
      const [error, requestOperation] = createRequestOperation({
        ...createRequestPayload({
          serverPayload: { url: VOID_URL },
        }),
        securitySchemes: {
          'api-key': securitySchemeSchema.parse({
            type: 'apiKey',
            name: 'api_key',
            in: 'query',
            value: 'test-key',
            uid: 'api-key',
            nameKey: 'api_key',
          }),
        },
        selectedSecuritySchemeUids: ['api-key'] as SelectedSecuritySchemeUids,
      })
      if (error) {
        throw error
      }

      const [requestError, result] = await requestOperation.sendRequest()

      expect(requestError).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      expect(JSON.parse(result?.response.data as string).query).toMatchObject({
        api_key: 'test-key',
      })
    })

    it('adds basic auth header', async () => {
      const [error, requestOperation] = createRequestOperation({
        ...createRequestPayload({
          serverPayload: { url: VOID_URL },
        }),
        securitySchemes: {
          'basic-auth': securitySchemeSchema.parse({
            type: 'http',
            scheme: 'basic',
            bearerFormat: 'Basic',
            token: '',
            username: 'user',
            password: 'pass',
            uid: 'basic-auth',
            nameKey: 'Authorization',
          }),
        },
        selectedSecuritySchemeUids: ['basic-auth'] as SelectedSecuritySchemeUids,
      })
      if (error) {
        throw error
      }

      const [requestError, result] = await requestOperation.sendRequest()

      expect(requestError).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      expect(JSON.parse(result?.response.data as string).headers).toMatchObject({
        authorization: `Basic ${btoa('user:pass')}`,
      })
    })

    it('adds bearer token header', async () => {
      const [error, requestOperation] = createRequestOperation({
        ...createRequestPayload({
          serverPayload: { url: VOID_URL },
        }),
        securitySchemes: {
          'bearer-auth': securitySchemeSchema.parse({
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'Bearer',
            uid: 'bearer-auth',
            nameKey: 'Authorization',
            token: 'xxxx',
          }),
        },
        selectedSecuritySchemeUids: ['bearer-auth'] as SelectedSecuritySchemeUids,
      })
      if (error) {
        throw error
      }

      const [requestError, result] = await requestOperation.sendRequest()

      expect(requestError).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      expect(JSON.parse(result?.response.data as string).headers).toMatchObject({
        authorization: 'Bearer xxxx',
      })
    })

    it('handles complex auth', async () => {
      const [error, requestOperation] = createRequestOperation({
        ...createRequestPayload({
          serverPayload: { url: VOID_URL },
        }),
        securitySchemes: {
          'api-key': securitySchemeSchema.parse({
            type: 'apiKey',
            name: 'api_key',
            in: 'query',
            value: 'xxxx',
            uid: 'api-key',
            nameKey: 'api_key',
          }),
          'bearer-auth': securitySchemeSchema.parse({
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'Bearer',
            username: '',
            password: '',
            uid: 'bearer-auth',
            nameKey: 'Authorization',
            token: 'xxxx',
          }),
        },
        selectedSecuritySchemeUids: [['bearer-auth', 'api-key']] as SelectedSecuritySchemeUids,
      })
      if (error) {
        throw error
      }

      const [requestError, result] = await requestOperation.sendRequest()

      expect(requestError).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      const parsed = JSON.parse(result?.response.data as string)
      expect(parsed.headers.authorization).toEqual('Bearer xxxx')
      expect(parsed.query.api_key).toEqual('xxxx')
    })

    it('adds oauth2 token header', async () => {
      const [error, requestOperation] = createRequestOperation({
        ...createRequestPayload({
          serverPayload: { url: VOID_URL },
        }),
        securitySchemes: {
          'oauth2-auth': securitySchemeSchema.parse({
            type: 'oauth2',
            uid: 'oauth2-auth',
            nameKey: 'Authorization',
            flows: {
              implicit: {
                'type': 'implicit',
                'token': 'oauth-token',
                'authorizationUrl': 'https://example.com/auth',
                'refreshUrl': 'https://example.com/refresh',
                'scopes': {},
                'selectedScopes': [],
                'x-scalar-client-id': 'client-id',
                'x-scalar-redirect-uri': 'https://example.com/callback',
              },
            },
          }),
        },
        selectedSecuritySchemeUids: ['oauth2-auth'] as SelectedSecuritySchemeUids,
      })
      if (error) {
        throw error
      }

      const [requestError, result] = await requestOperation.sendRequest()

      expect(requestError).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      expect(JSON.parse(result?.response.data as string).headers).toMatchObject({
        authorization: 'Bearer oauth-token',
      })
    })

    it('accepts a lowercase auth header', () => {
      const [error, requestOperation] = createRequestOperation({
        ...createRequestPayload({
          serverPayload: { url: VOID_URL },
        }),
        securitySchemes: {
          'api-key': securitySchemeSchema.parse({
            type: 'apiKey',
            name: 'x-api-key',
            in: 'header',
            value: 'test-key',
            uid: 'api-key',
            nameKey: 'api-key',
          }),
        },
        selectedSecuritySchemeUids: ['api-key'] as SelectedSecuritySchemeUids,
      })
      if (error) {
        throw error
      }
      expect(requestOperation.request.headers.get('x-api-key')).toBe('test-key')
    })
  })

  describe('response streaming', () => {
    it('streams the response body', async () => {
      // Store original fetch
      const originalFetch = global.fetch
      try {
        // Create a TextEncoder to convert strings to Uint8Arrays
        const encoder = new TextEncoder()

        // Mock fetch to return a ReadableStream response
        const mockStream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode('chunk 1'))
            controller.enqueue(encoder.encode('chunk 2'))
            controller.close()
          },
        })

        const mockResponse = new Response(mockStream, {
          status: 200,
          headers: new Headers({
            'content-type': 'text/event-stream',
          }),
        })

        global.fetch = vi.fn().mockResolvedValue(mockResponse)

        const [error, requestOperation] = createRequestOperation({
          ...createRequestPayload({
            serverPayload: { url: VOID_URL },
          }),
        })

        if (error) {
          throw error
        }

        const [requestError, result] = await requestOperation.sendRequest()

        expect(requestError).toBe(null)
        if (!result || !('reader' in result.response)) {
          throw new Error('No reader')
        }
        expect(result?.response.reader).toBeInstanceOf(ReadableStreamDefaultReader)

        // Read and verify the stream contents
        const chunks = []
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await result.response.reader.read()
          if (done) {
            break
          }
          chunks.push(decoder.decode(value, { stream: true }))
        }

        expect(chunks).toEqual(['chunk 1', 'chunk 2'])
      } finally {
        // Restore original fetch
        global.fetch = originalFetch
      }
    })
  })

  it('executes onBeforeRequest hook when plugin manager is provided', async () => {
    const mockPluginManager = {
      executeHook: vi.fn().mockResolvedValue(undefined),
      getViewComponents: vi.fn().mockReturnValue([]),
    }

    const [error, requestOperation] = createRequestOperation({
      ...createRequestPayload({
        serverPayload: { url: 'https://api.example.com' },
        requestPayload: {
          path: '/test',
        },
      }),
      pluginManager: mockPluginManager,
    })

    if (error) {
      throw error
    }

    await requestOperation.sendRequest()

    expect(mockPluginManager.executeHook).toHaveBeenCalledWith('onBeforeRequest', {
      request: expect.any(Request),
    })
    expect(mockPluginManager.executeHook).toHaveBeenCalledTimes(1)
  })

  it('does not execute onBeforeRequest hook when plugin manager is not provided', async () => {
    // Store original fetch
    const originalFetch = global.fetch
    try {
      // Mock fetch to return a successful response
      const mockResponse = new Response('{"test": "data"}', {
        status: 200,
        headers: new Headers({
          'content-type': 'application/json',
        }),
      })

      global.fetch = vi.fn().mockResolvedValue(mockResponse)

      const [error, requestOperation] = createRequestOperation(
        createRequestPayload({
          serverPayload: { url: 'https://api.example.com' },
          requestPayload: {
            path: '/test',
          },
        }),
      )

      if (error) {
        throw error
      }

      const [requestError] = await requestOperation.sendRequest()

      // Should not throw any errors related to plugin manager
      expect(requestError).toBe(null)
    } finally {
      // Restore original fetch
      global.fetch = originalFetch
    }
  })

  it('executes onBeforeRequest hook before making the request', async () => {
    let hookExecuted = false

    const mockPluginManager = {
      executeHook: vi.fn().mockImplementation(async () => {
        hookExecuted = true
        return Promise.resolve()
      }),
      getViewComponents: vi.fn().mockReturnValue([]),
    }

    // Store original fetch
    const originalFetch = global.fetch
    try {
      // Mock fetch to return a successful response
      const mockResponse = new Response('{"test": "data"}', {
        status: 200,
        headers: new Headers({
          'content-type': 'application/json',
        }),
      })

      global.fetch = vi.fn().mockResolvedValue(mockResponse)

      const [error, requestOperation] = createRequestOperation({
        ...createRequestPayload({
          serverPayload: { url: 'https://api.example.com' },
          requestPayload: {
            path: '/test',
          },
        }),
        pluginManager: mockPluginManager,
      })

      if (error) {
        throw error
      }

      await requestOperation.sendRequest()

      expect(hookExecuted).toBe(true)
      expect(mockPluginManager.executeHook).toHaveBeenCalledWith('onBeforeRequest', {
        request: expect.any(Request),
      })
    } finally {
      // Restore original fetch
      global.fetch = originalFetch
    }
  })

  it('executes onResponseReceived hook when plugin manager is provided', async () => {
    const mockPluginManager = {
      executeHook: vi.fn().mockResolvedValue(undefined),
      getViewComponents: vi.fn().mockReturnValue([]),
    }

    // Store original fetch
    const originalFetch = global.fetch
    try {
      // Mock fetch to return a successful response
      const mockResponse = new Response('{"test": "data"}', {
        status: 200,
        headers: new Headers({
          'content-type': 'application/json',
        }),
      })

      global.fetch = vi.fn().mockResolvedValue(mockResponse)

      const [error, requestOperation] = createRequestOperation({
        ...createRequestPayload({
          serverPayload: { url: 'https://api.example.com' },
          requestPayload: {
            path: '/test',
          },
        }),
        pluginManager: mockPluginManager,
      })

      if (error) {
        throw error
      }

      await requestOperation.sendRequest()

      expect(mockPluginManager.executeHook).toHaveBeenCalledWith('onResponseReceived', {
        response: expect.any(Response),
        operation: expect.any(Object),
      })
      expect(mockPluginManager.executeHook).toHaveBeenCalledTimes(2) // onBeforeRequest + onResponseReceived
    } finally {
      // Restore original fetch
      global.fetch = originalFetch
    }
  })
})
