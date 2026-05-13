import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { err, ok } from '@/types/result'
import { safeRun } from '@/types/safe-run'

describe('safeRun', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns the resolved value as `data` when the async function succeeds', async () => {
    const result = await safeRun(async () => 42)

    expect(result).toEqual(ok(42))
  })

  it('returns `Result` synchronously when the callback returns a non-promise value', () => {
    const result = safeRun(() => 'hello')

    expect(result).toEqual(ok('hello'))
  })

  it('still allows `await` when the callback is synchronous', async () => {
    const result = await safeRun(() => 'hello')

    expect(result).toEqual(ok('hello'))
  })

  it('captures a rejected promise as a failure result with the error message', async () => {
    const result = await safeRun(() => Promise.reject(new Error('boom')))

    expect(result).toEqual(err('boom'))
  })

  it('captures a synchronously thrown error the same way as a rejected promise', () => {
    const result = safeRun((): never => {
      throw new Error('sync boom')
    })

    expect(result).toEqual(err('sync boom'))
  })

  it('stringifies non-Error throwables so the result always carries a string error', () => {
    const stringResult = safeRun(() => {
      throw 'plain string failure'
    })
    const numberResult = safeRun(() => {
      throw 404
    })

    expect(stringResult).toEqual(err('plain string failure'))
    expect(numberResult).toEqual(err('404'))
  })

  it('logs failures through `console.error` so unexpected errors stay visible in devtools', async () => {
    const error = new Error('logged failure')
    await safeRun(() => Promise.reject(error))

    expect(console.error).toHaveBeenCalledWith(error)
  })

  it('does not log when the function succeeds', async () => {
    await safeRun(async () => 'fine')

    expect(console.error).not.toHaveBeenCalled()
  })

  it('preserves the resolved type so callers can use `data` without casting', async () => {
    type User = { id: number; name: string }
    const result = await safeRun<User>(async () => ({ id: 1, name: 'Ada' }))

    if (result.ok) {
      expect(result.data.name).toBe('Ada')
    } else {
      throw new Error('Expected the result to be successful.')
    }
  })

  it('never rejects, even when the inner function throws, so callers can rely on a single resolved branch', async () => {
    const promise = safeRun(() => Promise.reject(new Error('should not bubble')))

    await expect(promise).resolves.toEqual(err('should not bubble'))
  })

  it('logs synchronous failures through `console.error`', () => {
    const error = new Error('logged')
    safeRun(() => {
      throw error
    })

    expect(console.error).toHaveBeenCalledWith(error)
  })
})
