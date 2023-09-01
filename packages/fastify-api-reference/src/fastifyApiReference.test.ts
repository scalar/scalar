import Fastify from 'fastify'
import { describe, expect, it } from 'vitest'

import fastifyApiReference from './fastifyApiReference'

describe('fastifyApiReference', () => {
  it('returns 200 OK', () =>
    new Promise((resolve) => {
      const fastify = Fastify({
        logger: false,
      })

      fastify.register(fastifyApiReference, {
        prefix: '/api-reference',
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

  it('has the spec URL', () =>
    new Promise((resolve) => {
      const fastify = Fastify({
        logger: false,
      })

      fastify.register(fastifyApiReference, {
        prefix: '/api-reference',
        apiReference: {
          specUrl: '/scalar.json',
        },
      })

      fastify.listen({ port: 0 }, function (err, address) {
        fetch(`${address}/api-reference`).then(async (response) => {
          expect(await response.text()).toContain(
            'data-spec-url="/scalar.json"',
          )
          resolve(null)
        })
      })
    }))

  it('has the default title', () =>
    new Promise((resolve) => {
      const fastify = Fastify({
        logger: false,
      })

      fastify.register(fastifyApiReference, {
        prefix: '/api-reference',
        apiReference: {
          specUrl: '/scalar.json',
        },
      })

      fastify.listen({ port: 0 }, function (err, address) {
        fetch(`${address}/api-reference`).then(async (response) => {
          expect(await response.text()).toContain(
            '<title>API Reference</title>',
          )
          resolve(null)
        })
      })
    }))

  it('has the custom title', () =>
    new Promise((resolve) => {
      const fastify = Fastify({
        logger: false,
      })

      fastify.register(fastifyApiReference, {
        prefix: '/api-reference',
        apiReference: {
          title: 'Foobar',
          specUrl: '/scalar.json',
        },
      })

      fastify.listen({ port: 0 }, function (err, address) {
        fetch(`${address}/api-reference`).then(async (response) => {
          expect(await response.text()).toContain('<title>Foobar</title>')
          resolve(null)
        })
      })
    }))
})
