import { createMockContext } from '@test/utils/create-mock-context'
import { describe, expect, it, vi } from 'vitest'

import { createStreamResponse } from '@/utils/create-stream-response'

vi.mock('hono/streaming', () => ({
  stream: vi.fn((_c, callback) => {
    const writes: string[] = []
    const mockStreamApi = {
      write: vi.fn((data: string) => {
        writes.push(data)
      }),
      _getWrites: () => writes,
    }

    /** Execute the callback but don't wait for it (it's infinite) */
    const promise = callback(mockStreamApi)

    return { promise, streamApi: mockStreamApi, writes }
  }),
}))

describe('create-stream-response', () => {
  it('calls the stream helper from hono', async () => {
    const { stream } = await import('hono/streaming')
    const mockContext = createMockContext()

    createStreamResponse(mockContext as any)

    expect(stream).toHaveBeenCalled()
    expect(stream).toHaveBeenCalledWith(mockContext, expect.any(Function))
  })

  it('writes ping data to the stream', async () => {
    const mockContext = createMockContext()

    const result = createStreamResponse(mockContext as any) as any

    /** Give the stream callback time to execute its first write */
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(result.writes).toContain('data: ping\n')
  })

  it('continues writing ping data at intervals', async () => {
    vi.useFakeTimers()
    const mockContext = createMockContext()

    const result = createStreamResponse(mockContext as any) as any

    /** Advance past the first write */
    await vi.advanceTimersByTimeAsync(10)
    const initialWriteCount = result.writes.length

    /** Advance by 1 second to trigger another write */
    await vi.advanceTimersByTimeAsync(1000)

    expect(result.writes.length).toBeGreaterThan(initialWriteCount)
    expect(result.writes.filter((w: string) => w === 'data: ping\n').length).toBeGreaterThanOrEqual(2)

    vi.useRealTimers()
  })
})
