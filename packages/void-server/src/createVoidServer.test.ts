import { describe, expect, it } from 'vitest'

import { createVoidServer } from './createVoidServer'

describe('createVoidServer', () => {
  it('GET /foobar', async () => {
    const server = await createVoidServer()

    const response = await server.request('/foobar')

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      path: '/foobar',
    })
  })

  it('GET /', async () => {
    const server = await createVoidServer()

    const response = await server.request('/')

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      path: '/',
    })
  })

  it('returns the headers', async () => {
    const server = await createVoidServer()

    const response = await server.request('/', {
      headers: {
        'X-Custom-Header': 'foobar',
      },
    })

    expect(await response.json()).toMatchObject({
      headers: {
        'x-custom-header': 'foobar',
      },
    })
  })

  it('returns the method', async () => {
    const server = await createVoidServer()

    const response = await server.request('/')

    expect(await response.json()).toMatchObject({
      method: 'GET',
    })
  })

  it('returns the query parameters', async () => {
    const server = await createVoidServer()

    const response = await server.request('/?foo=bar')

    expect(await response.json()).toMatchObject({
      query: {
        foo: 'bar',
      },
    })
  })

  it('returns the JSON body', async () => {
    const server = await createVoidServer()

    const response = await server.request('/', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        foo: 'bar',
      }),
    })

    expect((await response.json()).body).toMatchObject({
      foo: 'bar',
    })
  })

  it('returns plain text body', async () => {
    const server = await createVoidServer()

    const response = await server.request('/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'foobar',
    })

    expect((await response.json()).body).toBe('foobar')
  })

  it('returns the cookies', async () => {
    const server = await createVoidServer()

    const response = await server.request('/', {
      method: 'POST',
      headers: {
        cookie: 'foo=bar;',
      },
      credentials: 'include',
    })

    expect((await response.json()).cookies).toMatchObject({
      foo: 'bar',
    })
  })

  it('returns 404', async () => {
    const server = await createVoidServer()

    const response = await server.request('/404')

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Not Found')
  })

  it('returns the authentication header bearer', async () => {
    const server = await createVoidServer()

    const response = await server.request('/', {
      headers: {
        Authorization: 'Bearer 123',
      },
    })

    expect(await response.json()).toMatchObject({
      authentication: {
        type: 'http.bearer',
        token: '123',
      },
    })
  })

  it('returns the authentication header basic', async () => {
    const server = await createVoidServer()

    const response = await server.request('/', {
      headers: {
        Authorization: 'Basic YmFy',
      },
    })

    expect(await response.json()).toMatchObject({
      authentication: {
        type: 'http.basic',
        token: 'YmFy',
        value: 'bar',
      },
    })
  })

  it('returns XML', async () => {
    const server = await createVoidServer()

    const response = await server.request('/', {
      headers: {
        Accept: 'application/xml',
      },
    })

    expect(await response.text()).toContain('<method>GET</method>')
  })

  it('returns HTML', async () => {
    const server = await createVoidServer()

    const response = await server.request('/', {
      headers: {
        Accept: 'text/html',
      },
    })

    expect(await response.text()).toContain('<strong>method:</strong> GET</li>')
  })
})
