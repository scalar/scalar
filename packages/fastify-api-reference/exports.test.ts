import Fastify from 'fastify'
import { describe, expect, it } from 'vitest'

describe('exports', () => {
  it('supports import', () =>
    new Promise((resolve) => {
      const fastify = Fastify({
        logger: false,
      })

      fastify.register(import('./dist/index.js'), {
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

  it('supports require', () =>
    new Promise((resolve) => {
      const fastify = Fastify({
        logger: false,
      })

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      fastify.register(require('./dist/index.umd.cjs'), {
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
