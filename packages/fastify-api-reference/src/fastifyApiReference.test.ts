import FastifyBasicAuth, {
  type FastifyBasicAuthOptions,
} from '@fastify/basic-auth'
import Fastify from 'fastify'
import { describe, expect, it } from 'vitest'

import fastifyApiReference from './index'

const authOptions: FastifyBasicAuthOptions = {
  validate(username, password, req, reply, done) {
    if (username === 'admin' && password === 'admin') {
      done()
    } else {
      done(new Error('Invalid credentials'))
    }
  },
  authenticate: true,
}

function basicAuthEncode(username: string, password: string) {
  return 'Basic ' + Buffer.from(username + ':' + password).toString('base64')
}

describe('fastifyApiReference', () => {
  it('returns 200 OK for the HTML', async () => {
    const fastify = Fastify({
      logger: false,
    })

    fastify.register(fastifyApiReference, {
      routePrefix: '/reference',
      configuration: {
        spec: { url: '/openapi.json' },
      },
    })

    const address = await fastify.listen({ port: 0 })
    const response = await fetch(`${address}/reference`)
    expect(response.status).toBe(200)
  })

  it('hasPlugin(fastifyApiReference) returns true', async () => {
    const fastify = Fastify({
      logger: false,
    })

    await fastify.register(fastifyApiReference, {
      routePrefix: '/reference',
      configuration: {
        spec: { url: '/openapi.json' },
      },
    })

    expect(fastify.hasPlugin('@scalar/fastify-api-reference')).toBeTruthy()
  })

  it('no fastify-html exposed', async () => {
    const fastify = Fastify({
      logger: false,
    })

    await fastify.register(fastifyApiReference, {
      routePrefix: '/reference',
      configuration: {
        spec: { url: '/openapi.json' },
      },
    })

    // @ts-ignore
    expect(fastify.html).toEqual(undefined)
  })

  it('the routePrefix is optional', async () => {
    const fastify = Fastify({
      logger: false,
    })

    fastify.register(fastifyApiReference, {
      configuration: {
        spec: { url: '/openapi.json' },
      },
    })

    const address = await fastify.listen({ port: 0 })
    const response = await fetch(`${address}/reference`)
    expect(response.status).toBe(200)
  })

  it('has the JS url', async () => {
    const fastify = Fastify({
      logger: false,
    })

    fastify.register(fastifyApiReference, {
      routePrefix: '/reference',
      configuration: {
        spec: { url: '/openapi.json' },
      },
    })

    const address = await fastify.listen({ port: 0 })
    const response = await fetch(`${address}/reference`)
    expect(await response.text()).toContain(
      '/reference/@scalar/fastify-api-reference/js/browser.js',
    )
  })

  it('prefixes the JS url', async () => {
    const fastify = Fastify({
      logger: false,
    })

    fastify.register(fastifyApiReference, {
      routePrefix: '/reference',
      publicPath: '/foobar',
      configuration: {
        spec: { url: '/openapi.json' },
      },
    })

    const address = await fastify.listen({ port: 0 })
    const response = await fetch(`${address}/reference`)
    expect(await response.text()).toContain(
      '/foobar/reference/@scalar/fastify-api-reference/js/browser.js',
    )
  })

  it('has the spec URL', async () => {
    const fastify = Fastify({
      logger: false,
    })

    fastify.register(fastifyApiReference, {
      routePrefix: '/reference',
      configuration: {
        spec: { url: '/openapi.json' },
      },
    })

    const address = await fastify.listen({ port: 0 })
    const response = await fetch(`${address}/reference`)
    expect(await response.text()).toContain('/openapi.json')
  })

  it('has the spec', async () => {
    const spec = {
      openapi: '3.1.0',
      info: {
        title: 'Example API',
      },
      paths: {},
    }

    const fastify = Fastify({
      logger: false,
    })

    fastify.register(fastifyApiReference, {
      routePrefix: '/reference',
      configuration: {
        spec: {
          content: spec,
        },
      },
    })

    const address = await fastify.listen({ port: 0 })
    const response = await fetch(`${address}/reference`)
    const html = await response.text()
    expect(html).toContain('Example API')
  })

  it('calls a spec callback', async () => {
    const spec = {
      openapi: '3.1.0',
      info: {
        title: 'Example API',
      },
      paths: {},
    }

    const fastify = Fastify({
      logger: false,
    })

    fastify.register(fastifyApiReference, {
      routePrefix: '/reference',
      configuration: {
        spec: { content: () => spec },
      },
    })

    const address = await fastify.listen({ port: 0 })
    const response = await fetch(`${address}/reference`)
    const html = await response.text()

    expect(html).toContain('Example API')
  })

  it('has the default title', async () => {
    const fastify = Fastify({
      logger: false,
    })

    fastify.register(fastifyApiReference, {
      routePrefix: '/reference',
      configuration: {
        spec: { url: '/openapi.json' },
      },
    })

    const address = await fastify.listen({ port: 0 })
    const response = await fetch(`${address}/reference`)
    expect(await response.text()).toContain(
      '<title>Scalar API Reference</title>',
    )
  })

  it('has the correct content type', async () => {
    const fastify = Fastify({
      logger: false,
    })

    fastify.register(fastifyApiReference, {
      routePrefix: '/reference',
      configuration: {
        spec: { url: '/openapi.json' },
      },
    })

    const address = await fastify.listen({ port: 0 })
    const response = await fetch(`${address}/reference`)
    expect(response.headers.has('content-type')).toBe(true)
    expect(response.headers.get('content-type')).toContain('text/html')
  })

  it('has the JS url with default routePrefix', async () => {
    const fastify = Fastify({
      logger: false,
    })

    fastify.register(fastifyApiReference, {
      configuration: {
        spec: { url: '/openapi.json' },
      },
    })

    const address = await fastify.listen({ port: 0 })
    const response = await fetch(`${address}/reference`)
    expect(await response.text()).toContain(
      '/reference/@scalar/fastify-api-reference/js/browser.js',
    )
  })

  it('returns 401 Unauthorized for requests without authentication', async () => {
    const fastify = Fastify({
      logger: false,
    })
    await fastify.register(FastifyBasicAuth, authOptions)

    fastify.register(fastifyApiReference, {
      configuration: {
        spec: { url: '/openapi.json' },
      },
      hooks: {
        onRequest: fastify.basicAuth,
      },
    })

    const address = await fastify.listen({ port: 0 })
    let response = await fetch(`${address}/reference`)
    expect(response.status).toBe(401)

    response = await fetch(
      `${address}/reference/@scalar/fastify-api-reference/js/browser.js`,
    )
    expect(response.status).toBe(401)
  })

  it('returns 200 OK for requests with authentication', async () => {
    const fastify = Fastify({
      logger: false,
    })
    await fastify.register(FastifyBasicAuth, authOptions)

    fastify.register(fastifyApiReference, {
      configuration: {
        spec: { url: '/openapi.json' },
      },
      hooks: {
        onRequest: fastify.basicAuth,
      },
    })

    const address = await fastify.listen({ port: 0 })
    let response = await fetch(`${address}/reference`, {
      headers: {
        authorization: basicAuthEncode('admin', 'admin'),
      },
    })
    expect(response.status).toBe(200)

    response = await fetch(
      `${address}/reference/@scalar/fastify-api-reference/js/browser.js`,
      {
        headers: {
          authorization: basicAuthEncode('admin', 'admin'),
        },
      },
    )
    expect(response.status).toBe(200)
  })
})
