import {
  type Operation,
  type RequestExample,
  type Server,
  operationSchema,
  requestExampleSchema,
  securitySchemeSchema,
  serverSchema,
} from '@scalar/oas-utils/entities/spec'
import { AVAILABLE_CLIENTS } from '@scalar/snippetz'
import { beforeEach, describe, expect, it } from 'vitest'

import { getExampleCode } from './get-example-code'

describe('getExampleCode', () => {
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
    const result = getExampleCode(operation, example, 'shell', 'curl', server)

    expect(result).toEqual('curl https://example.com/users')
  })

  it('generates a basic node/undici example (@scalar/snippetz)', () => {
    const result = getExampleCode(operation, example, 'node', 'undici', server)

    expect(result).toEqual(`import { request } from 'undici'

const { statusCode, body } = await request('https://example.com/users')`)
  })

  it('generates a basic javascript/jquery example (httpsnippet-lite)', () => {
    const result = getExampleCode(
      operation,
      example,
      'javascript',
      'jquery',
      server,
    )

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
    const result = getExampleCode(operation, example, 'fantasy', 'blue', server)

    expect(result).toBe('')
  })

  it('returns an empty string if passed undefined target', () => {
    const result = getExampleCode(
      operation,
      example,
      // @ts-expect-error passing in rubbish
      undefined,
      'blue',
      server,
    )

    expect(result).toBe('')
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

    const result = getExampleCode(
      operation,
      example,
      'javascript',
      'fetch',
      server,
    )

    expect(result).toEqual(
      `fetch('http://localhost:3000/{protocol}://void.scalar.com/{path}/users')`,
    )
  })

  it('should show the accept header if its not */*', () => {
    example.parameters.headers.push({
      key: 'Accept',
      value: 'application/json',
      enabled: true,
    })

    const result = getExampleCode(
      operation,
      example,
      'javascript',
      'fetch',
      server,
    )

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

    const result = await getExampleCode(
      operation,
      example,
      'javascript',
      'fetch',
      server,
    )

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

    const result = getExampleCode(
      operation,
      example,
      'javascript',
      'fetch',
      server,
    )

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

    const result = getExampleCode(
      operation,
      example,
      'javascript',
      'fetch',
      server,
    )

    expect(result).toEqual(
      `fetch('https://example.com/users?query-param=query-value')`,
    )
  })

  it('should show the security headers, cookies and query', async () => {
    const result = getExampleCode(
      operation,
      example,
      'javascript',
      'fetch',
      server,
      [
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
    )

    expect(result)
      .toEqual(`fetch('https://example.com/users?query-api-key=33333', {
  headers: {
    'X-Header-Token': '22222',
    Authorization: 'Bearer 44444',
    'Set-Cookie': 'x-cookie-token=YOUR_SECRET_TOKEN'
  }
})`)
  })

  describe('it should generate a snipped without a proper URL', () => {
    AVAILABLE_CLIENTS.forEach((target) => {
      it(target, () => {
        operation.path = '/stuff'
        getExampleCode(
          operation,
          example,
          target.split('/')[0],
          target.split('/')[1],
          undefined,
        )
      })
    })
  })
})
