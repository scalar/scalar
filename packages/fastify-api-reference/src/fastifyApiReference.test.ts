import Fastify from 'fastify'
import { describe, expect, it } from 'vitest'

import fastifyApiReference from './index'

describe('fastifyApiReference', () => {
  it('returns 200 OK for the HTML', async () => {
    const fastify = Fastify({
      logger: false,
    })

    fastify.register(fastifyApiReference, {
      routePrefix: '/reference',
      configuration: {
        spec: { url: '/swagger.json' },
      },
    })

    const address = await fastify.listen({ port: 0 })
    const response = await fetch(`${address}/reference`)
    expect(response.status).toBe(200)
  })

  it('no fastify-html exposed', async () => {
    const fastify = Fastify({
      logger: false,
    })

    await fastify.register(fastifyApiReference, {
      routePrefix: '/reference',
      configuration: {
        spec: { url: '/swagger.json' },
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
        spec: { url: '/swagger.json' },
      },
    })

    const address = await fastify.listen({ port: 0 })
    const response = await fetch(`${address}/`)
    expect(response.status).toBe(200)
  })

  it('has the JS url', async () => {
    const fastify = Fastify({
      logger: false,
    })

    fastify.register(fastifyApiReference, {
      routePrefix: '/reference',
      configuration: {
        spec: { url: '/swagger.json' },
      },
    })

    const address = await fastify.listen({ port: 0 })
    const response = await fetch(`${address}/reference`)
    expect(await response.text()).toContain(
      '/reference/@scalar/fastify-api-reference/js/browser.js',
    )
  })

  it('has the spec URL', async () => {
    const fastify = Fastify({
      logger: false,
    })

    fastify.register(fastifyApiReference, {
      routePrefix: '/reference',
      configuration: {
        spec: { url: '/swagger.json' },
      },
    })

    const address = await fastify.listen({ port: 0 })
    const response = await fetch(`${address}/reference`)
    expect(await response.text()).toContain('/swagger.json')
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
        spec: { url: '/swagger.json' },
      },
    })

    const address = await fastify.listen({ port: 0 })
    const response = await fetch(`${address}/reference`)
    expect(await response.text()).toContain('<title>API Reference</title>')
  })

  it('has the correct content type', async () => {
    const fastify = Fastify({
      logger: false,
    })

    fastify.register(fastifyApiReference, {
      routePrefix: '/reference',
      configuration: {
        spec: { url: '/swagger.json' },
      },
    })

    const address = await fastify.listen({ port: 0 })
    const response = await fetch(`${address}/reference`)
    expect(response.headers.has('content-type')).toBe(true)
    expect(response.headers.get('content-type')).toContain('text/html')
  })
})
