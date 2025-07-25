import { fastify, type FastifyInstance } from 'fastify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchUrl } from '.'
import assert from 'node:assert'
import { setTimeout } from 'node:timers/promises'

describe('fetchUrl', () => {
  const noLimit = <T>(fn: () => Promise<T>) => fn()

  let server: FastifyInstance
  const PORT = 7291

  beforeEach(() => {
    server = fastify({ logger: false })
  })

  afterEach(async () => {
    await server.close()
    await setTimeout(100)
  })

  it('reads json response', async () => {
    const url = `http://localhost:${PORT}`

    const response = {
      message: '200OK',
    }

    server.get('/', (_, reply) => {
      reply.send(response)
    })

    await server.listen({ port: PORT })

    const result = await fetchUrl(url, noLimit)

    expect(result.ok).toBe(true)
    assert(result.ok === true)
    expect(result.data).toEqual(response)
  })

  it('reads yaml response', async () => {
    const url = `http://localhost:${PORT}`

    server.get('/', (_, reply) => {
      reply.header('content-type', 'application/yml').send('a: a')
    })

    await server.listen({ port: PORT })

    const result = await fetchUrl(url, noLimit)

    expect(result.ok).toBe(true)
    assert(result.ok === true)
    expect(result.data).toEqual({ a: 'a' })
  })

  it('returns error on non-200 response', async () => {
    const url = `http://localhost:${PORT}`

    server.get('/', (_, reply) => {
      reply.status(404).send()
    })

    await server.listen({ port: PORT })

    const result = await fetchUrl(url, noLimit)

    expect(result.ok).toBe(false)
  })

  it('send headers to the specified domain', async () => {
    const url = `http://localhost:${PORT}`
    const fn = vi.fn()

    const response = {
      message: '200OK',
    }

    server.get('/', (request, reply) => {
      fn(request.headers)
      reply.send(response)
    })

    await server.listen({ port: PORT })
    await fetchUrl(url, noLimit, {
      headers: [{ headers: { 'Authorization': 'Bearer <TOKEN>' }, domains: [`localhost:${PORT}`] }],
    })

    expect(fn).toHaveBeenCalled()
    expect(fn.mock.calls[0][0]).toEqual({
      'accept': '*/*',
      'accept-encoding': 'gzip, deflate',
      'accept-language': '*',
      'authorization': 'Bearer <TOKEN>',
      'connection': 'keep-alive',
      'host': `localhost:${PORT}`,
      'sec-fetch-mode': 'cors',
      'user-agent': 'node',
    })
  })

  it('does not send headers to other domains', async () => {
    const url = `http://localhost:${PORT}`
    const fn = vi.fn()

    const response = {
      message: '200OK',
    }

    server.get('/', (request, reply) => {
      fn(request.headers)
      reply.send(response)
    })

    await server.listen({ port: PORT })
    await fetchUrl(url, noLimit, {
      headers: [{ headers: { 'Authorization': 'Bearer <TOKEN>' }, domains: ['localhost:9932', 'localhost'] }],
    })

    expect(fn).toHaveBeenCalled()
    expect(fn.mock.calls[0][0]).toEqual({
      'accept': '*/*',
      'accept-encoding': 'gzip, deflate',
      'accept-language': '*',
      'connection': 'keep-alive',
      'host': `localhost:${PORT}`,
      'sec-fetch-mode': 'cors',
      'user-agent': 'node',
    })
  })

  it('runs custom fetcher', async () => {
    const fn = vi.fn()

    await fetchUrl('https://example.com', (fn) => fn(), {
      fetch: async (input, init) => {
        fn(input, init)

        return new Response('{}', { status: 200 })
      },
    })

    expect(fn).toHaveBeenCalled()
    expect(fn).toHaveBeenCalledWith('https://example.com', { headers: undefined })
  })
})
