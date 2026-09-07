import { describe, expect, expectTypeOf, it } from 'vitest'

import { ApiReference, type ApiReferenceConfiguration, type ApiReferenceOptions } from '../src'

describe('ApiReference', () => {
  it('returns a synchronous handler for static configuration', async () => {
    const configuration = {
      pageTitle: 'My API',
      content: { openapi: '3.1.0' },
    } satisfies Partial<ApiReferenceConfiguration>
    const handler = ApiReference(configuration)
    expectTypeOf(handler).returns.toEqualTypeOf<Response>()
    const response = handler()
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('text/html; charset=utf-8')
    const html = await response.text()
    expect(html).toContain('<title>My API</title>')
    expect(html).toContain('"_integration": "nextjs"')
    expect(html).toContain('"openapi": "3.1.0"')
  })

  it('passes the incoming request to a synchronous configuration factory', async () => {
    const handler = ApiReference((request) => ({ pageTitle: new URL(request.url).pathname }))
    expectTypeOf(handler).returns.toEqualTypeOf<Promise<Response>>()
    const response = await handler(new Request('https://example.com/scalar'))
    expect(await response.text()).toContain('<title>/scalar</title>')
  })

  it('keeps concurrent asynchronous configurations separate', async () => {
    const handler = ApiReference(async (request) => ({
      pageTitle: await request.text(),
      nonce: request.headers.get('x-nonce') ?? undefined,
    }))
    const responses = await Promise.all(
      ['first', 'second'].map((value) =>
        handler(
          new Request('https://example.com/scalar', {
            method: 'POST',
            body: value,
            headers: { 'x-nonce': value },
          }),
        ),
      ),
    )
    const bodies = await Promise.all(responses.map((response) => response.text()))
    expect(bodies[0]).toContain('<title>first</title>')
    expect(bodies[0]).toContain('nonce="first"')
    expect(bodies[0]).not.toContain('second')
    expect(bodies[1]).toContain('<title>second</title>')
    expect(bodies[1]).toContain('nonce="second"')
    expect(bodies[1]).not.toContain('first')
  })

  it('creates independent response headers and retains the HTML content type', () => {
    const options = {
      headers: new Headers({ 'Cache-Control': 'private, no-store', 'Content-Type': 'application/json' }),
    } satisfies ApiReferenceOptions
    const handler = ApiReference({}, options)
    const response = handler()
    response.headers.set('Cache-Control', 'public')
    expect(handler().headers.get('Cache-Control')).toBe('private, no-store')
    expect(response.headers.get('Content-Type')).toBe('text/html; charset=utf-8')
    expect(options.headers.get('Content-Type')).toBe('application/json')
  })

  it('accepts header tuples with an asynchronous factory', async () => {
    const handler = ApiReference(() => Promise.resolve({}), { headers: [['Cache-Control', 'no-store']] })
    expect((await handler(new Request('https://example.com/scalar'))).headers.get('Cache-Control')).toBe('no-store')
  })

  it('propagates configuration failures', async () => {
    const error = new Error('Configuration unavailable')
    const handler = ApiReference(() => Promise.reject(error))
    await expect(handler(new Request('https://example.com/scalar'))).rejects.toBe(error)
  })

  it('turns synchronous factory failures into rejected responses', async () => {
    const error = new Error('Configuration unavailable')
    const handler = ApiReference(() => {
      throw error
    })
    await expect(handler(new Request('https://example.com/scalar'))).rejects.toBe(error)
  })
})
