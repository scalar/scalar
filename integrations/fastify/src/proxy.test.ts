import HttpProxy from '@fastify/http-proxy'
import Fastify from 'fastify'
import { afterEach, describe, expect, it } from 'vitest'

import Scalar from './index'

describe('fastifyApiReference', () => {
  let origin: ReturnType<typeof Fastify>
  let proxy: ReturnType<typeof Fastify>

  afterEach(async () => {
    await proxy?.close()
    await origin?.close()
  })

  it('returns 200 OK for the HTML', async () => {
    origin = Fastify({
      logger: false,
      forceCloseConnections: true,
    })

    await origin.register(Scalar, {
      routePrefix: '/documentation',
      configuration: {
        url: '/openapi.json',
      },
    })

    const originAddress = await origin.listen({ port: 0 })
    const originResponse = await fetch(`${originAddress}/documentation`)

    expect(originResponse.status).toBe(200)

    proxy = Fastify({
      logger: false,
      forceCloseConnections: true,
    })

    await proxy.register(HttpProxy, {
      upstream: originAddress,
      prefix: '/proxy',
    })

    const proxyAddress = await proxy.listen({ port: 0 })
    const proxyResponse = await fetch(`${proxyAddress}/proxy/documentation`)

    expect(proxyResponse.status).toBe(200)

    // Redirect
    expect(proxyResponse.redirected).toBe(true)

    const resolvedUrl = new URL(proxyResponse.url)
    const resolvedPath = resolvedUrl.pathname
    expect(resolvedPath).toBe('/proxy/documentation/')

    // JavaScript
    const proxyResponseBody = await proxyResponse.text()
    expect(proxyResponseBody).toContain('src="js/scalar.js"')

    const assetResponse = await fetch(`${proxyAddress}${resolvedPath}js/scalar.js`)
    expect(assetResponse.status).toBe(200)
  })
})
