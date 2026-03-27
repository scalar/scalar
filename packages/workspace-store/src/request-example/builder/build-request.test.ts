import { encode as encodeBase64 } from 'js-base64'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { RequestFactory } from '@/request-example/builder/request-factory'

import { buildRequest } from './build-request'

const createFactory = (overrides: Partial<RequestFactory> = {}): RequestFactory => ({
  allowedReservedQueryParameters: new Set(),
  baseUrl: 'https://api.example.com',
  body: null,
  cache: 'default',
  cookies: { list: [] },
  headers: new Headers(),
  method: 'GET',
  path: { raw: '/users', variables: {} },
  proxy: { proxyUrl: '' },
  query: { params: new URLSearchParams() },
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

  it('returns a Request, AbortController, and isUsingProxy flag', () => {
    const factory = createFactory()
    const { request, controller, isUsingProxy } = buildRequest(factory, { envVariables: {} })

    expect(request).toBeInstanceOf(Request)
    expect(controller).toBeInstanceOf(AbortController)
    expect(isUsingProxy).toBe(false)
    expect(request.signal.aborted).toBe(false)
    controller.abort()
    expect(request.signal.aborted).toBe(true)
  })

  it('applies environment replacement to header values from the factory', () => {
    const headers = new Headers()
    headers.set('Authorization', 'Bearer {{token}}')

    const { request } = buildRequest(createFactory({ headers }), {
      envVariables: { token: 'abc' },
    })

    expect(request.headers.get('Authorization')).toBe('Bearer abc')
  })

  it('replaces environment variables in raw string bodies', async () => {
    const { request } = buildRequest(
      createFactory({
        method: 'POST',
        body: { mode: 'raw', value: '{"id":"{{id}}"}' },
      }),
      { envVariables: { id: '42' } },
    )

    expect(request.bodyUsed).toBe(false)
    expect(await request.text()).toBe('{"id":"42"}')
  })

  it('passes raw File and Blob bodies through without string replacement', async () => {
    const file = new File(['payload'], 'data.bin', { type: 'application/octet-stream' })
    const { request: fileReq } = buildRequest(
      createFactory({
        method: 'POST',
        body: { mode: 'raw', value: file },
      }),
      { envVariables: { unused: 'x' } },
    )
    expect(await fileReq.arrayBuffer()).toEqual(await file.arrayBuffer())

    const blob = new Blob(['hello'])
    const { request: blobReq } = buildRequest(
      createFactory({
        method: 'POST',
        body: { mode: 'raw', value: blob },
      }),
      { envVariables: {} },
    )
    expect(await blobReq.text()).toBe('hello')
  })

  it('appends blob parts in multipart bodies without altering the blob bytes', async () => {
    const blob = new Blob(['blob-data'], { type: 'text/plain' })
    const { request } = buildRequest(
      createFactory({
        method: 'POST',
        body: {
          mode: 'formdata',
          value: [{ type: 'blob', key: 'payload', value: blob }],
        },
      }),
      { envVariables: {} },
    )

    const form = await request.formData()
    const part = form.get('payload')
    expect(part).toBeInstanceOf(Blob)
    expect(await (part as Blob).text()).toBe('blob-data')
  })

  it('builds multipart form bodies with env substitution for text parts only', async () => {
    const file = new File(['f'], 'x.txt', { type: 'text/plain' })
    const { request } = buildRequest(
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
    )

    const form = await request.formData()
    expect(form.get('field')).toBe('value')
    expect(form.get('upload')).toBeInstanceOf(File)
  })

  it('builds urlencoded bodies with env substitution', async () => {
    const { request } = buildRequest(
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
    )

    expect(request.headers.get('Content-Type')).toContain('application/x-www-form-urlencoded')
    const text = await request.text()
    const params = new URLSearchParams(text)
    expect(params.get('alpha')).toBe('beta')
    expect(params.get('c')).toBe('d')
  })

  it('sets null body when the factory has no body', () => {
    const { request } = buildRequest(createFactory({ body: null }), { envVariables: {} })
    expect(request.body).toBe(null)
  })

  it('sets security API key headers using env-substituted header names and values', () => {
    const { request } = buildRequest(
      createFactory({
        security: [{ in: 'header', name: '{{hdr}}', type: 'simple', value: '{{tok}}' }],
      }),
      { envVariables: { hdr: 'X-Key', tok: 'secret' } },
    )

    expect(request.headers.get('X-Key')).toBe('secret')
  })

  it('prefixes Basic auth with base64-encoded credentials after env substitution', () => {
    const { request } = buildRequest(
      createFactory({
        security: [{ in: 'header', name: 'Authorization', type: 'basic', value: '{{u}}:{{p}}' }],
      }),
      { envVariables: { u: 'alice', p: 'bob' } },
    )

    expect(request.headers.get('Authorization')).toBe(`Basic ${encodeBase64('alice:bob')}`)
  })

  it('prefixes bearer tokens after env substitution', () => {
    const { request } = buildRequest(
      createFactory({
        security: [{ in: 'header', name: 'Authorization', type: 'bearer', value: '{{jwt}}' }],
      }),
      { envVariables: { jwt: 'eyJ' } },
    )

    expect(request.headers.get('Authorization')).toBe('Bearer eyJ')
  })

  it('merges security query parameters with env substitution into the request URL', () => {
    const { request } = buildRequest(
      createFactory({
        security: [{ in: 'query', name: '{{q}}', type: 'simple', value: '{{v}}' }],
        query: { params: new URLSearchParams() },
      }),
      { envVariables: { q: 'token', v: 'abc' } },
    )

    const url = new URL(request.url)
    expect(url.searchParams.get('token')).toBe('abc')
  })

  it('lets operation query params override security query params when names collide', () => {
    const query = new URLSearchParams()
    query.set('token', 'from-operation')

    const { request } = buildRequest(
      createFactory({
        security: [{ in: 'query', name: 'token', type: 'simple', value: 'from-security' }],
        query: { params: query },
      }),
      { envVariables: {} },
    )

    expect(new URL(request.url).searchParams.get('token')).toBe('from-operation')
  })

  it('substitutes environment variables in operation query keys and values', () => {
    const query = new URLSearchParams()
    query.set('{{k}}', '{{v}}')

    const { request } = buildRequest(createFactory({ query: { params: query } }), {
      envVariables: { k: 'sort', v: 'name' },
    })

    expect(new URL(request.url).searchParams.get('sort')).toBe('name')
  })

  it('encodes path variables after env substitution and substitutes them into the path', () => {
    const { request } = buildRequest(
      createFactory({
        path: {
          raw: '/users/{id}/posts',
          variables: { id: '{{userId}}' },
        },
      }),
      { envVariables: { userId: 'a/b' } },
    )

    expect(request.url).toContain('/users/a%2Fb/posts')
  })

  it('replaces environment variables in baseUrl before merging with the path', () => {
    const { request } = buildRequest(
      createFactory({
        baseUrl: 'https://{{host}}.example.com',
        path: { raw: '/v1', variables: {} },
      }),
      { envVariables: { host: 'staging-api' } },
    )

    expect(request.url.startsWith('https://staging-api.example.com/v1')).toBe(true)
  })

  it('merges an existing Cookie header with cookies from the factory list', () => {
    const headers = new Headers()
    headers.set('Cookie', 'existing=1')

    const { request } = buildRequest(
      createFactory({
        headers,
        cookies: {
          list: [{ name: 'next', value: '2', domain: 'api.example.com' }],
        },
        baseUrl: 'https://api.example.com',
        path: { raw: '/', variables: {} },
      }),
      { envVariables: {} },
    )

    const cookie = request.headers.get('Cookie') ?? ''
    expect(cookie).toContain('existing=1')
    expect(cookie).toContain('next=2')
  })

  it('includes security scheme cookies in the Cookie header', () => {
    const { request } = buildRequest(
      createFactory({
        security: [{ in: 'cookie', name: 'session', type: 'simple', value: 'sid-1' }],
      }),
      { envVariables: {} },
    )

    expect(request.headers.get('Cookie')).toContain('session=sid-1')
  })

  it('filters disabled cookies out of the Cookie header', () => {
    const { request } = buildRequest(
      createFactory({
        cookies: {
          list: [
            { name: 'a', value: '1', domain: 'api.example.com', isDisabled: false },
            { name: 'b', value: '2', domain: 'api.example.com', isDisabled: true },
          ],
        },
        baseUrl: 'https://api.example.com',
        path: { raw: '/', variables: {} },
      }),
      { envVariables: {} },
    )

    const cookie = request.headers.get('Cookie') ?? ''
    expect(cookie).toContain('a=1')
    expect(cookie).not.toContain('b=2')
  })

  it('substitutes environment variables in cookie names and values before building the header', () => {
    const { request } = buildRequest(
      createFactory({
        cookies: {
          list: [{ name: '{{n}}', value: '{{v}}', domain: 'api.example.com' }],
        },
        baseUrl: 'https://api.example.com',
        path: { raw: '/', variables: {} },
      }),
      { envVariables: { n: 'x', v: 'y' } },
    )

    expect(request.headers.get('Cookie')).toContain('x=y')
  })

  it('uses X-Scalar-Cookie when the proxy is used', () => {
    const { request, isUsingProxy } = buildRequest(
      createFactory({
        proxy: { proxyUrl: 'https://proxy.scalar.com' },
        baseUrl: 'https://api.example.com',
        path: { raw: '/', variables: {} },
        cookies: {
          list: [{ name: 'c', value: '1', domain: 'api.example.com' }],
        },
      }),
      { envVariables: {} },
    )

    expect(isUsingProxy).toBe(true)
    expect(request.headers.get('X-Scalar-Cookie')).toContain('c=1')
    expect(request.headers.get('Cookie')).toBe(null)
  })

  it('uses X-Scalar-Cookie when options.isElectron is true', () => {
    const { request } = buildRequest(
      createFactory({
        options: { isElectron: true },
        baseUrl: 'https://api.example.com',
        path: { raw: '/', variables: {} },
        cookies: {
          list: [{ name: 'c', value: '1', domain: 'api.example.com' }],
        },
      }),
      { envVariables: {} },
    )

    expect(request.headers.get('X-Scalar-Cookie')).toContain('c=1')
  })

  it('rewrites the request URL through the proxy when shouldUseProxy is true', () => {
    const { request, isUsingProxy } = buildRequest(
      createFactory({
        proxy: { proxyUrl: 'https://proxy.scalar.com' },
        baseUrl: 'https://api.example.com',
        path: { raw: '/r', variables: {} },
      }),
      { envVariables: {} },
    )

    expect(isUsingProxy).toBe(true)
    const url = new URL(request.url)
    expect(`${url.origin}${url.pathname}`).toMatch(/^https:\/\/proxy\.scalar\.com\/?$/)
    expect(url.searchParams.get('scalar_url')).toContain('https://api.example.com')
  })

  it('applies allowReserved decoding for marked query parameter keys', () => {
    const query = new URLSearchParams()
    query.set('sort', 'name:asc')

    const { request } = buildRequest(
      createFactory({
        query: { params: query },
        allowedReservedQueryParameters: new Set(['sort']),
      }),
      { envVariables: {} },
    )

    expect(request.url).toContain('sort=name:asc')
    expect(new URL(request.url).searchParams.get('sort')).toBe('name:asc')
  })

  it('forwards cache mode and uppercases the method on the Request', () => {
    const { request } = buildRequest(
      createFactory({
        method: 'patch',
        cache: 'no-store',
      }),
      { envVariables: {} },
    )

    expect(request.method).toBe('PATCH')
    expect(request.cache).toBe('no-store')
  })
})
