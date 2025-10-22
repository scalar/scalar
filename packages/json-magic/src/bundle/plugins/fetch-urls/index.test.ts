import { setTimeout } from 'node:timers/promises'

import { type FastifyInstance, fastify } from 'fastify'
import { assert, beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchUrl } from '.'

describe('fetchUrl', () => {
  const noLimit = <T>(fn: () => Promise<T>) => fn()

  let server: FastifyInstance
  const PORT = 7291

  beforeEach(() => {
    server = fastify({ logger: false })

    return async () => {
      await server.close()
      await setTimeout(100)
    }
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
    const headersSpy = vi.fn()

    const response = {
      message: '200OK',
    }

    server.get('/', (request, reply) => {
      headersSpy(request.headers)
      reply.send(response)
    })

    await server.listen({ port: PORT })
    await fetchUrl(url, noLimit, {
      headers: [{ headers: { 'Authorization': 'Bearer <TOKEN>' }, domains: [`localhost:${PORT}`] }],
    })

    expect(headersSpy).toHaveBeenCalledOnce()
    expect(headersSpy).toHaveBeenCalledWith({
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
    const headersSpy = vi.fn()

    const response = {
      message: '200OK',
    }

    server.get('/', (request, reply) => {
      headersSpy(request.headers)
      reply.send(response)
    })

    await server.listen({ port: PORT })
    await fetchUrl(url, noLimit, {
      headers: [{ headers: { 'Authorization': 'Bearer <TOKEN>' }, domains: ['localhost:9932', 'localhost'] }],
    })

    expect(headersSpy).toHaveBeenCalledOnce()
    expect(headersSpy).toHaveBeenNthCalledWith(1, {
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
    const customFetch = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))

    await fetchUrl('https://example.com', (fn) => fn(), {
      fetch: customFetch,
    })

    expect(customFetch).toHaveBeenCalledOnce()
    expect(customFetch).toHaveBeenCalledWith('https://example.com', { headers: undefined })
  })
})
