/**
 * @vitest-environment jsdom
 */
import { createRequestOperation } from '@/libs'
import {
  type RequestExamplePayload,
  type RequestPayload,
  type ServerPayload,
  createExampleFromRequest,
  requestExampleSchema,
  requestSchema,
  serverSchema,
} from '@scalar/oas-utils/entities/spec'
import { beforeAll, describe, expect, it, vi } from 'vitest'

const PROXY_PORT = 5051
const VOID_PORT = 5052
const PROXY_URL = `http://127.0.0.1:${PROXY_PORT}`
const VOID_URL = `http://127.0.0.1:${VOID_PORT}`

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
    const { sendRequest } = createRequestOperation(
      createRequestPayload({
        serverPayload: { url: PROXY_URL },
      }),
    )

    const result = await sendRequest()

    expect(result.ok && result.response.data).toContain(
      'The `scalar_url` query parameter is required.',
    )
  })

  it('builds a request with a relative server url', async () => {
    const { sendRequest } = createRequestOperation(
      createRequestPayload({
        serverPayload: { url: `/api` },
      }),
    )

    // Here we mock the origin to make the relative request work
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      origin: VOID_URL,
    })

    const result = await sendRequest()

    expect(result.ok && result.response.data).toMatchObject({
      method: 'GET',
      path: '/api',
      body: '',
    })
  })

  it('reaches the echo server *without* the proxy', async () => {
    const { sendRequest } = createRequestOperation(
      createRequestPayload({
        serverPayload: { url: VOID_URL },
      }),
    )
    const result = await sendRequest()

    expect(result.ok && result.response.data).not.toContain('ECONNREFUSED')
    expect(result.ok && result.response.data).toMatchObject({
      method: 'GET',
      path: '/',
    })
  })

  it('reaches the echo server *with* the proxy', async () => {
    const { sendRequest } = createRequestOperation(
      createRequestPayload({
        serverPayload: { url: VOID_URL },
        proxy: PROXY_URL,
      }),
    )
    const result = await sendRequest()

    expect(result.ok && result.response.data).toMatchObject({
      method: 'GET',
      path: '/',
    })
  })

  it('replaces variables in urls', async () => {
    const { sendRequest } = createRequestOperation(
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
    const result = await sendRequest()

    expect(result.ok && result.response.data).toMatchObject({
      method: 'GET',
      path: '/example',
    })
  })

  it('sends query parameters', async () => {
    const { sendRequest } = createRequestOperation<{ query: { foo: 'bar' } }>(
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
    const result = await sendRequest()

    expect(result.ok && result.response?.data.query).toMatchObject({
      foo: 'bar',
    })
  })

  it('merges query parameters', async () => {
    const { sendRequest } = createRequestOperation<{
      query: { example: 'parameter'; foo: 'bar' }
    }>(
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
    const result = await sendRequest()

    expect(result.ok && result.response.data.query).toStrictEqual({
      example: 'parameter',
      foo: 'bar',
      orange: 'apple',
    })
  })
})
