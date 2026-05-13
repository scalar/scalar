import { afterEach, describe, expect, it, vi } from 'vitest'

import type { RequestFactory } from './request-factory'
import {
  INVALID_REQUEST_FACTORY_URL,
  MISSING_REQUEST_SERVER_BASE,
  resolveRequestFactoryUrl,
} from './resolve-request-factory-url'

const defaultOptions = { envVariables: {}, securityQueryParams: new URLSearchParams() }

const unwrap = (request: RequestFactory, options: Parameters<typeof resolveRequestFactoryUrl>[1]) => {
  const merged = resolveRequestFactoryUrl(request, {
    ...options,
    allowMissingRequestServerBase: options.allowMissingRequestServerBase ?? true,
  })
  expect(merged.ok).toBe(true)
  if (!merged.ok) {
    throw new Error('expected resolveRequestFactoryUrl ok')
  }
  return merged.data
}

const createRequestFactory = (overrides: Partial<RequestFactory> = {}): RequestFactory => ({
  options: {},
  baseUrl: 'https://api.example.com',
  path: {
    raw: '/v1/users',
    variables: {},
  },
  method: 'GET',
  proxyUrl: 'https://proxy.scalar.com',
  query: new URLSearchParams(),
  headers: new Headers(),
  body: null,
  cookies: [],
  cache: 'default',
  security: [],
  ...overrides,
})

