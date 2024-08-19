/**
 * @vitest-environment jsdom
 */
import {
  type RequestExamplePayload,
  type RequestPayload,
  type ServerPayload,
  createRequest,
  createRequestExample,
  createRequestExampleParameter,
  createServer,
} from '@scalar/oas-utils/entities/spec'
import { describe, expect, it } from 'vitest'

import { sendRequest } from './sendRequest'

const PROXY_PORT = 5051
const ECHO_PORT = 5052

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
      serverPayload: { url: `http://127.0.0.1:${ECHO_PORT}` },
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
      serverPayload: { url: `http://127.0.0.1:${ECHO_PORT}` },
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
      serverPayload: { url: `http://127.0.0.1:${ECHO_PORT}` },
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
      serverPayload: { url: `http://127.0.0.1:${ECHO_PORT}` },
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
      serverPayload: { url: `http://127.0.0.1:${ECHO_PORT}?example=parameter` },
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

    expect(result?.response?.data?.query).toStrictEqual({
      example: 'parameter',
      foo: 'bar',
    })
  })

  // it('adds cookies as headers', async () => {
  //   const { request, example, server } = createRequestExampleServer({
  //     serverPayload: { url: `http://127.0.0.1:${ECHO_PORT}` },
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
  //     serverPayload: { url: `http://127.0.0.1:${ECHO_PORT}` },
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
      serverPayload: { url: `http://127.0.0.1:${ECHO_PORT}/v1` },
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
      serverPayload: { url: `http://127.0.0.1:${ECHO_PORT}/v1/` },
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

  it('sends a multipart/form-data request', async () => {
    const { request, example, server } = createRequestExampleServer({
      serverPayload: { url: `http://127.0.0.1:${ECHO_PORT}` },
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
              },
              {
                key: 'file',
                file: new File(['hello'], 'hello.txt', { type: 'text/plain' }),
              },
              {
                key: 'image',
                file: new File(['hello'], 'hello.png', { type: 'image/png' }),
                value: 'ignore me',
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
