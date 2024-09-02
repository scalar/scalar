/**
 * @vitest-environment jsdom
 */
import {
  type ServerPayload,
  createServer,
} from '@scalar/oas-utils/entities/workspace/server'
import {
  type RequestExamplePayload,
  type RequestPayload,
  createRequest,
  createRequestExample,
  createRequestExampleParameter,
} from '@scalar/oas-utils/entities/workspace/spec'
import { beforeAll, describe, expect, it } from 'vitest'

import { sendRequest } from './sendRequest'

const PROXY_PORT = 5051
const VOID_PORT = 5052

type MetaRequestPayload = {
  serverPayload?: ServerPayload
  requestPayload?: RequestPayload
  requestExamplePayload?: Omit<RequestExamplePayload, 'requestUid'>
}
function createRequestExampleServer(metaRequestPayload: MetaRequestPayload) {
  const request = createRequest(metaRequestPayload.requestPayload ?? {})

  const example = createRequestExample({
    requestUid: request.uid,
    ...(metaRequestPayload.requestExamplePayload || {}),
  })
  const server = createServer(metaRequestPayload.serverPayload ?? {})

  return {
    request,
    example,
    server,
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
    const { request, example, server } = createRequestExampleServer({
      serverPayload: { url: `http://127.0.0.1:${PROXY_PORT}` },
    })

    const result = await sendRequest(
      request,
      example,
      server?.url + request.path,
    )

    expect(result?.response?.data ?? '').toContain(
      'The `scalar_url` query parameter is required.',
    )
  })

  it('reaches the echo server *without* the proxy', async () => {
    const { request, example, server } = createRequestExampleServer({
      serverPayload: { url: `http://127.0.0.1:${VOID_PORT}` },
    })

    const result = await sendRequest(
      request,
      example,
      server?.url + request.path,
    )

    expect(result?.response?.data).not.toContain('ECONNREFUSED')
    expect(result?.response?.data).toMatchObject({
      method: 'GET',
      path: '/',
    })
  })

  it('reaches the echo server *with* the proxy', async () => {
    const { request, example, server } = createRequestExampleServer({
      serverPayload: { url: `http://127.0.0.1:${VOID_PORT}` },
    })

    const result = await sendRequest(
      request,
      example,
      server?.url + request.path,
    )

    expect(result?.response?.data).toMatchObject({
      method: 'GET',
      path: '/',
    })
  })

  it('replaces variables in urls', async () => {
    const { request, example, server } = createRequestExampleServer({
      serverPayload: { url: `http://127.0.0.1:${VOID_PORT}` },
      requestExamplePayload: {
        parameters: {
          path: [
            createRequestExampleParameter({
              key: 'path',
              value: 'example',
              enabled: true,
            }),
          ],
        },
      },
    })

    const result = await sendRequest(request, example, `${server?.url}/{path}`)

    expect(result?.response?.data).toMatchObject({
      method: 'GET',
      path: '/example',
    })
  })

  it('sends query parameters', async () => {
    const { request, example, server } = createRequestExampleServer({
      serverPayload: { url: `http://127.0.0.1:${VOID_PORT}` },
      requestExamplePayload: {
        parameters: {
          query: [
            createRequestExampleParameter({
              key: 'foo',
              value: 'bar',
              enabled: true,
            }),
          ],
        },
      },
    })

    const result = await sendRequest(
      request,
      example,
      server?.url + request.path,
    )

    expect((result?.response?.data as any).query).toMatchObject({
      foo: 'bar',
    })
  })

  it('merges query parameters', async () => {
    const { request, example, server } = createRequestExampleServer({
      serverPayload: { url: `http://127.0.0.1:${VOID_PORT}?example=parameter` },
      requestPayload: { path: '' },
      requestExamplePayload: {
        parameters: {
          query: [
            createRequestExampleParameter({
              key: 'foo',
              value: 'bar',
              enabled: true,
            }),
          ],
        },
      },
    })

    const result = await sendRequest(
      request,
      example,
      server?.url + request.path,
    )

    expect(
      (result?.response?.data as { query: { example: 'parameter' } })?.query,
    ).toStrictEqual({
      example: 'parameter',
      foo: 'bar',
    })
  })

  it('works with no content', async () => {
    const { request, example, server } = createRequestExampleServer({
      serverPayload: { url: `http://127.0.0.1:${VOID_PORT}/204` },
    })

    const result = await sendRequest(
      request,
      example,
      server?.url + request.path,
    )

    expect(result?.response?.data).toBe('')
  })

  // it('adds cookies as headers', async () => {
  //   const { request, example, server } = createRequestExampleServer({
  //     serverPayload: { url: `http://127.0.0.1:${VOID_PORT}` },
  //     requestExamplePayload: {
  //       parameters: {
  //         cookies: [
  //           createRequestExampleParameter({
  //             key: 'foo',
  //             value: 'bar',
  //             enabled: true,
  //           }),
  //         ],
  //       },
  //     },
  //   })

  //   const result = await sendRequest(
  //     request,
  //     example,
  //     server?.url + request.path,
  //   )

  //   expect(result?.response?.data).toMatchObject({
  //     cookies: {
  //       foo: 'bar',
  //     },
  //   })
  // })

  // it('merges cookies', async () => {
  //   const { request, example, server } = createRequestExampleServer({
  //     serverPayload: { url: `http://127.0.0.1:${VOID_PORT}` },
  //     requestExamplePayload: {
  //       parameters: {
  //         cookies: [
  //           createRequestExampleParameter({
  //             key: 'foo',
  //             value: 'bar',
  //             enabled: true,
  //           }),
  //           createRequestExampleParameter({
  //             key: 'another',
  //             value: 'cookie',
  //             enabled: true,
  //           }),
  //         ],
  //       },
  //     },
  //   })

  //   const result = await sendRequest(
  //     request,
  //     example,
  //     server?.url + request.path,
  //   )

  //   expect(result?.response?.data).toMatchObject({
  //     cookies: {
  //       foo: 'bar',
  //       another: 'cookie',
  //     },
  //   })
  // })

  it('skips the proxy for requests to localhost', async () => {
    const { request, example, server } = createRequestExampleServer({
      serverPayload: { url: `http://127.0.0.1:${VOID_PORT}/v1` },
      requestPayload: { path: '' },
    })

    const result = await sendRequest(
      request,
      example,
      server?.url + request.path,
    )

    expect(result?.response?.data).toMatchObject({
      method: 'GET',
      path: '/v1',
    })
  })

  // it('returns error for invalid domain', async () => {
  //   const { request, example, server } = createRequestExampleServer({
  //     serverPayload: { url: `http://DOES_NOT_EXIST` },
  //   })

  //   const result = await sendRequest(
  //     request,
  //     example,
  //     server?.url + request.path,
  //   )

  //   expect(result?.response?.data?.trim().toLowerCase()).toContain(
  //     'dial tcp: lookup does_not_exist',
  //   )
  // })

  it('keeps the trailing slash', async () => {
    const { request, example, server } = createRequestExampleServer({
      serverPayload: { url: `http://127.0.0.1:${VOID_PORT}/v1/` },
      requestPayload: { path: '' },
    })

    const result = await sendRequest(
      request,
      example,
      server?.url + request.path,
    )

    expect(result?.response?.data).toMatchObject({
      method: 'GET',
      path: '/v1/',
    })
  })

  it('sends a multipart/form-data request with string values', async () => {
    const { request, example, server } = createRequestExampleServer({
      serverPayload: { url: `http://127.0.0.1:${VOID_PORT}` },
      requestPayload: { path: '', method: 'POST' },
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
    })

    const result = await sendRequest(
      request,
      example,
      server?.url + request.path,
    )

    expect(result?.response?.data).toMatchObject({
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
   *
   * It’s not clear to me, whether we need to make the void-server handle that, or
   * if we should disable the streaming, or
   * if there’s another way to test this properly.
   *
   * - @hanspagel
   */
  it.todo('sends a multipart/form-data request with files', async () => {
    const { request, example, server } = createRequestExampleServer({
      serverPayload: { url: `http://127.0.0.1:${VOID_PORT}` },
      requestPayload: { path: '', method: 'POST' },
      requestExamplePayload: {
        body: {
          activeBody: 'formData',
          formData: {
            encoding: 'form-data',
            value: [
              {
                key: 'file',
                file: new File(['hello'], 'hello.txt', { type: 'text/plain' }),
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
    })

    const result = await sendRequest(
      request,
      example,
      server?.url + request.path,
    )

    expect(result?.response?.data).toMatchObject({
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
})
