import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { safeRun } from './safe-run'

describe('safeRun', () => {
  // Suppress and capture the helper's diagnostic `console.error` calls so the
  // test output stays clean while still letting us assert that failures are
  // logged for devtools visibility.
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns the resolved value as `data` when the async function succeeds', async () => {
    const result = await safeRun(async () => 42)

    expect(result).toEqual({ ok: true, data: 42 })
  })

  it('also accepts synchronous functions and wraps the return value', async () => {
    const result = await safeRun(() => 'hello')

    expect(result).toEqual({ ok: true, data: 'hello' })
  })

  it('captures a rejected promise as a failure result with the error message', async () => {
    const result = await safeRun(() => Promise.reject(new Error('boom')))

    expect(result).toEqual({ ok: false, error: 'boom' })
  })

  it('captures a synchronously thrown error the same way as a rejected promise', async () => {
    const result = await safeRun((): never => {
      throw new Error('sync boom')
    })

    expect(result).toEqual({ ok: false, error: 'sync boom' })
  })

  it('stringifies non-Error throwables so the result always carries a string error', async () => {
    // Code occasionally throws plain strings or numbers (especially through
    // dynamic boundaries). The helper should still surface a usable message
    // rather than `[object Object]` or `undefined`.
    const stringResult = await safeRun(() => {
      throw 'plain string failure'
    })
    const numberResult = await safeRun(() => {
      throw 404
    })

    expect(stringResult).toEqual({ ok: false, error: 'plain string failure' })
    expect(numberResult).toEqual({ ok: false, error: '404' })
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
      // The cast-free property access here is the actual assertion - if the
      // generic dropped through to `unknown`, the file would not compile.
      expect(result.data.name).toBe('Ada')
    } else {
      throw new Error('Expected the result to be successful.')
    }
  })

  it('never rejects, even when the inner function throws, so callers can rely on a single resolved branch', async () => {
    // The whole point of the helper is to stop exceptions from bubbling. We
    // deliberately never wrap the await in `expect().rejects` here because
    // that would mask a regression where `safeRun` started rethrowing.
    const promise = safeRun(() => Promise.reject(new Error('should not bubble')))

    await expect(promise).resolves.toEqual({ ok: false, error: 'should not bubble' })
  })
})
