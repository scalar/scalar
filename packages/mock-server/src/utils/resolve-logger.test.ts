import { afterEach, describe, expect, it, vi } from 'vitest'

import { resolveLogger } from './resolve-logger'

describe('resolveLogger', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns a provided function untouched', () => {
    const sink = vi.fn()

    expect(resolveLogger(sink, true)).toBe(sink)
  })

  it('logs to the console when true', () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    resolveLogger(true, false)('hello')

    expect(consoleLogSpy).toHaveBeenCalledWith('hello')
  })

  it('drops every line when false', () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    resolveLogger(false, true)('hello')

    expect(consoleLogSpy).not.toHaveBeenCalled()
  })

  it('falls back to the default when undefined', () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    resolveLogger(undefined, true)('enabled by default')
    expect(consoleLogSpy).toHaveBeenCalledWith('enabled by default')

    consoleLogSpy.mockClear()

    resolveLogger(undefined, false)('disabled by default')
    expect(consoleLogSpy).not.toHaveBeenCalled()
  })
})
