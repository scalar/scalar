import type { AddressInfo } from 'node:net'

import { type FastifyInstance, fastify } from 'fastify'
import { assert, beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchUrl, fetchUrls } from '.'
import { fetchUrls as browserFetchUrls } from './browser'

describe('fetchUrl', () => {
  const noLimit = <T>(fn: () => Promise<T>) => fn()

  let server: FastifyInstance

  beforeEach(() => {
    server = fastify({ logger: false })

    return async () => {
      await server.close()
    }
  })

  it('reads json response', async () => {
    const response = {
      message: '200OK',
    }

    server.get('/', (_, reply) => {
      reply.send(response)
    })

    await server.listen({ port: 0 })
    const port = (server.server.address() as AddressInfo).port
    const url = `http://localhost:${port}`

    const result = await fetchUrl(url, noLimit)

    expect(result.ok).toBe(true)
    assert(result.ok === true)
    expect(result.data).toEqual(response)
  })

  it('reads yaml response', async () => {
    server.get('/', (_, reply) => {
      reply.header('content-type', 'application/yml').send('a: a')
    })

    await server.listen({ port: 0 })
    const port = (server.server.address() as AddressInfo).port
    const url = `http://localhost:${port}`

    const result = await fetchUrl(url, noLimit)

    expect(result.ok).toBe(true)
    assert(result.ok === true)
    expect(result.data).toEqual({ a: 'a' })
  })

  it('returns error on non-200 response', async () => {
    server.get('/', (_, reply) => {
      reply.status(404).send()
    })

    await server.listen({ port: 0 })
    const port = (server.server.address() as AddressInfo).port
    const url = `http://localhost:${port}`

    const result = await fetchUrl(url, noLimit)

    expect(result).toStrictEqual({ ok: false, status: 404 })
  })

  it('send headers to the specified domain', async () => {
    const headersSpy = vi.fn()

    const response = {
      message: '200OK',
    }

    server.get('/', (request, reply) => {
      headersSpy(request.headers)
      reply.send(response)
    })

    await server.listen({ port: 0 })
    const port = (server.server.address() as AddressInfo).port
    const url = `http://localhost:${port}`

    await fetchUrl(url, noLimit, {
      headers: [{ headers: { 'Authorization': 'Bearer <TOKEN>' }, domains: [`localhost:${port}`] }],
    })

    expect(headersSpy).toHaveBeenCalledOnce()
    expect(headersSpy).toHaveBeenCalledWith({
      'accept': '*/*',
      'accept-encoding': 'gzip, deflate',
      'accept-language': '*',
      'authorization': 'Bearer <TOKEN>',
      'connection': 'keep-alive',
      'host': `localhost:${port}`,
      'sec-fetch-mode': 'cors',
      'user-agent': 'node',
    })
  })

  it('does not send headers to other domains', async () => {
    const headersSpy = vi.fn()

    const response = {
      message: '200OK',
    }

    server.get('/', (request, reply) => {
      headersSpy(request.headers)
      reply.send(response)
    })

    await server.listen({ port: 0 })
    const port = (server.server.address() as AddressInfo).port
    const url = `http://localhost:${port}`

    await fetchUrl(url, noLimit, {
      headers: [{ headers: { 'Authorization': 'Bearer <TOKEN>' }, domains: ['localhost:9932', 'localhost'] }],
    })

    expect(headersSpy).toHaveBeenCalledOnce()
    expect(headersSpy).toHaveBeenNthCalledWith(1, {
      'accept': '*/*',
      'accept-encoding': 'gzip, deflate',
      'accept-language': '*',
      'connection': 'keep-alive',
      'host': `localhost:${port}`,
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

describe('fetchUrls', () => {
  const source = 'const value = {\r\n  text: "hello",\r\n};\r\n'

  it.each([fetchUrls, browserFetchUrls])('reads code without JSON/YAML parsing using %s', async (createLoader) => {
    const loader = createLoader({ fetch: () => Promise.resolve(new Response(source)) })
    expect(await loader.exec('https://example.test/sample.js', { parseAs: 'text' })).toStrictEqual({
      ok: true,
      data: source,
      raw: source,
    })
  })

  it.each([fetchUrls, browserFetchUrls])('keeps default document parsing with %s', async (createLoader) => {
    const loader = createLoader({ fetch: () => Promise.resolve(new Response('{"value":true}')) })
    expect(await loader.exec('https://example.test/sample.json')).toStrictEqual({
      ok: true,
      data: { value: true },
      raw: '{"value":true}',
    })
  })

  it('caps the number of concurrent requests when a limit is given', async () => {
    let active = 0
    let maxActive = 0

    // A fetch that stays briefly "in flight" so we can observe how many run at the same time.
    const fetch = vi.fn(async () => {
      active += 1
      maxActive = Math.max(maxActive, active)
      await new Promise((resolve) => setTimeout(resolve, 10))
      active -= 1
      return new Response('{}', { status: 200 })
    })

    const loader = fetchUrls({ fetch, limit: 2 })

    // Kick off more requests than the limit allows.
    await Promise.all(Array.from({ length: 6 }, (_, index) => loader.exec(`https://example.com/${index}`)))

    expect(maxActive).toBeLessThanOrEqual(2)
    expect(fetch).toHaveBeenCalledTimes(6)
  })
})

describe('fetchUrl blockPrivateNetworks', () => {
  const noLimit = <T>(fn: () => Promise<T>) => fn()

  it('refuses a private or metadata address without calling fetch', async () => {
    const fetch = vi.fn(async () => new Response('{}', { status: 200 }))

    const result = await fetchUrl('http://169.254.169.254/latest/meta-data/', noLimit, {
      blockPrivateNetworks: true,
      fetch,
    })

    expect(result.ok).toBe(false)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('rejects custom transports that could bypass the guarded connection', async () => {
    const fetch = vi.fn(async () => new Response('{}', { status: 200 }))

    const result = await fetchUrl('http://93.184.216.34/', noLimit, {
      blockPrivateNetworks: true,
      fetch,
    })

    expect(result).toStrictEqual({ ok: false })
    expect(fetch).not.toHaveBeenCalled()
  })
})
