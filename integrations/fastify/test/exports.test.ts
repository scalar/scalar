import Fastify from 'fastify'
import { describe, expect, it } from 'vitest'

describe('exports', () => {
  it('ESM export', () =>
    new Promise((resolve) => {
      const fastify = Fastify({
        logger: false,
      })

      fastify.register(import('../dist/index.js'), {
        routePrefix: '/foobar',
        configuration: {
          url: '/openapi.json',
        },
      })

      fastify.listen({ port: 0 }, (_err, address) => {
        fetch(`${address}/foobar`).then((response) => {
          expect(response.status).toBe(200)
          resolve(null)
        })
      })
    }))
})
