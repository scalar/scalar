import Fastify from 'fastify'
import { describe, expect, it, vi } from 'vitest'

import fastifyApiReference from './index'

describe('fastifyApiReference', () => {
  it('returns 200 OK', () =>
    new Promise((resolve) => {
      const fastify = Fastify({
        logger: false,
      })

      fastify.register(fastifyApiReference, {
        routePrefix: '/reference',
        apiReference: {
          specUrl: '/scalar.json',
        },
      })

      fastify.listen({ port: 0 }, function (err, address) {
        fetch(`${address}/reference`).then((response) => {
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
        routePrefix: '/reference',
        apiReference: {
          specUrl: '/scalar.json',
        },
      })

      fastify.listen({ port: 0 }, function (err, address) {
        fetch(`${address}/reference`).then(async (response) => {
          expect(await response.text()).toContain(
            'data-spec-url="/scalar.json"',
          )
          resolve(null)
        })
      })
    }))

  it('has the spec', () =>
    new Promise((resolve) => {
      const spec = {
        openapi: '3.1.0',
        info: {
          title: 'Example',
        },
        paths: {},
      }

      const fastify = Fastify({
        logger: false,
      })

      fastify.register(fastifyApiReference, {
        routePrefix: '/reference',
        apiReference: {
          spec,
        },
      })

      fastify.listen({ port: 0 }, function (err, address) {
        fetch(`${address}/reference`).then(async (response) => {
          expect(await response.text()).toContain(
            `data-spec='${JSON.stringify(spec)}'`,
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
        routePrefix: '/reference',
        apiReference: {
          specUrl: '/scalar.json',
        },
      })

      fastify.listen({ port: 0 }, function (err, address) {
        fetch(`${address}/reference`).then(async (response) => {
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
        routePrefix: '/reference',
        apiReference: {
          title: 'Foobar',
          specUrl: '/scalar.json',
        },
      })

      fastify.listen({ port: 0 }, function (err, address) {
        fetch(`${address}/reference`).then(async (response) => {
          expect(await response.text()).toContain('<title>Foobar</title>')
          resolve(null)
        })
      })
    }))

  it('has the correct content type', () =>
    new Promise((resolve) => {
      const fastify = Fastify({
        logger: false,
      })

      fastify.register(fastifyApiReference, {
        routePrefix: '/reference',
        apiReference: {
          specUrl: '/scalar.json',
        },
      })

      fastify.listen({ port: 0 }, function (err, address) {
        fetch(`${address}/reference`).then(async (response) => {
          expect(response.headers.has('content-type')).toBe(true)
          expect(response.headers.get('content-type')).toContain('text/html')
          resolve(null)
        })
      })
    }))

  it('warns when nothing is passed', () =>
    new Promise((resolve) => {
      const consoleMock = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined)

      const fastify = Fastify({
        logger: false,
      })

      fastify.register(fastifyApiReference, {
        routePrefix: '/reference',
        apiReference: {},
      })

      fastify.listen({ port: 0 }, function (err, address) {
        fetch(`${address}/reference`).then(async () => {
          expect(consoleMock).toHaveBeenCalledOnce()
          resolve(null)
        })
      })
    }))
})
