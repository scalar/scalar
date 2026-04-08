import { describe, expect, it } from 'vitest'

import type { RequestFactory } from './request-factory'
import { resolveRequestFactoryUrl } from './resolve-request-factory-url'

const createRequestFactory = (overrides: Partial<RequestFactory> = {}): RequestFactory => ({
  baseUrl: 'https://api.example.com',
  path: {
    raw: '/v1/users',
    variables: {},
  },
  method: 'GET',
  proxy: {
    proxyUrl: 'https://proxy.scalar.com',
  },
  query: {
    params: new URLSearchParams(),
  },
  headers: new Headers(),
  body: null,
  cookies: {
    list: [],
  },
  cache: 'default',
  security: [],
  ...overrides,
})

describe('resolve-request-factory-url', () => {
  it('returns a simple URL from baseUrl and path', () => {
    const request = createRequestFactory()
    const result = resolveRequestFactoryUrl(request, { envVariables: {} })

    expect(result).toBe('https://api.example.com/v1/users')
  })

  it('merges baseUrl and path correctly when baseUrl has a trailing slash', () => {
    const request = createRequestFactory({
      baseUrl: 'https://api.example.com/',
      path: { raw: '/v1/users', variables: {} },
    })
    const result = resolveRequestFactoryUrl(request, { envVariables: {} })

    expect(result).toBe('https://api.example.com/v1/users')
  })

  it('replaces path variables with encoded values', () => {
    const request = createRequestFactory({
      path: {
        raw: '/users/{userId}/posts/{postId}',
        variables: { userId: '123', postId: '456' },
      },
    })
    const result = resolveRequestFactoryUrl(request, { envVariables: {} })

    expect(result).toBe('https://api.example.com/users/123/posts/456')
  })

  it('encodes special characters in path variables', () => {
    const request = createRequestFactory({
      path: {
        raw: '/search/{query}',
        variables: { query: 'hello world' },
      },
    })
    const result = resolveRequestFactoryUrl(request, { envVariables: {} })

    expect(result).toBe('https://api.example.com/search/hello%20world')
  })

  it('adds query parameters from request.query.params', () => {
    const queryParams = new URLSearchParams()
    queryParams.set('page', '1')
    queryParams.set('limit', '10')

    const request = createRequestFactory({
      query: { params: queryParams },
    })
    const result = resolveRequestFactoryUrl(request, { envVariables: {} })

    expect(result).toBe('https://api.example.com/v1/users?page=1&limit=10')
  })

  it('adds security query parameters when security.in is query', () => {
    const request = createRequestFactory({
      security: [{ in: 'query', name: 'api_key', type: 'simple', value: 'secret123' }],
    })
    const result = resolveRequestFactoryUrl(request, { envVariables: {} })

    expect(result).toBe('https://api.example.com/v1/users?api_key=secret123')
  })

  it('ignores security parameters that are not in query', () => {
    const request = createRequestFactory({
      security: [
        { in: 'header', name: 'Authorization', type: 'bearer', value: 'token' },
        { in: 'cookie', name: 'session', type: 'simple', value: 'abc' },
      ],
    })
    const result = resolveRequestFactoryUrl(request, { envVariables: {} })

    expect(result).toBe('https://api.example.com/v1/users')
  })

  it('combines security query params and regular query params', () => {
    const queryParams = new URLSearchParams()
    queryParams.set('filter', 'active')

    const request = createRequestFactory({
      query: { params: queryParams },
      security: [{ in: 'query', name: 'token', type: 'simple', value: 'xyz' }],
    })
    const result = resolveRequestFactoryUrl(request, { envVariables: {} })

    expect(result).toBe('https://api.example.com/v1/users?token=xyz&filter=active')
  })

  it('replaces environment variables in baseUrl', () => {
    const request = createRequestFactory({
      baseUrl: '{{BASE_URL}}/api',
    })
    const result = resolveRequestFactoryUrl(request, {
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
    const result = resolveRequestFactoryUrl(request, {
      envVariables: { USER_ID: '42' },
    })

    expect(result).toBe('https://api.example.com/users/42')
  })

  it('replaces environment variables in query parameters', () => {
    const queryParams = new URLSearchParams()
    queryParams.set('{{KEY_NAME}}', '{{KEY_VALUE}}')

    const request = createRequestFactory({
      query: { params: queryParams },
    })
    const result = resolveRequestFactoryUrl(request, {
      envVariables: { KEY_NAME: 'search', KEY_VALUE: 'test' },
    })

    expect(result).toBe('https://api.example.com/v1/users?search=test')
  })

  it('replaces environment variables in security query parameters', () => {
    const request = createRequestFactory({
      security: [{ in: 'query', name: '{{PARAM_NAME}}', type: 'simple', value: '{{API_KEY}}' }],
    })
    const result = resolveRequestFactoryUrl(request, {
      envVariables: { PARAM_NAME: 'key', API_KEY: 'secret' },
    })

    expect(result).toBe('https://api.example.com/v1/users?key=secret')
  })

  it('handles empty baseUrl by using relative path', () => {
    const request = createRequestFactory({
      baseUrl: '',
      path: { raw: '/api/users', variables: {} },
    })
    const result = resolveRequestFactoryUrl(request, { envVariables: {} })

    expect(result).toBe('http://localhost:3000/api/users')
  })

  it('handles relative baseUrl with path', () => {
    const request = createRequestFactory({
      baseUrl: '/api/v2',
      path: { raw: '/users', variables: {} },
    })
    const result = resolveRequestFactoryUrl(request, { envVariables: {} })

    expect(result).toBe('http://localhost:3000/api/v2/users')
  })

  it('overwrites security query params with the same name from request.query.params', () => {
    const queryParams = new URLSearchParams()
    queryParams.set('token', 'from-query')

    const request = createRequestFactory({
      query: { params: queryParams },
      security: [{ in: 'query', name: 'token', type: 'simple', value: 'from-security' }],
    })
    const result = resolveRequestFactoryUrl(request, { envVariables: {} })

    expect(result).toBe('https://api.example.com/v1/users?token=from-query')
  })

  it('handles multiple security query parameters', () => {
    const request = createRequestFactory({
      security: [
        { in: 'query', name: 'client_id', type: 'simple', value: 'abc' },
        { in: 'query', name: 'client_secret', type: 'simple', value: 'xyz' },
      ],
    })
    const result = resolveRequestFactoryUrl(request, { envVariables: {} })

    expect(result).toBe('https://api.example.com/v1/users?client_id=abc&client_secret=xyz')
  })

  it('preserves unresolved environment variables when not provided', () => {
    const request = createRequestFactory({
      baseUrl: '{{MISSING_VAR}}',
    })
    const result = resolveRequestFactoryUrl(request, { envVariables: {} })

    expect(result).toBe('http://localhost:3000/%7B%7BMISSING_VAR%7D%7D/v1/users')
  })

  it('handles complex path with multiple variable types', () => {
    const queryParams = new URLSearchParams()
    queryParams.set('format', 'json')

    const request = createRequestFactory({
      baseUrl: '{{API_HOST}}/{{API_VERSION}}',
      path: {
        raw: '/orgs/{orgId}/repos/{repoId}',
        variables: { orgId: '{{ORG}}', repoId: 'my-repo' },
      },
      query: { params: queryParams },
      security: [{ in: 'query', name: 'auth', type: 'simple', value: '{{TOKEN}}' }],
    })
    const result = resolveRequestFactoryUrl(request, {
      envVariables: {
        API_HOST: 'https://api.github.com',
        API_VERSION: 'v3',
        ORG: 'scalar',
        TOKEN: 'ghp_xxx',
      },
    })

    expect(result).toBe('https://api.github.com/v3/orgs/scalar/repos/my-repo?auth=ghp_xxx&format=json')
  })
})
