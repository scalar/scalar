import Fastify from 'fastify'
import { afterEach, describe, expect, it } from 'vitest'

describe('exports', () => {
  let fastify: ReturnType<typeof Fastify>

  afterEach(async () => {
    await fastify?.close()
  })

  it('ESM export', async () => {
    fastify = Fastify({
      logger: false,
    })

    fastify.register(import('../dist/index.js'), {
      routePrefix: '/foobar',
      configuration: {
        url: '/openapi.json',
      },
    })

    const address = await fastify.listen({ port: 0 })

    const response = await fetch(`${address}/foobar`)
    expect(response.status).toBe(200)
  })
})
