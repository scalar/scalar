import { encode as encodeBase64 } from 'js-base64'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { RequestFactory } from '@/request-example/builder/request-factory'

import { buildRequest } from './build-request'

const createFactory = (overrides: Partial<RequestFactory> = {}): RequestFactory => ({
  options: {},
  allowedReservedQueryParameters: new Set(),
  baseUrl: 'https://api.example.com',
  body: null,
  cache: 'default',
  cookies: [],
  headers: new Headers(),
  method: 'GET',
  path: { raw: '/users', variables: {} },
  proxyUrl: '',
  query: new URLSearchParams(),
  security: [],
  ...overrides,
})

describe('buildRequest', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns a url, requestInit, AbortController, and isUsingProxy flag', () => {
    const factory = createFactory()
    const { requestPayload, controller, isUsingProxy } = buildRequest(factory, { envVariables: {} })
    const [url, requestInit] = requestPayload

    expect(url).toBeTypeOf('string')
    expect(requestInit).toBeTypeOf('object')
    expect(controller).toBeInstanceOf(AbortController)
    expect(isUsingProxy).toBe(false)
    expect(requestInit.signal?.aborted).toBe(false)
    controller.abort()
    expect(requestInit.signal?.aborted).toBe(true)
  })

  it('applies environment replacement to header values from the factory', () => {
    const headers = new Headers()
    headers.set('Authorization', 'Bearer {{token}}')

    const [, requestInit] = buildRequest(createFactory({ headers }), {
      envVariables: { token: 'abc' },
    }).requestPayload

    expect((requestInit.headers as Headers).get('Authorization')).toBe('Bearer abc')
  })

  it('replaces environment variables in raw string bodies', () => {
    const [, requestInit] = buildRequest(
      createFactory({
        method: 'POST',
        body: { mode: 'raw', value: '{"id":"{{id}}"}' },
      }),
      { envVariables: { id: '42' } },
    ).requestPayload

    expect(requestInit.body).toBe('{"id":"42"}')
  })

  it('passes raw File and Blob bodies through without string replacement', async () => {
    const file = new File(['payload'], 'data.bin', { type: 'application/octet-stream' })
    const [, fileInit] = buildRequest(
      createFactory({
        method: 'POST',
        body: { mode: 'raw', value: file },
      }),
      { envVariables: { unused: 'x' } },
    ).requestPayload
    expect(await (fileInit.body as File).arrayBuffer()).toEqual(await file.arrayBuffer())

    const blob = new Blob(['hello'])
    const [, blobInit] = buildRequest(
      createFactory({
        method: 'POST',
        body: { mode: 'raw', value: blob },
      }),
      { envVariables: {} },
    ).requestPayload
    expect(await (blobInit.body as Blob).text()).toBe('hello')
  })

  it('appends blob parts in multipart bodies without altering the blob bytes', async () => {
    const blob = new Blob(['blob-data'], { type: 'text/plain' })
    const [url, requestInit] = buildRequest(
      createFactory({
        method: 'POST',
        body: {
          mode: 'formdata',
          value: [{ type: 'blob', key: 'payload', value: blob }],
        },
      }),
      { envVariables: {} },
    ).requestPayload

    const form = await new Request(url, requestInit).formData()
    const part = form.get('payload')
    expect(part).toBeInstanceOf(Blob)
    expect(await (part as Blob).text()).toBe('blob-data')
  })

  it('builds multipart form bodies with env substitution for text parts only', async () => {
    const file = new File(['f'], 'x.txt', { type: 'text/plain' })
    const [url, requestInit] = buildRequest(
      createFactory({
        method: 'POST',
        body: {
          mode: 'formdata',
          value: [
            { type: 'text', key: '{{k}}', value: '{{v}}' },
            { type: 'file', key: 'upload', value: file },
          ],
        },
      }),
      { envVariables: { k: 'field', v: 'value' } },
    ).requestPayload

    const form = await new Request(url, requestInit).formData()
    expect(form.get('field')).toBe('value')
    expect(form.get('upload')).toBeInstanceOf(File)
  })

  it('builds urlencoded bodies with env substitution', () => {
    const [, requestInit] = buildRequest(
      createFactory({
        method: 'POST',
        body: {
          mode: 'urlencoded',
          value: [
            { key: '{{a}}', value: '{{b}}' },
            { key: 'c', value: 'd' },
          ],
        },
      }),
      { envVariables: { a: 'alpha', b: 'beta' } },
    ).requestPayload

    const params = requestInit.body as URLSearchParams
    expect(params.get('alpha')).toBe('beta')
    expect(params.get('c')).toBe('d')
  })

  it('sets null body when the factory has no body', () => {
    const [, requestInit] = buildRequest(createFactory({ body: null }), { envVariables: {} }).requestPayload
    expect(requestInit.body).toBe(null)
  })

  it('sets security API key headers using env-substituted header names and values', () => {
    const [, requestInit] = buildRequest(
      createFactory({
        security: [{ in: 'header', name: '{{hdr}}', value: '{{tok}}' }],
      }),
      { envVariables: { hdr: 'X-Key', tok: 'secret' } },
    ).requestPayload

    expect((requestInit.headers as Headers).get('X-Key')).toBe('secret')
  })

  it('prefixes Basic auth with base64-encoded credentials after env substitution', () => {
    const [, requestInit] = buildRequest(
      createFactory({
        security: [{ in: 'header', name: 'Authorization', format: 'basic', value: '{{u}}:{{p}}' }],
      }),
      { envVariables: { u: 'alice', p: 'bob' } },
    ).requestPayload

    expect((requestInit.headers as Headers).get('Authorization')).toBe(`Basic ${encodeBase64('alice:bob')}`)
  })

  it('prefixes bearer tokens after env substitution', () => {
    const [, requestInit] = buildRequest(
      createFactory({
        security: [{ in: 'header', name: 'Authorization', format: 'bearer', value: '{{jwt}}' }],
      }),
      { envVariables: { jwt: 'eyJ' } },
    ).requestPayload

    expect((requestInit.headers as Headers).get('Authorization')).toBe('Bearer eyJ')
  })

  it('merges security query parameters with env substitution into the request URL', () => {
    const [url] = buildRequest(
      createFactory({
        security: [{ in: 'query', name: '{{q}}', value: '{{v}}' }],
        query: new URLSearchParams(),
      }),
      { envVariables: { q: 'token', v: 'abc' } },
    ).requestPayload

    expect(new URL(url).searchParams.get('token')).toBe('abc')
  })

  it('lets operation security query params override query params when names collide', () => {
    const query = new URLSearchParams()
    query.set('token', 'from-operation')

    const [url] = buildRequest(
      createFactory({
        security: [{ in: 'query', name: 'token', value: 'from-security' }],
        query,
      }),
      { envVariables: {} },
    ).requestPayload

    expect(new URL(url).searchParams.get('token')).toBe('from-security')
  })

  it('substitutes environment variables in operation query keys and values', () => {
    const query = new URLSearchParams()
    query.set('{{k}}', '{{v}}')

    const [url] = buildRequest(createFactory({ query }), {
      envVariables: { k: 'sort', v: 'name' },
    }).requestPayload

    expect(new URL(url).searchParams.get('sort')).toBe('name')
  })

  it('preserves repeated query parameters when building the request URL', () => {
    const query = new URLSearchParams()
    query.append('bbox', '13')
    query.append('bbox', '48')
    query.append('bbox', '18')
    query.append('bbox', '52')

    const [url] = buildRequest(createFactory({ query }), {
      envVariables: {},
    }).requestPayload

    expect(new URL(url).searchParams.getAll('bbox')).toEqual(['13', '48', '18', '52'])
  })

  it('encodes path variables after env substitution and substitutes them into the path', () => {
    const [url] = buildRequest(
      createFactory({
        path: {
          raw: '/users/{id}/posts',
          variables: { id: '{{userId}}' },
        },
      }),
      { envVariables: { userId: 'a/b' } },
    ).requestPayload

    expect(url).toContain('/users/a%2Fb/posts')
  })

  it('replaces environment variables in baseUrl before merging with the path', () => {
    const [url] = buildRequest(
      createFactory({
        baseUrl: 'https://{{host}}.example.com',
        path: { raw: '/v1', variables: {} },
      }),
      { envVariables: { host: 'staging-api' } },
    ).requestPayload

    expect(url.startsWith('https://staging-api.example.com/v1')).toBe(true)
  })

  it('merges an existing Cookie header with cookies from the factory list', () => {
    const headers = new Headers()
    headers.set('Cookie', 'existing=1')

    const [, requestInit] = buildRequest(
      createFactory({
        headers,
        cookies: [{ name: 'next', value: '2', domain: 'api.example.com' }],
        baseUrl: 'https://api.example.com',
        path: { raw: '/', variables: {} },
      }),
      { envVariables: {} },
    ).requestPayload

    const cookie = (requestInit.headers as Headers).get('Cookie') ?? ''
    expect(cookie).toContain('existing=1')
    expect(cookie).toContain('next=2')
  })

  it('includes security scheme cookies in the Cookie header', () => {
    const [, requestInit] = buildRequest(
      createFactory({
        security: [{ in: 'cookie', name: 'session', value: 'sid-1' }],
      }),
      { envVariables: {} },
    ).requestPayload

    expect((requestInit.headers as Headers).get('Cookie')).toContain('session=sid-1')
  })

  it('filters disabled cookies out of the Cookie header', () => {
    const [, requestInit] = buildRequest(
      createFactory({
        cookies: [
          { name: 'a', value: '1', domain: 'api.example.com', isDisabled: false },
          { name: 'b', value: '2', domain: 'api.example.com', isDisabled: true },
        ],
        baseUrl: 'https://api.example.com',
        path: { raw: '/', variables: {} },
      }),
      { envVariables: {} },
    ).requestPayload

    const cookie = (requestInit.headers as Headers).get('Cookie') ?? ''
    expect(cookie).toContain('a=1')
    expect(cookie).not.toContain('b=2')
  })

  it('substitutes environment variables in cookie names and values before building the header', () => {
    const [, requestInit] = buildRequest(
      createFactory({
        cookies: [{ name: '{{n}}', value: '{{v}}', domain: 'api.example.com' }],
        baseUrl: 'https://api.example.com',
        path: { raw: '/', variables: {} },
      }),
      { envVariables: { n: 'x', v: 'y' } },
    ).requestPayload

    expect((requestInit.headers as Headers).get('Cookie')).toContain('x=y')
  })

  it('uses X-Scalar-Cookie when the proxy is used', () => {
    const { requestPayload, isUsingProxy } = buildRequest(
      createFactory({
        proxyUrl: 'https://proxy.scalar.com',
        baseUrl: 'https://api.example.com',
        path: { raw: '/', variables: {} },
        cookies: [{ name: 'c', value: '1', domain: 'api.example.com' }],
      }),
      { envVariables: {} },
    )
    const [, requestInit] = requestPayload

    expect(isUsingProxy).toBe(true)
    expect((requestInit.headers as Headers).get('X-Scalar-Cookie')).toContain('c=1')
    expect((requestInit.headers as Headers).get('Cookie')).toBe(null)
  })

  it('uses X-Scalar-Cookie when options.isElectron is true', () => {
    const [, requestInit] = buildRequest(
      createFactory({
        options: { isElectron: true },
        baseUrl: 'https://api.example.com',
        path: { raw: '/', variables: {} },
        cookies: [{ name: 'c', value: '1', domain: 'api.example.com' }],
      }),
      { envVariables: {} },
    ).requestPayload

    expect((requestInit.headers as Headers).get('X-Scalar-Cookie')).toContain('c=1')
  })

  it('rewrites the request URL through the proxy when shouldUseProxy is true', () => {
    const { requestPayload, isUsingProxy } = buildRequest(
      createFactory({
        proxyUrl: 'https://proxy.scalar.com',
        baseUrl: 'https://api.example.com',
        path: { raw: '/r', variables: {} },
      }),
      { envVariables: {} },
    )
    const [url] = requestPayload

    expect(isUsingProxy).toBe(true)
    const parsed = new URL(url)
    expect(`${parsed.origin}${parsed.pathname}`).toMatch(/^https:\/\/proxy\.scalar\.com\/?$/)
    expect(parsed.searchParams.get('scalar_url')).toContain('https://api.example.com')
  })

  it('applies allowReserved decoding for marked query parameter keys', () => {
    const query = new URLSearchParams()
    query.set('sort', 'name:asc')

    const [url] = buildRequest(
      createFactory({
        query,
        allowedReservedQueryParameters: new Set(['sort']),
      }),
      { envVariables: {} },
    ).requestPayload

    expect(url).toContain('sort=name:asc')
    expect(new URL(url).searchParams.get('sort')).toBe('name:asc')
  })

  it('skips security header when disableSecurity is true', () => {
    const [, requestInit] = buildRequest(
      createFactory({
        security: [{ in: 'header', name: 'Authorization', format: 'bearer', value: 'my-token' }],
        options: { disableSecurity: true },
      }),
      { envVariables: {} },
    ).requestPayload

    expect((requestInit.headers as Headers).get('Authorization')).toBe(null)
  })

  it('skips security query params when disableSecurity is true', () => {
    const [url] = buildRequest(
      createFactory({
        security: [{ in: 'query', name: 'api_key', value: 'secret' }],
        options: { disableSecurity: true },
      }),
      { envVariables: {} },
    ).requestPayload

    expect(new URL(url).searchParams.get('api_key')).toBe(null)
  })

  it('skips security cookies when disableSecurity is true', () => {
    const [, requestInit] = buildRequest(
      createFactory({
        security: [{ in: 'cookie', name: 'session', value: 'sid-1' }],
        options: { disableSecurity: true },
      }),
      { envVariables: {} },
    ).requestPayload

    expect((requestInit.headers as Headers).get('Cookie')).toBe(null)
  })

  it('still applies security when disableSecurity is false', () => {
    const [, requestInit] = buildRequest(
      createFactory({
        security: [{ in: 'header', name: 'Authorization', format: 'bearer', value: 'tok' }],
        options: { disableSecurity: false },
      }),
      { envVariables: {} },
    ).requestPayload

    expect((requestInit.headers as Headers).get('Authorization')).toBe('Bearer tok')
  })

  it('still applies security when options is undefined', () => {
    const [, requestInit] = buildRequest(
      createFactory({
        security: [{ in: 'header', name: 'X-Key', value: 'val' }],
      }),
      { envVariables: {} },
    ).requestPayload

    expect((requestInit.headers as Headers).get('X-Key')).toBe('val')
  })

  it('preserves non-security headers when disableSecurity is true', () => {
    const headers = new Headers()
    headers.set('X-Custom', 'keep-me')

    const [, requestInit] = buildRequest(
      createFactory({
        headers,
        security: [{ in: 'header', name: 'Authorization', format: 'bearer', value: 'drop-me' }],
        options: { disableSecurity: true },
      }),
      { envVariables: {} },
    ).requestPayload

    expect((requestInit.headers as Headers).get('X-Custom')).toBe('keep-me')
    expect((requestInit.headers as Headers).get('Authorization')).toBe(null)
  })

  it('preserves non-security cookies when disableSecurity is true', () => {
    const [, requestInit] = buildRequest(
      createFactory({
        cookies: [{ name: 'app', value: 'keep', domain: 'api.example.com' }],
        security: [{ in: 'cookie', name: 'auth', value: 'drop' }],
        options: { disableSecurity: true },
        baseUrl: 'https://api.example.com',
        path: { raw: '/', variables: {} },
      }),
      { envVariables: {} },
    ).requestPayload

    const cookie = (requestInit.headers as Headers).get('Cookie') ?? ''
    expect(cookie).toContain('app=keep')
    expect(cookie).not.toContain('auth=drop')
  })

  it('forwards cache mode and uppercases the method in the requestInit', () => {
    const [, requestInit] = buildRequest(
      createFactory({
        method: 'patch',
        cache: 'no-store',
      }),
      { envVariables: {} },
    ).requestPayload

    expect(requestInit.method).toBe('PATCH')
    expect(requestInit.cache).toBe('no-store')
  })

  it('appends multiple security headers with the same name instead of overwriting', () => {
    const [, requestInit] = buildRequest(
      createFactory({
        security: [
          { in: 'header', name: 'Authorization', format: 'bearer', value: 'token-a' },
          { in: 'header', name: 'Authorization', format: 'bearer', value: 'token-b' },
        ],
      }),
      { envVariables: {} },
    ).requestPayload

    const values = (requestInit.headers as Headers).get('Authorization')
    expect(values).toContain('Bearer token-a')
    expect(values).toContain('Bearer token-b')
  })

  it('appends multiple security query params with the same name instead of overwriting', () => {
    const [url] = buildRequest(
      createFactory({
        security: [
          { in: 'query', name: 'api_key', value: 'key-1' },
          { in: 'query', name: 'api_key', value: 'key-2' },
        ],
      }),
      { envVariables: {} },
    ).requestPayload

    expect(new URL(url).searchParams.getAll('api_key')).toStrictEqual(['key-1', 'key-2'])
  })

  it('preserves existing header values when appending security headers', () => {
    const headers = new Headers()
    headers.set('X-Custom', 'existing')

    const [, requestInit] = buildRequest(
      createFactory({
        headers,
        security: [{ in: 'header', name: 'X-Custom', value: 'from-security' }],
      }),
      { envVariables: {} },
    ).requestPayload

    const values = (requestInit.headers as Headers).get('X-Custom')
    expect(values).toContain('existing')
    expect(values).toContain('from-security')
  })
})
