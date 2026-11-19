import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { configureApiReference, createApp } from './galaxy-scalar-com'

vi.mock('./galaxy-scalar-com', () => ({ createApp: vi.fn(), configureApiReference: vi.fn() }))

describe('_worker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('defers initialization until a request and shares the app across concurrent requests', async () => {
    const app = new Hono()
    let visits = 0
    app.get('/', (c) => c.text(String(++visits)))
    vi.mocked(createApp).mockResolvedValue(app)

    const { default: worker } = await import('./_worker')
    expect(createApp).not.toHaveBeenCalled()
    expect(configureApiReference).not.toHaveBeenCalled()

    const responses = await Promise.all([
      worker.fetch(new Request('https://galaxy.example/')),
      worker.fetch(new Request('https://galaxy.example/')),
    ])
    expect(await Promise.all(responses.map((response) => response.text()))).toStrictEqual(['1', '2'])
    expect(await (await worker.fetch(new Request('https://galaxy.example/'))).text()).toBe('3')
    expect(createApp).toHaveBeenCalledTimes(1)
    expect(configureApiReference).toHaveBeenCalledExactlyOnceWith(app)
  })

  it('forwards Worker bindings and execution context to the app', async () => {
    const app = new Hono()
    const request = new Request('https://galaxy.example/scalar/standalone.esm.js')
    const env = { ASSETS: { fetch: vi.fn().mockResolvedValue(new Response('bundle')) } }
    const context = { waitUntil: vi.fn(), passThroughOnException: vi.fn(), props: {} }
    const task = Promise.resolve()
    app.get('/scalar/*', (c) => {
      c.executionCtx.waitUntil(task)
      const bindings = c.env as typeof env
      return bindings.ASSETS.fetch(c.req.raw)
    })
    vi.mocked(createApp).mockResolvedValue(app)

    const { default: worker } = await import('./_worker')
    const response = await worker.fetch(request, env, context)

    expect(await response.text()).toBe('bundle')
    expect(env.ASSETS.fetch).toHaveBeenCalledExactlyOnceWith(request)
    expect(context.waitUntil).toHaveBeenCalledExactlyOnceWith(task)
  })

  it('retries initialization after a failure', async () => {
    const app = new Hono()
    app.get('/', (c) => c.text('ready'))
    const error = new Error('Initialization failed')
    vi.mocked(createApp).mockRejectedValueOnce(error).mockResolvedValueOnce(app)

    const { default: worker } = await import('./_worker')
    await expect(worker.fetch(new Request('https://galaxy.example/'))).rejects.toBe(error)
    const response = await worker.fetch(new Request('https://galaxy.example/'))

    expect(await response.text()).toBe('ready')
    expect(createApp).toHaveBeenCalledTimes(2)
    expect(configureApiReference).toHaveBeenCalledExactlyOnceWith(app)
  })
})
