import {
  type Operation,
  type RequestExample,
  type Server,
  operationSchema,
  requestExampleSchema,
  securitySchemeSchema,
  serverSchema,
} from '@scalar/oas-utils/entities/spec'
import { AVAILABLE_CLIENTS, type ClientId, type TargetId, snippetz } from '@scalar/snippetz'
import { plugins } from '@scalar/snippetz/clients'
import { describe, expect, it } from 'vitest'

import { getHarRequest } from '@/views/Components/CodeSnippet/helpers/get-har-request'

import { getSnippet } from './get-snippet'

const s = snippetz(plugins)

describe('getSnippet', () => {
  // Helper functions to create fresh instances
  const createOperation = (overrides: Partial<Operation> = {}): Operation =>
    operationSchema.parse({
      method: 'get',
      path: '/users',
      requestBody: undefined,
      ...overrides,
    })

  const createExample = (overrides: Partial<RequestExample> = {}): RequestExample => {
    const example = requestExampleSchema.parse({
      ...overrides,
    })

    // Deep clone the parameters to avoid shared references
    return {
      ...example,
      parameters: {
        ...example.parameters,
        headers: example.parameters.headers.map((h) => ({ ...h })),
        cookies: example.parameters.cookies.map((c) => ({ ...c })),
        query: example.parameters.query.map((q) => ({ ...q })),
        path: example.parameters.path.map((p) => ({ ...p })),
      },
    }
  }

  const createServer = (overrides: Partial<Server> = {}): Server =>
    serverSchema.parse({
      url: 'https://example.com',
      ...overrides,
    })

  it('generates a basic shell/curl example (httpsnippet-lite)', async () => {
    const [error, result] = await getSnippet(
      s,
      'shell',
      'curl',
      getHarRequest({
        operation: createOperation(),
        example: createExample(),
        server: createServer(),
      }),
    )

    expect(error).toBeNull()
    expect(result).toEqual('curl https://example.com/users')
  })

  it('generates a basic node/undici example (@scalar/snippetz)', async () => {
    const [error, result] = await getSnippet(
      s,
      'node',
      'undici',
      getHarRequest({
        operation: createOperation(),
        example: createExample(),
        server: createServer(),
      }),
    )

    expect(error).toBeNull()
    expect(result).toMatchInlineSnapshot(`
      "import { request } from 'undici'

      const { statusCode, body } = await request('https://example.com/users')"
    `)
  })

  it('generates a basic javascript/jquery example (httpsnippet-lite)', async () => {
    const [error, result] = await getSnippet(
      s,
      'javascript',
      'jquery',
      getHarRequest({
        operation: createOperation(),
        example: createExample(),
        server: createServer(),
      }),
    )

    expect(error).toBeNull()
    expect(result).toMatchInlineSnapshot(`
      "const settings = {
        async: true,
        crossDomain: true,
        url: 'https://example.com/users',
        method: 'GET',
        headers: {}
      };

      $.ajax(settings).done(function (response) {
        console.log(response);
      });"
    `)
  })

  it('returns an empty string if passed rubbish', async () => {
    const [error, result] = await getSnippet(
      s,
      'javascript',
      'invalid-client' as any,
      getHarRequest({
        operation: createOperation(),
        example: createExample(),
        server: createServer(),
      }),
    )

    expect(error).toBeDefined()
    expect(result).toBeNull()
  })

  it('shows the original path before variable replacement', async () => {
    const server = createServer({
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

    const [error, result] = await getSnippet(
      s,
      'javascript',
      'fetch',
      getHarRequest({
        operation: createOperation(),
        example: createExample(),
        server,
      }),
    )

    expect(error).toBeNull()
    expect(result).toEqual(`fetch('https://void.scalar.com/{path}/users')`)
  })

  it('should show the accept header if its not */*', async () => {
    const example = createExample()
    example.parameters.headers.push({
      key: 'Accept',
      value: 'application/json',
      enabled: true,
    })

    const [error, result] = await getSnippet(
      s,
      'javascript',
      'fetch',
      getHarRequest({
        operation: createOperation(),
        example,
        server: createServer(),
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
    const example = createExample()
    example.parameters.cookies.push({
      key: 'sessionId',
      value: 'abc123',
      enabled: true,
    })

    const [error, result] = await getSnippet(
      s,
      'javascript',
      'fetch',
      getHarRequest({
        operation: createOperation(),
        example,
        server: createServer(),
      }),
    )

    expect(error).toBeNull()
    expect(result).toEqual(`fetch('https://example.com/users', {
  headers: {
    'Set-Cookie': 'sessionId=abc123'
  }
})`)
  })

  it('should show the headers', async () => {
    const example = createExample()
    example.parameters.headers.push({
      key: 'x-scalar-token',
      value: 'abc123',
      enabled: true,
    })

    const [error, result] = await getSnippet(
      s,
      'javascript',
      'fetch',
      getHarRequest({
        operation: createOperation(),
        example,
        server: createServer(),
      }),
    )

    expect(error).toBeNull()
    expect(result).toEqual(`fetch('https://example.com/users', {
  headers: {
    'X-Scalar-Token': 'abc123'
  }
})`)
  })

  it('should show the query parameters', async () => {
    const example = createExample()
    example.parameters.query.push({
      key: 'query-param',
      value: 'query-value',
      enabled: true,
    })

    const [error, result] = await getSnippet(
      s,
      'javascript',
      'fetch',
      getHarRequest({
        operation: createOperation(),
        example,
        server: createServer(),
      }),
    )

    expect(error).toBeNull()
    expect(result).toEqual(`fetch('https://example.com/users?query-param=query-value')`)
  })

  it('should show the security headers, cookies and query', async () => {
    const [error, result] = await getSnippet(
      s,
      'javascript',
      'fetch',
      getHarRequest({
        operation: createOperation(),
        example: createExample(),
        server: createServer(),
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
    expect(result).toMatchInlineSnapshot(`
      "fetch('https://example.com/users?query-api-key=33333', {
        headers: {
          'X-Header-Token': '22222',
          Authorization: 'Bearer 44444',
          'Set-Cookie': 'x-cookie-token=YOUR_SECRET_TOKEN'
        }
      })"
    `)
  })

  it('should include the invalid url', async () => {
    const [error, result] = await getSnippet(
      s,
      'c',
      'libcurl',
      getHarRequest({
        operation: createOperation(),
        example: createExample(),
      }),
    )

    expect(error).toBeNull()
    expect(result).toMatchInlineSnapshot(`
      "CURL *hnd = curl_easy_init();

      curl_easy_setopt(hnd, CURLOPT_CUSTOMREQUEST, "GET");
      curl_easy_setopt(hnd, CURLOPT_URL, "/users");

      CURLcode ret = curl_easy_perform(hnd);"
    `)
  })

  describe('it should generate a snipped without a proper URL for every client', () => {
    AVAILABLE_CLIENTS.forEach((id) => {
      it(id, async () => {
        const operation = createOperation({ path: '/super-secret-path' })
        const [target, client] = id.split('/') as [TargetId, ClientId<TargetId>]
        const [error, result] = await getSnippet(
          s,
          target,
          client,
          getHarRequest({
            operation,
            example: createExample(),
          }),
        )

        expect(error).toBeNull()
        expect(result).toContain('/super-secret-path')
      })
    })
  })
})
