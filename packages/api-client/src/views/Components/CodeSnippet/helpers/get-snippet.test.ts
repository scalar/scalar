import {
  type Operation,
  type RequestExample,
  type Server,
  operationSchema,
  requestExampleSchema,
  securitySchemeSchema,
  serverSchema,
} from '@scalar/oas-utils/entities/spec'
import { AVAILABLE_CLIENTS, type ClientId, type TargetId } from '@scalar/snippetz'
import { beforeEach, describe, expect, it } from 'vitest'

import { getSnippet } from './get-snippet'
import { getHarRequest } from '@/views/Components/CodeSnippet/helpers/get-har-request'

describe('getSnippet', () => {
  let operation: Operation
  let example: RequestExample
  let server: Server

  beforeEach(() => {
    operation = operationSchema.parse({
      method: 'get',
      path: '/users',
      requestBody: undefined,
    })
    example = requestExampleSchema.parse({})
    server = serverSchema.parse({
      url: 'https://example.com',
    })
  })

  it('generates a basic shell/curl example (httpsnippet-lite)', () => {
    const [error, result] = getSnippet(
      'shell',
      'curl',
      getHarRequest({
        operation,
        example,
        server,
      }),
    )

    expect(error).toBeNull()
    expect(result).toEqual('curl https://example.com/users')
  })

  it('generates a basic node/undici example (@scalar/snippetz)', () => {
    const [error, result] = getSnippet(
      'node',
      'undici',
      getHarRequest({
        operation,
        example,
        server,
      }),
    )

    expect(error).toBeNull()
    expect(result).toEqual(`import { request } from 'undici'

const { statusCode, body } = await request('https://example.com/users')`)
  })

  it('generates a basic javascript/jquery example (httpsnippet-lite)', () => {
    const [error, result] = getSnippet(
      'javascript',
      'jquery',
      getHarRequest({
        operation,
        example,
        server,
      }),
    )

    expect(error).toBeNull()
    expect(result).toEqual(`const settings = {
  async: true,
  crossDomain: true,
  url: 'https://example.com/users',
  method: 'GET',
  headers: {}
};

$.ajax(settings).done(function (response) {
  console.log(response);
});`)
  })

  it('returns an empty string if passed rubbish', () => {
    const [error, result] = getSnippet(
      'javascript',
      'invalid-client' as any,
      getHarRequest({
        operation,
        example,
        server,
      }),
    )

    expect(error).toBeDefined()
    expect(result).toBeNull()
  })

  it('shows the original path before variable replacement', () => {
    server = serverSchema.parse({
      uid: 'server-uid',
      url: '{protocol}://void.scalar.com/{path}',
      description: 'Responds with your request data',
      variables: {
        protocol: {
          enum: ['https'],
          default: 'https',
        },
        path: {
          default: '',
        },
      },
    })

    const [error, result] = getSnippet(
      'javascript',
      'fetch',
      getHarRequest({
        operation,
        example,
        server,
      }),
    )

    expect(error).toBeNull()
    expect(result).toEqual(`fetch('https://void.scalar.com/{path}/users')`)
  })

  it('should show the accept header if its not */*', () => {
    example.parameters.headers.push({
      key: 'Accept',
      value: 'application/json',
      enabled: true,
    })

    const [error, result] = getSnippet(
      'javascript',
      'fetch',
      getHarRequest({
        operation,
        example,
        server,
      }),
    )

    expect(error).toBeNull()
    expect(result).toEqual(`fetch('https://example.com/users', {
  headers: {
    Accept: 'application/json'
  }
})`)
  })

  it('show should show the cookies', async () => {
    example.parameters.cookies.push({
      key: 'sessionId',
      value: 'abc123',
      enabled: true,
    })

    const [error, result] = await getSnippet(
      'javascript',
      'fetch',
      getHarRequest({
        operation,
        example,
        server,
      }),
    )

    expect(error).toBeNull()
    expect(result).toEqual(`fetch('https://example.com/users', {
  headers: {
    'Set-Cookie': 'sessionId=abc123'
  }
})`)
  })

  it('should show the headers', () => {
    example.parameters.headers.push({
      key: 'x-scalar-token',
      value: 'abc123',
      enabled: true,
    })

    const [error, result] = getSnippet(
      'javascript',
      'fetch',
      getHarRequest({
        operation,
        example,
        server,
      }),
    )

    expect(error).toBeNull()
    expect(result).toEqual(`fetch('https://example.com/users', {
  headers: {
    'X-Scalar-Token': 'abc123'
  }
})`)
  })

  it('should show the query parameters', () => {
    example.parameters.query.push({
      key: 'query-param',
      value: 'query-value',
      enabled: true,
    })

    const [error, result] = getSnippet(
      'javascript',
      'fetch',
      getHarRequest({
        operation,
        example,
        server,
      }),
    )

    expect(error).toBeNull()
    expect(result).toEqual(`fetch('https://example.com/users?query-param=query-value')`)
  })

  it('should show the security headers, cookies and query', async () => {
    const [error, result] = getSnippet(
      'javascript',
      'fetch',
      getHarRequest({
        operation,
        example,
        server,
        securitySchemes: [
          securitySchemeSchema.parse({
            name: 'x-cookie-token',
            type: 'apiKey',
            in: 'cookie',
          }),
          securitySchemeSchema.parse({
            name: 'x-header-token',
            type: 'apiKey',
            in: 'header',
            value: '22222',
          }),
          securitySchemeSchema.parse({
            name: 'query-api-key',
            type: 'apiKey',
            in: 'query',
            value: '33333',
          }),
          securitySchemeSchema.parse({
            name: 'cookie-api-key',
            type: 'http',
            scheme: 'bearer',
            token: '44444',
          }),
        ],
      }),
    )

    expect(error).toBeNull()
    expect(result).toEqual(`fetch('https://example.com/users?query-api-key=33333', {
  headers: {
    'X-Header-Token': '22222',
    Authorization: 'Bearer 44444',
    'Set-Cookie': 'x-cookie-token=YOUR_SECRET_TOKEN'
  }
})`)
  })

  it('should include the invalid url', () => {
    const [error, result] = getSnippet(
      'c',
      'libcurl',
      getHarRequest({
        operation,
        example,
      }),
    )

    expect(error).toBeNull()
    expect(result).toEqual(`CURL *hnd = curl_easy_init();

curl_easy_setopt(hnd, CURLOPT_CUSTOMREQUEST, "GET");
curl_easy_setopt(hnd, CURLOPT_URL, "/users");

CURLcode ret = curl_easy_perform(hnd);`)
  })

  describe('it should generate a snipped without a proper URL for every client', () => {
    AVAILABLE_CLIENTS.forEach((id) => {
      it(id, () => {
        operation.path = '/super-secret-path'
        const [target, client] = id.split('/') as [TargetId, ClientId<TargetId>]
        const [error, result] = getSnippet(
          target,
          client,
          getHarRequest({
            operation,
            example,
          }),
        )

        expect(error).toBeNull()
        expect(result).toContain('/super-secret-path')
      })
    })
  })
})
