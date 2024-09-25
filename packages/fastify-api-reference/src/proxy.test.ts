import HttpProxy from '@fastify/http-proxy'
import Fastify from 'fastify'
import { describe, expect, it } from 'vitest'

import Scalar from './index'

describe('fastifyApiReference', () => {
  it('returns 200 OK for the HTML', async () => {
    const origin = Fastify({
      logger: false,
    })

    await origin.register(Scalar, {
      routePrefix: '/documentation',
      publicPath: './',
      configuration: {
        spec: { url: '/openapi.json' },
      },
    })

    origin.get('/origin', async (request, reply) => {
      return { origin: 'origin' }
    })

    const originAddress = await origin.listen({ port: 0 })
    const originResponse = await fetch(`${originAddress}/documentation`)

    expect(originResponse.status).toBe(200)

    const proxy = Fastify({ logger: { name: 'proxy' } })
    proxy.register(HttpProxy, {
      upstream: originAddress,
      prefix: '/proxy',
    })

    const proxyAddress = await proxy.listen({ port: 0 })
    const proxyResponse = await fetch(`${proxyAddress}/documentation`)

    expect(proxyResponse.status).toBe(200)
  })
})
