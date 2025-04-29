import FastifyBasicAuth, { type FastifyBasicAuthOptions } from '@fastify/basic-auth'
import fastifySwagger from '@fastify/swagger'
import type { OpenAPI } from '@scalar/openapi-types'
import Fastify from 'fastify'
import { beforeEach, describe, expect, it } from 'vitest'
import YAML from 'yaml'

import fastifyApiReference from './index'

const authOptions: FastifyBasicAuthOptions = {
  validate(username, password, _req, _reply, done) {
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

function exampleDocument() {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Example API',
      version: '1.0.0',
    },
    paths: {},
    /**
     * Required, to match result of the exposed spec endpoint, provided by `@scalar/openapi-parser`
     */
    components: {
      schemas: {},
    },
  } satisfies OpenAPI.Document
}

describe('fastifyApiReference', () => {
  it('returns 200 OK for the HTML and redirects to the route with a trailing slash', async () => {
    const fastify = Fastify({
      logger: false,
    })

    await fastify.register(fastifyApiReference, {
      routePrefix: '/reference',
      configuration: {
        url: '/openapi.json',
      },
    })

    const address = await fastify.listen({ port: 0 })
    const response = await fetch(`${address}/reference`, { redirect: 'manual' })

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('/reference/')

    const finalResponse = await fetch(`${address}/reference/`)
    expect(finalResponse.status).toBe(200)
  })

  it('works with ignoreTrailingSlash', async () => {
    const fastify = Fastify({
      logger: false,
      ignoreTrailingSlash: true,
    })

    await fastify.register(fastifyApiReference, {
      routePrefix: '/reference',
      configuration: {
        url: '/openapi.json',
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
        url: '/openapi.json',
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
        url: '/openapi.json',
      },
    })

    // @ts-ignore
    expect(fastify.html).toEqual(undefined)
  })

  it('the routePrefix is optional', async () => {
    const fastify = Fastify({
      logger: false,
    })

    await fastify.register(fastifyApiReference, {
      configuration: {
        url: '/openapi.json',
      },
    })

    const address = await fastify.listen({ port: 0 })
    const response = await fetch(`${address}/reference`)
    expect(response.status).toBe(200)
  })

  describe('OpenAPI document endpoints', () => {
    describe.each([
      { specProvidedVia: '@fastify/swagger' },
      { specProvidedVia: 'content: spec' },
      { specProvidedVia: 'content: () => spec' },
    ] as const)('provided via $specProvidedVia', ({ specProvidedVia }) => {
      type LocalTestContext = {
        spec: ReturnType<typeof exampleDocument>
        address: string
      }

      describe.each([
        {
          endpointConfig: 'default',
        },
        {
          endpointConfig: 'custom',
          json: '/foo-json',
          yaml: '/bar-yaml',
        },
      ] as const)('on the $endpointConfig endpoint', ({ json, yaml }) => {
        beforeEach<LocalTestContext>(async (context) => {
          const spec = exampleDocument()
          const fastify = Fastify({
            logger: false,
          })
          const openApiDocumentEndpoints = {
            ...(json && { json }),
            ...(yaml && { yaml }),
          }

          switch (specProvidedVia) {
            case '@fastify/swagger': {
              await fastify.register(fastifySwagger, { openapi: exampleDocument() })
              await fastify.register(fastifyApiReference, {
                openApiDocumentEndpoints,
                configuration: {},
              })
              break
            }
            case 'content: spec': {
              await fastify.register(fastifyApiReference, {
                openApiDocumentEndpoints,
                configuration: {
                  content: spec,
                },
              })
              break
            }
            case 'content: () => spec': {
              await fastify.register(fastifyApiReference, {
                openApiDocumentEndpoints,
                configuration: {
                  content: () => spec,
                },
              })
              break
            }
          }

          const address = await fastify.listen({ port: 0 })

          context.spec = spec
          context.address = address
        })

        const endpoints = {
          json: json ?? '/openapi.json',
          yaml: yaml ?? '/openapi.yaml',
        }

        describe(`of "${endpoints.json}"`, () => {
          it<LocalTestContext>('should be equivalent to the original spec', async (ctx) => {
            const { spec, address } = ctx

            const response = await fetch(`${address}/reference${endpoints.json}`)
            expect(response.status).toBe(200)
            expect(await response.json()).toEqual(spec)
          })

          it<LocalTestContext>('should have proper CORS headers', async (ctx) => {
            const { address } = ctx
            const response = await fetch(`${address}/reference${endpoints.json}`)
            expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
            expect(response.headers.get('Access-Control-Allow-Methods')).toBe('*')
          })
        })

        describe(`of "${endpoints.yaml}"`, () => {
          it<LocalTestContext>('should be equivalent to the original spec', async (ctx) => {
            const { spec, address } = ctx

            const response = await fetch(`${address}/reference${endpoints.yaml}`)
            expect(response.status).toBe(200)
            expect(YAML.parse(await response.text())).toEqual(spec)
          })

          it<LocalTestContext>('should have proper CORS headers', async (ctx) => {
            const { address } = ctx
            const response = await fetch(`${address}/reference${endpoints.yaml}`)
            expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
            expect(response.headers.get('Access-Control-Allow-Methods')).toBe('*')
          })
        })
      })
    })
  })

  it('has the JS url', async () => {
    const fastify = Fastify({
      logger: false,
    })

    await fastify.register(fastifyApiReference, {
      routePrefix: '/reference',
      configuration: {
        url: '/openapi.json',
      },
    })

    const address = await fastify.listen({ port: 0 })
    const response = await fetch(`${address}/reference`)
    expect(await response.text()).toContain('js/scalar.js')
  })

  describe('has the spec URL', () => {
    const urlOwn = '/openapi.json'
    const urlExt = 'https://petstore.swagger.io/v2/swagger.json'

    it.each([
      { expectedUrl: urlOwn, specProvidedVia: '@fastify/swagger' },
      { expectedUrl: urlOwn, specProvidedVia: 'content: spec' },
      { expectedUrl: urlOwn, specProvidedVia: 'content: () => spec' },
      { expectedUrl: urlOwn, specProvidedVia: 'url: urlOwn' },
      { expectedUrl: urlExt, specProvidedVia: 'url: urlExt' },
    ] as const)('when spec is provided via $specProvidedVia', async ({ expectedUrl, specProvidedVia }) => {
      const spec = exampleDocument()
      const fastify = Fastify({
        logger: false,
      })

      switch (specProvidedVia) {
        case '@fastify/swagger': {
          await fastify.register(fastifySwagger, { openapi: exampleDocument() })
          await fastify.register(fastifyApiReference)
          break
        }
        case 'content: spec': {
          await fastify.register(fastifyApiReference, {
            configuration: { content: spec },
          })
          break
        }
        case 'content: () => spec': {
          await fastify.register(fastifyApiReference, {
            configuration: { content: () => spec },
          })
          break
        }
        case 'url: urlOwn': {
          await fastify.register(fastifyApiReference, {
            configuration: { url: urlOwn },
          })
          break
        }
        case 'url: urlExt': {
          await fastify.register(fastifyApiReference, {
            configuration: { url: urlExt },
          })
          break
        }
      }

      const address = await fastify.listen({ port: 0 })
      const response = await fetch(`${address}/reference`)
      expect(await response.text()).toContain(expectedUrl)
    })
  })

  it('has the default title', async () => {
    const fastify = Fastify({
      logger: false,
    })

    await fastify.register(fastifyApiReference, {
      routePrefix: '/reference',
      configuration: {
        url: '/openapi.json',
      },
    })

    const address = await fastify.listen({ port: 0 })
    const response = await fetch(`${address}/reference`)
    expect(await response.text()).toContain('<title>Scalar API Reference</title>')
  })

  it('has the correct content type', async () => {
    const fastify = Fastify({
      logger: false,
    })

    await fastify.register(fastifyApiReference, {
      routePrefix: '/reference',
      configuration: {
        url: '/openapi.json',
      },
    })

    const address = await fastify.listen({ port: 0 })
    const response = await fetch(`${address}/reference`)
    expect(response.headers.has('content-type')).toBe(true)
    expect(response.headers.get('content-type')).toContain('text/html')
  })

  it('returns 401 Unauthorized for requests without authentication', async () => {
    const fastify = Fastify({
      logger: false,
    })
    await fastify.register(FastifyBasicAuth, authOptions)

    await fastify.register(fastifyApiReference, {
      configuration: {
        url: '/openapi.json',
      },
      hooks: {
        onRequest: fastify.basicAuth,
      },
    })

    const address = await fastify.listen({ port: 0 })
    let response = await fetch(`${address}/reference`)
    expect(response.status).toBe(401)

    response = await fetch(`${address}/reference/js/scalar.js`)
    expect(response.status).toBe(401)
  })

  it('returns 200 OK for requests with authentication', async () => {
    const fastify = Fastify({
      logger: false,
    })
    await fastify.register(FastifyBasicAuth, authOptions)

    await fastify.register(fastifyApiReference, {
      configuration: {
        url: '/openapi.json',
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

    response = await fetch(`${address}/reference/js/scalar.js`, {
      headers: {
        authorization: basicAuthEncode('admin', 'admin'),
      },
    })
    expect(response.status).toBe(200)
  })

  it('respects logLevel configuration for routes', async () => {
    const loggedRequests: string[] = []

    const fastify = Fastify({
      logger: {
        level: 'info',
        serializers: {
          req(request) {
            loggedRequests.push(`${request.method} ${request.url}`)

            return {
              method: request.method,
              url: request.url,
            }
          },
        },
      },
    })

    await fastify.register(fastifyApiReference, {
      configuration: {
        url: '/openapi.json',
      },
      logLevel: 'silent',
    })

    const address = await fastify.listen({ port: 0 })

    // Make requests to different routes
    await fetch(`${address}/reference/`)
    await fetch(`${address}/reference/openapi.json`)
    await fetch(`${address}/reference/openapi.yaml`)
    await fetch(`${address}/reference/js/scalar.js`)

    expect(loggedRequests).toStrictEqual([])
  })
})
