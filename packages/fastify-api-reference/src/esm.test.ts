import Fastify from 'fastify'
import { describe, expect, it } from 'vitest'

import fastifyApiReference from '../dist/index'

describe('esm base support', () => {
  it('returns 200 OK', () =>
    new Promise((resolve) => {
      const fastify = Fastify({
        logger: false,
      })

      fastify.register(fastifyApiReference, {
        routePrefix: '/api-reference',
        apiReference: {
          specUrl: '/scalar.json',
        },
      })

      fastify.listen({ port: 0 }, function (err, address) {
        fetch(`${address}/api-reference`).then((response) => {
          expect(response.status).toBe(200)
          resolve(null)
        })
      })
    }))
})
