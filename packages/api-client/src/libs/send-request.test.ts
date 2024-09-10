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
import { beforeAll, describe, expect, it } from 'vitest'

const PROXY_PORT = 5051
const VOID_PORT = 5052

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
    const result = await fetch(`http://127.0.0.1:${PROXY_PORT}`)

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
    const result = await fetch(`http://127.0.0.1:${VOID_PORT}`)

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
        serverPayload: { url: `http://127.0.0.1:${PROXY_PORT}` },
      }),
    )

    const result = await sendRequest()

    expect(result.ok && result.response.data).toContain(
      'The `scalar_url` query parameter is required.',
    )
  })

  it('reaches the echo server *without* the proxy', async () => {
    const { sendRequest } = createRequestOperation(
      createRequestPayload({
        serverPayload: { url: `http://127.0.0.1:${VOID_PORT}` },
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
        serverPayload: { url: `http://127.0.0.1:${VOID_PORT}` },
        proxy: `http://127.0.0.1:${PROXY_PORT}`,
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
        serverPayload: { url: `http://127.0.0.1:${VOID_PORT}` },
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
})
