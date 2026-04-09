import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { ExampleObject } from '@scalar/workspace-store/schemas/v3.1/strict/example'
import type { ParameterObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/server'
import { assert, describe, expect, it } from 'vitest'

import type { SecuritySchemeObjectSecret } from '@/request-example/builder/security/secret-types'

import { requestFactory } from './request-factory'

type ExtendedParameter = ParameterObject & { value: string }

const createParameter = (
  overrides: Partial<ExtendedParameter> & Pick<ExtendedParameter, 'name' | 'in' | 'value'>,
  examples?: Record<string, ExampleObject>,
): ExtendedParameter =>
  ({
    required: true,
    ...(examples && { examples }),
    ...overrides,
  }) as ExtendedParameter

const emptyEnvironment: XScalarEnvironment = {
  color: '#FFFFFF',
  variables: [],
}

type FactoryArgs = Parameters<typeof requestFactory>[0]

const createBaseArgs = (overrides: Partial<FactoryArgs> = {}): FactoryArgs => ({
  path: '/v1/users',
  method: 'get',
  exampleName: 'default',
  environment: emptyEnvironment,
  globalCookies: [],
  proxyUrl: 'https://proxy.scalar.com',
  server: null,
  defaultHeaders: {},
  isElectron: false,
  selectedSecuritySchemes: [],
  operation: { parameters: [] },
  ...overrides,
})

describe('requestFactory', () => {
  it('returns a factory with empty base URL when server is null', () => {
    const { request } = requestFactory(createBaseArgs())

    expect(request.baseUrl).toBe('')
    expect(request.path.raw).toBe('/v1/users')
    expect(request.method).toBe('GET')
    expect(request.body).toBe(null)
    expect(request.cache).toBe('default')
    expect(request.security).toEqual([])
    expect(request.cookies).toEqual([])
    expect(request.query.toString()).toBe('')
    expect(request.path.variables).toEqual({})
    expect(request.proxyUrl).toBe('https://proxy.scalar.com')
    expect(request.options?.isElectron).toBe(false)
    expect(request.allowedReservedQueryParameters?.size).toBe(0)
  })

  it('resolves server URL template using server variable defaults', () => {
    const server: ServerObject = {
      url: 'https://{region}.example.com',
      variables: {
        region: {
          default: 'eu',
          enum: ['eu', 'us'],
        },
      },
    }

    const { request } = requestFactory(createBaseArgs({ server }))

    expect(request.baseUrl).toBe('https://eu.example.com')
  })

  it('uses a static server URL when there are no variables', () => {
    const server: ServerObject = {
      url: 'https://api.example.com/v1',
    }

    const { request } = requestFactory(createBaseArgs({ server }))

    expect(request.baseUrl).toBe('https://api.example.com/v1')
  })

  it('merges default headers with parameter headers and lets parameters override defaults', () => {
    const { request } = requestFactory(
      createBaseArgs({
        defaultHeaders: {
          Accept: 'application/json',
          'X-Shared': 'from-default',
        },
        operation: {
          parameters: [
            createParameter(
              { name: 'X-Shared', in: 'header', value: 'from-param' },
              { default: { value: 'from-param' } },
            ),
            createParameter({ name: 'X-Api-Key', in: 'header', value: 'secret' }, { default: { value: 'secret' } }),
          ],
        } as OperationObject,
      }),
    )

    expect(request.headers.get('Accept')).toBe('application/json')
    expect(request.headers.get('X-Shared')).toBe('from-param')
    expect(request.headers.get('X-Api-Key')).toBe('secret')
  })

  it('does not build a body for GET even when the operation defines a request body', () => {
    const { request } = requestFactory(
      createBaseArgs({
        method: 'get',
        operation: {
          parameters: [],
          requestBody: {
            content: {
              'application/json': {
                examples: {
                  default: { value: '{"a":1}' },
                },
              },
            },
          },
        } as OperationObject,
      }),
    )

    expect(request.body).toBe(null)
  })

  it('builds a JSON body for POST when an example exists', () => {
    const { request } = requestFactory(
      createBaseArgs({
        method: 'post',
        operation: {
          requestBody: {
            content: {
              'application/json': {
                examples: {
                  default: { value: '{"name":"Ada"}' },
                },
              },
            },
          },
        } as OperationObject,
      }),
    )

    expect(request.body).toEqual({
      mode: 'raw',
      value: '{"name":"Ada"}',
    })
  })

  it('builds a body for DELETE when the method allows a body', () => {
    const { request } = requestFactory(
      createBaseArgs({
        method: 'delete',
        operation: {
          requestBody: {
            content: {
              'application/json': {
                examples: {
                  default: { value: '{}' },
                },
              },
            },
          },
        } as OperationObject,
      }),
    )

    expect(request.body).toEqual({
      mode: 'raw',
      value: '{}',
    })
  })

  it('normalizes the method to uppercase', () => {
    const methods: HttpMethod[] = ['post', 'patch', 'put']

    for (const method of methods) {
      const { request } = requestFactory(createBaseArgs({ method }))
      expect(request.method).toBe(method.toUpperCase())
    }
  })

  it('removes Content-Type when the body is multipart form-data so the runtime can set the boundary', () => {
    const { request } = requestFactory(
      createBaseArgs({
        method: 'post',
        defaultHeaders: {
          'Content-Type': 'application/json',
        },
        operation: {
          requestBody: {
            content: {
              'multipart/form-data': {
                examples: {
                  default: {
                    value: [{ name: 'note', value: 'hello' }],
                  },
                },
              },
            },
          },
        } as OperationObject,
      }),
    )

    assert(request.body?.mode === 'formdata')
    expect(request.headers.get('Content-Type')).toBe(null)
  })

  it('removes Content-Type when the body is URL-encoded', () => {
    const { request } = requestFactory(
      createBaseArgs({
        method: 'post',
        defaultHeaders: {
          'Content-Type': 'text/plain',
        },
        operation: {
          requestBody: {
            content: {
              'application/x-www-form-urlencoded': {
                examples: {
                  default: {
                    value: [{ name: 'a', value: '1' }],
                  },
                },
              },
            },
          },
        } as OperationObject,
      }),
    )

    assert(request.body?.mode === 'urlencoded')
    expect(request.headers.get('Content-Type')).toBe(null)
  })

  it('keeps Content-Type for a raw JSON body', () => {
    const { request } = requestFactory(
      createBaseArgs({
        method: 'post',
        defaultHeaders: {
          'Content-Type': 'application/json',
        },
        operation: {
          requestBody: {
            content: {
              'application/json': {
                examples: {
                  default: { value: '{}' },
                },
              },
            },
          },
        } as OperationObject,
      }),
    )

    assert(request.body?.mode === 'raw')
    expect(request.headers.get('Content-Type')).toBe('application/json')
  })

  it('forwards requestBodyCompositionSelection into buildRequestBody', () => {
    const { request } = requestFactory(
      createBaseArgs({
        method: 'post',
        requestBodyCompositionSelection: {
          'requestBody.anyOf': 1,
        },
        operation: {
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  __scalar_: '',
                  anyOf: [
                    {
                      type: 'object',
                      properties: {
                        branch: { type: 'string', default: 'a' },
                      },
                    },
                    {
                      type: 'object',
                      properties: {
                        branch: { type: 'string', default: 'b' },
                      },
                    },
                  ],
                },
              },
            },
          },
        } as OperationObject,
      }),
    )

    assert(request.body?.mode === 'raw')
    expect(typeof request.body.value).toBe('string')
    expect(request.body.value).toContain('b')
  })

  it('sets X-Scalar-User-Agent from User-Agent when running in Electron', () => {
    const { request } = requestFactory(
      createBaseArgs({
        isElectron: true,
        defaultHeaders: {
          'User-Agent': 'ScalarTest/1.0',
        },
      }),
    )

    expect(request.headers.get('X-Scalar-User-Agent')).toBe('ScalarTest/1.0')
    expect(request.options?.isElectron).toBe(true)
  })

  it('does not set X-Scalar-User-Agent in Electron when User-Agent is absent', () => {
    const { request } = requestFactory(
      createBaseArgs({
        isElectron: true,
        defaultHeaders: {},
      }),
    )

    expect(request.headers.get('X-Scalar-User-Agent')).toBe(null)
  })

  it('merges workspace cookies with cookies produced from operation parameters', () => {
    const { request } = requestFactory(
      createBaseArgs({
        globalCookies: [
          {
            name: 'workspace',
            value: 'w1',
            domain: 'example.com',
          },
        ],
        operation: {
          parameters: [createParameter({ name: 'fromParam', in: 'cookie', value: 'p1' }, { default: { value: 'p1' } })],
        } as OperationObject,
      }),
    )

    expect(request.cookies).toHaveLength(2)
    expect(request.cookies[0]).toMatchObject({ name: 'workspace', value: 'w1', isDisabled: false })
    expect(request.cookies[1]).toMatchObject({ name: 'fromParam', value: 'p1' })
  })

  it('marks a global cookie disabled when x-scalar-disable-parameters targets it for the active example', () => {
    const { request } = requestFactory(
      createBaseArgs({
        exampleName: 'default',
        globalCookies: [
          {
            name: 'Session',
            value: 'abc',
            domain: 'api.example.com',
          },
        ],
        operation: {
          parameters: [],
          'x-scalar-disable-parameters': {
            'global-cookies': {
              default: {
                session: true,
              },
            },
          },
        } as OperationObject,
      }),
    )

    expect(request.cookies[0]?.isDisabled).toBe(true)
  })

  it('does not apply global-cookie disables from a different example key', () => {
    const { request } = requestFactory(
      createBaseArgs({
        exampleName: 'staging',
        globalCookies: [
          {
            name: 'Session',
            value: 'abc',
            domain: 'api.example.com',
          },
        ],
        operation: {
          parameters: [],
          'x-scalar-disable-parameters': {
            'global-cookies': {
              default: {
                session: true,
              },
            },
          },
        } as OperationObject,
      }),
    )

    expect(request.cookies[0]?.isDisabled).toBe(false)
  })

  it('preserves isDisabled on a global cookie when already set', () => {
    const { request } = requestFactory(
      createBaseArgs({
        globalCookies: [
          {
            name: 'a',
            value: '1',
            domain: 'x.com',
            isDisabled: true,
          },
        ],
      }),
    )

    expect(request.cookies[0]?.isDisabled).toBe(true)
  })

  it('uses no-store cache and no-cache headers when Accept is text/event-stream', () => {
    const { request } = requestFactory(
      createBaseArgs({
        defaultHeaders: {
          Accept: 'text/event-stream',
        },
      }),
    )

    expect(request.cache).toBe('no-store')
    expect(request.headers.get('Cache-Control')).toBe('no-cache')
    expect(request.headers.get('Pragma')).toBe('no-cache')
  })

  it('detects SSE accept values case-insensitively', () => {
    const { request } = requestFactory(
      createBaseArgs({
        defaultHeaders: {
          Accept: 'Text/Event-Stream; charset=utf-8',
        },
      }),
    )

    expect(request.cache).toBe('no-store')
  })

  it('leaves cache as default when Accept is not event-stream', () => {
    const { request } = requestFactory(
      createBaseArgs({
        defaultHeaders: {
          Accept: 'application/json',
        },
      }),
    )

    expect(request.cache).toBe('default')
    expect(request.headers.get('Pragma')).toBe(null)
  })

  it('maps selected security schemes through buildRequestSecurity', () => {
    const selected: SecuritySchemeObjectSecret[] = [
      {
        type: 'apiKey',
        name: 'X-Token',
        in: 'header',
        'x-scalar-secret-token': 'hdr',
      } as SecuritySchemeObjectSecret,
      {
        type: 'apiKey',
        name: 'token',
        in: 'query',
        'x-scalar-secret-token': 'qry',
      } as SecuritySchemeObjectSecret,
      {
        type: 'apiKey',
        name: 'sid',
        in: 'cookie',
        'x-scalar-secret-token': 'ck',
      } as SecuritySchemeObjectSecret,
      {
        type: 'http',
        scheme: 'basic',
        'x-scalar-secret-username': 'u',
        'x-scalar-secret-password': 'p',
      } as SecuritySchemeObjectSecret,
      {
        type: 'http',
        scheme: 'bearer',
        'x-scalar-secret-token': 'jwt',
      } as SecuritySchemeObjectSecret,
    ]

    const { request } = requestFactory(createBaseArgs({ selectedSecuritySchemes: selected }))

    expect(request.security).toEqual([
      { in: 'header', name: 'X-Token', value: 'hdr' },
      { in: 'query', name: 'token', value: 'qry' },
      { in: 'cookie', name: 'sid', value: 'ck' },
      { in: 'header', name: 'Authorization', format: 'basic', value: 'u:p' },
      { in: 'header', name: 'Authorization', format: 'bearer', value: 'jwt' },
    ])
  })

  it('exposes path variables and query params from parameters', () => {
    const { request } = requestFactory(
      createBaseArgs({
        path: '/items/{id}',
        operation: {
          parameters: [
            createParameter({ name: 'id', in: 'path', value: '42' }, { default: { value: '42' } }),
            createParameter({ name: 'q', in: 'query', value: 'find' }, { default: { value: 'find' } }),
          ],
        } as OperationObject,
      }),
    )

    expect(request.path.variables.id).toBe('42')
    expect(request.query.get('q')).toBe('find')
  })

  it('forwards allowReservedQueryParameters from buildRequestParameters', () => {
    const { request } = requestFactory(
      createBaseArgs({
        operation: {
          parameters: [
            {
              name: 'sort',
              in: 'query',
              required: true,
              allowReserved: true,
              schema: { type: 'string' },
              examples: {
                default: { value: 'name:asc', 'x-disabled': false },
              },
            },
          ] satisfies ParameterObject[],
        } as OperationObject,
      }),
    )

    expect(request.allowedReservedQueryParameters?.has('sort')).toBe(true)
    expect(request.query.get('sort')).toBe('name:asc')
  })
})