describe('resolve-request-factory-url', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns a simple URL from baseUrl and path', () => {
    const request = createRequestFactory()
    const result = unwrap(request, defaultOptions)

    expect(result).toBe('https://api.example.com/v1/users')
  })

  it('returns a simple URL from baseUrl and path when in iframe srcdoc', () => {
    vi.stubGlobal('window', {
      location: {
        // Yep, JS returns 'null' as a string for origin when in iframe srcdoc
        origin: 'null',
        href: 'about:srcdoc',
        protocol: 'about:',
        pathname: 'srcdoc',
      },
    })

    const request = createRequestFactory()
    const result = unwrap(request, defaultOptions)

    expect(result).toBe('https://api.example.com/v1/users')
  })

  it('merges baseUrl and path correctly when baseUrl has a trailing slash', () => {
    const request = createRequestFactory({
      baseUrl: 'https://api.example.com/',
      path: { raw: '/v1/users', variables: {} },
    })
    const result = unwrap(request, defaultOptions)

    expect(result).toBe('https://api.example.com/v1/users')
  })

  it('replaces path variables with encoded values', () => {
    const request = createRequestFactory({
      path: {
        raw: '/users/{userId}/posts/{postId}',
        variables: { userId: '123', postId: '456' },
      },
    })
    const result = unwrap(request, defaultOptions)

    expect(result).toBe('https://api.example.com/users/123/posts/456')
  })

  it('encodes special characters in path variables', () => {
    const request = createRequestFactory({
      path: {
        raw: '/search/{query}',
        variables: { query: 'hello world' },
      },
    })
    const result = unwrap(request, defaultOptions)

    expect(result).toBe('https://api.example.com/search/hello%20world')
  })

  it('adds query parameters from request.query', () => {
    const query = new URLSearchParams()
    query.set('page', '1')
    query.set('limit', '10')

    const request = createRequestFactory({ query })
    const result = unwrap(request, defaultOptions)

    expect(result).toBe('https://api.example.com/v1/users?page=1&limit=10')
  })

  it('preserves repeated query parameters for exploded arrays', () => {
    const query = new URLSearchParams()
    query.append('bbox', '13')
    query.append('bbox', '48')
    query.append('bbox', '18')
    query.append('bbox', '52')

    const request = createRequestFactory({ query })
    const result = unwrap(request, defaultOptions)

    expect(result).toBe('https://api.example.com/v1/users?bbox=13&bbox=48&bbox=18&bbox=52')
  })

  it('adds security query parameters from options.securityQueryParams', () => {
    const securityQueryParams = new URLSearchParams()
    securityQueryParams.set('api_key', 'secret123')

    const request = createRequestFactory()
    const result = unwrap(request, {
      envVariables: {},
      securityQueryParams,
    })

    expect(result).toBe('https://api.example.com/v1/users?api_key=secret123')
  })

  it('does not add security query params when securityQueryParams is empty', () => {
    const request = createRequestFactory()
    const result = unwrap(request, defaultOptions)

    expect(result).toBe('https://api.example.com/v1/users')
  })

  it('combines security query params and regular query params', () => {
    const query = new URLSearchParams()
    query.set('filter', 'active')

    const securityQueryParams = new URLSearchParams()
    securityQueryParams.set('token', 'xyz')

    const request = createRequestFactory({ query })
    const result = unwrap(request, {
      envVariables: {},
      securityQueryParams,
    })

    expect(result).toBe('https://api.example.com/v1/users?filter=active&token=xyz')
  })

  it('replaces environment variables in baseUrl', () => {
    const request = createRequestFactory({
      baseUrl: '{{BASE_URL}}/api',
    })
    const result = unwrap(request, {
      ...defaultOptions,
      envVariables: { BASE_URL: 'https://staging.example.com' },
    })

    expect(result).toBe('https://staging.example.com/api/v1/users')
  })

  it('replaces environment variables in path variables', () => {
    const request = createRequestFactory({
      path: {
        raw: '/users/{userId}',
        variables: { userId: '{{USER_ID}}' },
      },
    })
    const result = unwrap(request, {
      ...defaultOptions,
      envVariables: { USER_ID: '42' },
    })

    expect(result).toBe('https://api.example.com/users/42')
  })

  it('replaces environment variables directly in the raw path', () => {
    const request = createRequestFactory({
      path: {
        raw: '/{{version}}/users/{{userId}}',
        variables: {},
      },
    })
    const result = unwrap(request, {
      ...defaultOptions,
      envVariables: { version: 'v2', userId: '42' },
    })

    expect(result).toBe('https://api.example.com/v2/users/42')
  })

  it('replaces environment variables in query parameters', () => {
    const query = new URLSearchParams()
    query.set('{{KEY_NAME}}', '{{KEY_VALUE}}')

    const request = createRequestFactory({ query })
    const result = unwrap(request, {
      ...defaultOptions,
      envVariables: { KEY_NAME: 'search', KEY_VALUE: 'test' },
    })

    expect(result).toBe('https://api.example.com/v1/users?search=test')
  })

  it('handles empty baseUrl by using relative path', () => {
    const request = createRequestFactory({
      baseUrl: '',
      path: { raw: '/api/users', variables: {} },
    })
    const result = unwrap(request, defaultOptions)

    expect(result).toBe('http://localhost:3000/api/users')
  })

  it('handles relative baseUrl with path', () => {
    const request = createRequestFactory({
      baseUrl: '/api/v2',
      path: { raw: '/users', variables: {} },
    })
    const result = unwrap(request, defaultOptions)

    expect(result).toBe('http://localhost:3000/api/v2/users')
  })

  it('lets security query params overwrite operation query params with the same name', () => {
    const query = new URLSearchParams()
    query.set('token', 'from-query')

    const securityQueryParams = new URLSearchParams()
    securityQueryParams.set('token', 'from-security')

    const request = createRequestFactory({ query })
    const result = unwrap(request, {
      envVariables: {},
      securityQueryParams,
    })

    expect(result).toBe('https://api.example.com/v1/users?token=from-security')
  })

  it('handles multiple security query parameters', () => {
    const securityQueryParams = new URLSearchParams()
    securityQueryParams.set('client_id', 'abc')
    securityQueryParams.set('client_secret', 'xyz')

    const request = createRequestFactory()
    const result = unwrap(request, {
      envVariables: {},
      securityQueryParams,
    })

    expect(result).toBe('https://api.example.com/v1/users?client_id=abc&client_secret=xyz')
  })

  it('preserves unresolved environment variables when not provided', () => {
    const request = createRequestFactory({
      baseUrl: '{{MISSING_VAR}}',
    })
    const result = unwrap(request, defaultOptions)

    expect(result).toBe('http://localhost:3000/%7B%7BMISSING_VAR%7D%7D/v1/users')
  })

  it('handles complex path with multiple variable types', () => {
    const query = new URLSearchParams()
    query.set('format', 'json')

    const securityQueryParams = new URLSearchParams()
    securityQueryParams.set('auth', 'ghp_xxx')

    const request = createRequestFactory({
      baseUrl: '{{API_HOST}}/{{API_VERSION}}',
      path: {
        raw: '/orgs/{orgId}/repos/{repoId}',
        variables: { orgId: '{{ORG}}', repoId: 'my-repo' },
      },
      query,
    })
    const result = unwrap(request, {
      envVariables: {
        API_HOST: 'https://api.github.com',
        API_VERSION: 'v3',
        ORG: 'scalar',
      },
      securityQueryParams,
    })

    expect(result).toBe('https://api.github.com/v3/orgs/scalar/repos/my-repo?format=json&auth=ghp_xxx')
  })

  it('returns err for path-only merged url (no server base)', () => {
    const result = resolveRequestFactoryUrl(
      createRequestFactory({
        baseUrl: '',
        path: { raw: '/v1/users', variables: {} },
      }),
      { ...defaultOptions, allowMissingRequestServerBase: false },
    )
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe(MISSING_REQUEST_SERVER_BASE)
    }
  })

  it('returns err when a path variable cannot be percent-encoded', () => {
    const result = resolveRequestFactoryUrl(
      createRequestFactory({
        path: {
          raw: '/users/{id}',
          variables: { id: '\uD800' },
        },
      }),
      { ...defaultOptions, allowMissingRequestServerBase: true },
    )
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe(INVALID_REQUEST_FACTORY_URL)
    }
  })
})
