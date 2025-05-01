import { describe, expect, it } from 'vitest'

import { createVoidServer } from '@/createVoidServer'

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

  it('deals with array query parameters', async () => {
    const server = await createVoidServer()

    const response = await server.request('/?foo=foo&foo=bar&example=value')

    expect(await response.json()).toMatchObject({
      query: {
        foo: ['foo', 'bar'],
        example: 'value',
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

  it('returns form data', async () => {
    const server = await createVoidServer()

    const response = await server.request('/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'foo=bar&foo%20bar=yes',
    })

    expect((await response.json()).body).toStrictEqual({
      'foo': 'bar',
      'foo bar': 'yes',
    })
  })

  it('returns multipart form data', async () => {
    const server = await createVoidServer()

    const formData = new FormData()

    // Just a simple string
    formData.append('foo', 'bar')
    // Key has whitespaces
    formData.append('foo bar', 'yes')

    const response = await server.request('/', {
      method: 'POST',
      body: formData,
    })

    expect((await response.json()).body).toStrictEqual({
      'foo': 'bar',
      'foo bar': 'yes',
    })
  })

  it('returns multipart form data with a file', async () => {
    const server = await createVoidServer()

    // File
    const formData = new FormData()
    formData.append('file', new Blob(['foobar']), 'file.txt')

    const response = await server.request('/', {
      method: 'POST',
      body: formData,
    })

    const body = (await response.json()).body

    expect(body).toMatchObject({
      file: {
        name: 'file.txt',
        sizeInBytes: 6,
        type: 'application/octet-stream',
      },
    })

    expect(body.file.lastModified).toBeDefined()
  })

  it('returns multipart form data with multiple files', async () => {
    const server = await createVoidServer()

    // Multiple files in a single field
    const formData = new FormData()
    formData.append('files', new Blob(['foobar']), 'file1.txt')
    formData.append('files', new Blob(['foobar']), 'file2.txt')

    const response = await server.request('/', {
      method: 'POST',
      body: formData,
    })

    const body = (await response.json()).body

    expect(body.files).toMatchObject([
      {
        name: 'file1.txt',
        sizeInBytes: 6,
        type: 'application/octet-stream',
      },
      {
        name: 'file2.txt',
        sizeInBytes: 6,
        type: 'application/octet-stream',
      },
    ])

    expect(body.files[0].lastModified).toBeDefined()
    expect(body.files[1].lastModified).toBeDefined()
  })

  it('returns form data with dot syntax', async () => {
    const server = await createVoidServer()

    const formData = new FormData()

    // Dot syntax
    formData.append('foo.bar', 'yes')

    const response = await server.request('/', {
      method: 'POST',
      body: formData,
    })

    expect((await response.json()).body).toStrictEqual({
      foo: {
        bar: 'yes',
      },
    })
  })

  it('returns just a blob', async () => {
    const server = await createVoidServer()

    // Send just a blob
    const response = await server.request('/', {
      method: 'POST',
      body: new Blob(['foobar']),
    })

    expect((await response.json()).body).toStrictEqual('foobar')
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

  it('returns no content for 204', async () => {
    const server = await createVoidServer()

    const response = await server.request('/204')

    expect(response.status).toBe(204)
    expect(await response.text()).toBe('')
  })

  it('returns 500', async () => {
    const server = await createVoidServer()

    const response = await server.request('/500')

    expect(response.status).toBe(500)
    expect(await response.text()).toBe('Internal Server Error')
  })

  it('returns 503', async () => {
    const server = await createVoidServer()

    const response = await server.request('/503')

    expect(response.status).toBe(503)
    expect(await response.text()).toBe('Service Unavailable')
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

  it('returns JSON for a path ending with .json', async () => {
    const server = await createVoidServer()

    const response = await server.request('/foobar.json')

    expect(await response.text()).toContain('{"method":"GET"')
    expect(response.headers.get('Content-Type')).toContain('application/json')
  })

  it('returns XML', async () => {
    const server = await createVoidServer()

    const response = await server.request('/', {
      headers: {
        Accept: 'application/xml',
      },
    })

    expect(await response.text()).toContain('<method>GET</method>')
    expect(response.headers.get('Content-Type')).toContain('application/xml')
  })

  it('returns XML for a path ending with .xml', async () => {
    const server = await createVoidServer()

    const response = await server.request('/foobar.xml')

    expect(await response.text()).toContain('<method>GET</method>')
    expect(response.headers.get('Content-Type')).toContain('application/xml')
  })

  it('returns HTML', async () => {
    const server = await createVoidServer()

    const response = await server.request('/', {
      headers: {
        Accept: 'text/html',
      },
    })

    expect(await response.text()).toContain('<strong>method:</strong> GET</li>')
    expect(response.headers.get('Content-Type')).toContain('text/html')
  })

  it('returns HTML for path ending with .html', async () => {
    const server = await createVoidServer()

    const response = await server.request('/foobar.html')

    expect(await response.text()).toContain('<strong>method:</strong> GET</li>')
    expect(response.headers.get('Content-Type')).toContain('text/html')
  })
})
