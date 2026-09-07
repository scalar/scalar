import { gzipSync } from 'node:zlib'

import { describe, expect, it, vi } from 'vitest'

import { createFetchBudget, readBoundedBody, withAbort } from './fetch-budget'

describe('fetch-budget', () => {
  it('reads normal streaming input within the budget', async () => {
    const budget = createFetchBudget({ maxResponseBytes: 5, maxTotalBytes: 5 })
    const result = await readBoundedBody(new Response('hello').body, budget, budget.start())
    expect(new TextDecoder().decode(result)).toBe('hello')
  })

  it('cancels an oversized response before retaining all its chunks', async () => {
    const cancel = vi.fn()
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(new Uint8Array(4))
      },
      cancel,
    })
    const budget = createFetchBudget({ maxResponseBytes: 5 })
    await expect(readBoundedBody(body, budget, budget.start())).rejects.toThrow('response byte limit')
    expect(cancel).toHaveBeenCalledOnce()
  })

  it('counts decompressed bytes instead of the compressed Content-Length', async () => {
    const compressed = gzipSync('x'.repeat(10_000))
    expect(compressed.byteLength).toBeLessThan(100)
    const body = new Response(compressed).body?.pipeThrough(new DecompressionStream('gzip')) ?? null
    const budget = createFetchBudget({ maxResponseBytes: 100 })
    await expect(readBoundedBody(body, budget, budget.start())).rejects.toThrow('response byte limit')
  })

  it('cancels a slow stream at the shared deadline', async () => {
    const cancel = vi.fn()
    const body = new ReadableStream<Uint8Array>({ cancel })
    const budget = createFetchBudget({ timeoutMs: 20 })
    await expect(readBoundedBody(body, budget, budget.start())).rejects.toThrow()
    expect(cancel).toHaveBeenCalledOnce()
  })

  it('aborts concurrent readers when their aggregate bytes exceed the budget', async () => {
    const budget = createFetchBudget({ maxTotalBytes: 5 })
    const firstSignal = budget.start()
    const secondSignal = budget.start()
    const pendingCancel = vi.fn()
    const pending = readBoundedBody(new ReadableStream({ cancel: pendingCancel }), budget, firstSignal)
    const rejection = expect(pending).rejects.toThrow('total byte limit')
    await expect(readBoundedBody(new Response('123456').body, budget, secondSignal)).rejects.toThrow('total byte limit')
    await rejection
    expect(pendingCancel).toHaveBeenCalledOnce()
    expect(firstSignal.aborted).toBe(true)
  })

  it('shares accounting across completed responses', async () => {
    const budget = createFetchBudget({ maxResponseBytes: 5, maxTotalBytes: 5 })
    await readBoundedBody(new Response('123').body, budget, budget.start())
    await expect(readBoundedBody(new Response('456').body, budget, budget.start())).rejects.toThrow('total byte limit')
  })

  it('does not reset the deadline between requests', async () => {
    const budget = createFetchBudget({ timeoutMs: 20 })
    const first = budget.start()
    await expect(withAbort(new Promise(() => undefined), first)).rejects.toThrow()
    expect(() => budget.start()).toThrow()
  })

  it('limits the total number of loads and cancels active requests', () => {
    const budget = createFetchBudget({ maxRequests: 1 })
    const signal = budget.start()
    expect(() => budget.start()).toThrow('reference count limit')
    expect(signal.aborted).toBe(true)
  })

  it.each([0, -1, Number.POSITIVE_INFINITY, Number.NaN, 0.5])('rejects invalid limits %s', (maxRequests) => {
    expect(() => createFetchBudget({ maxRequests })).toThrow('Invalid remote fetch limit')
  })
})
