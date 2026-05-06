import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createWorkspaceEventBus } from './bus'

const debounceInstances = vi.hoisted((): Array<{ flushAll: ReturnType<typeof vi.fn> }> => [])

vi.mock('@scalar/helpers/general/debounce', async (importOriginal) => {
  type DebounceModule = typeof import('@scalar/helpers/general/debounce')
  const actual = await importOriginal<DebounceModule>()

  return {
    debounce: vi.fn((options: Parameters<DebounceModule['debounce']>[0]) => {
      const debounced = actual.debounce(options)
      const flushAll = vi.fn(debounced.flushAll)

      debounceInstances.push({ flushAll })

      return {
        ...debounced,
        flushAll,
      }
    }),
  }
})

const flushDebouncedEmits = (bus: ReturnType<typeof createWorkspaceEventBus>) => {
  if (!bus.flushDebouncedEmits) {
    throw new Error('Expected flushDebouncedEmits to exist')
  }

  bus.flushDebouncedEmits()
}

describe('createWorkspaceEventBus', () => {
  beforeEach(() => {
    debounceInstances.length = 0
    vi.clearAllMocks()
  })

  it('subscribes to an event and receives the payload when emitted', () => {
    const bus = createWorkspaceEventBus()
    const handler = vi.fn()

    bus.on('update:dark-mode', handler)
    bus.emit('update:dark-mode', true)

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith(true)
  })

  it('does not call listener when different event is emitted', () => {
    const bus = createWorkspaceEventBus()
    const handler = vi.fn()

    bus.on('update:dark-mode', handler)
    bus.emit('update:active-document', 'doc-123')

    expect(handler).not.toHaveBeenCalled()
  })

  it('returns an unsubscribe function that removes the listener', () => {
    const bus = createWorkspaceEventBus()
    const handler = vi.fn()

    const unsubscribe = bus.on('update:dark-mode', handler)
    bus.emit('update:dark-mode', true)
    expect(handler).toHaveBeenCalledTimes(1)

    unsubscribe()
    bus.emit('update:dark-mode', false)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('calls all listeners when event is emitted', () => {
    const bus = createWorkspaceEventBus()
    const handler1 = vi.fn()
    const handler2 = vi.fn()
    const handler3 = vi.fn()

    bus.on('update:dark-mode', handler1)
    bus.on('update:dark-mode', handler2)
    bus.on('update:dark-mode', handler3)

    bus.emit('update:dark-mode', true)

    expect(handler1).toHaveBeenCalledWith(true)
    expect(handler2).toHaveBeenCalledWith(true)
    expect(handler3).toHaveBeenCalledWith(true)
  })

  it('removes only the specific listener when unsubscribing', () => {
    const bus = createWorkspaceEventBus()
    const handler1 = vi.fn()
    const handler2 = vi.fn()
    const handler3 = vi.fn()

    bus.on('update:dark-mode', handler1)
    const unsubscribe2 = bus.on('update:dark-mode', handler2)
    bus.on('update:dark-mode', handler3)

    unsubscribe2()
    bus.emit('update:dark-mode', true)

    expect(handler1).toHaveBeenCalledWith(true)
    expect(handler2).not.toHaveBeenCalled()
    expect(handler3).toHaveBeenCalledWith(true)
  })

  it('keeps other listeners intact when removing one', () => {
    const bus = createWorkspaceEventBus()
    const handler1 = vi.fn()
    const handler2 = vi.fn()

    bus.on('update:dark-mode', handler1)
    bus.on('update:dark-mode', handler2)

    bus.off('update:dark-mode', handler1)
    bus.emit('update:dark-mode', true)

    expect(handler1).not.toHaveBeenCalled()
    expect(handler2).toHaveBeenCalledWith(true)
  })

  it('handles emitting events with no listeners', () => {
    const bus = createWorkspaceEventBus()

    expect(() => {
      bus.emit('update:dark-mode', true)
    }).not.toThrow()
  })

  it('handles removing listeners during emission', () => {
    const bus = createWorkspaceEventBus()
    const handler1 = vi.fn()
    const handler2 = vi.fn()
    const handler3 = vi.fn()

    let unsubscribe2: (() => void) | null = null

    bus.on('update:dark-mode', () => {
      unsubscribe2?.()
      handler1()
    })

    unsubscribe2 = bus.on('update:dark-mode', handler2)
    bus.on('update:dark-mode', handler3)

    bus.emit('update:dark-mode', true)

    expect(handler1).toHaveBeenCalledTimes(1)
    expect(handler2).toHaveBeenCalledTimes(1)
    expect(handler3).toHaveBeenCalledTimes(1)

    bus.emit('update:dark-mode', false)
    expect(handler1).toHaveBeenCalledTimes(2)
    expect(handler2).toHaveBeenCalledTimes(1)
    expect(handler3).toHaveBeenCalledTimes(2)
  })

  describe('once', () => {
    it('fires the listener exactly once', () => {
      const bus = createWorkspaceEventBus()
      const handler = vi.fn()

      bus.once('update:dark-mode', handler)
      bus.emit('update:dark-mode', true)
      bus.emit('update:dark-mode', false)
      bus.emit('update:dark-mode', true)

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith(true)
    })

    it('passes the payload to the listener', () => {
      const bus = createWorkspaceEventBus()
      const handler = vi.fn()

      bus.once('update:active-document', handler)
      bus.emit('update:active-document', 'doc-abc')

      expect(handler).toHaveBeenCalledWith('doc-abc')
    })

    it('returns an unsubscribe function that prevents the listener from firing', () => {
      const bus = createWorkspaceEventBus()
      const handler = vi.fn()

      const unsubscribe = bus.once('update:dark-mode', handler)
      unsubscribe()
      bus.emit('update:dark-mode', true)

      expect(handler).not.toHaveBeenCalled()
    })

    it('does not interfere with regular on() listeners for the same event', () => {
      const bus = createWorkspaceEventBus()
      const onceHandler = vi.fn()
      const onHandler = vi.fn()

      bus.once('update:dark-mode', onceHandler)
      bus.on('update:dark-mode', onHandler)

      bus.emit('update:dark-mode', true)
      bus.emit('update:dark-mode', false)

      expect(onceHandler).toHaveBeenCalledTimes(1)
      expect(onHandler).toHaveBeenCalledTimes(2)
    })

    it('multiple once() listeners each fire only once independently', () => {
      const bus = createWorkspaceEventBus()
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      bus.once('update:dark-mode', handler1)
      bus.once('update:dark-mode', handler2)

      bus.emit('update:dark-mode', true)
      bus.emit('update:dark-mode', false)

      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)
    })
  })

  it('handles debouncing when there is a debounce key present', () => {
    vi.useFakeTimers()
    const bus = createWorkspaceEventBus()
    const handler = vi.fn()

    bus.on('update:dark-mode', handler)
    bus.emit('update:dark-mode', true, { debounceKey: 'test' })
    bus.emit('update:dark-mode', true, { debounceKey: 'test' })
    bus.emit('update:dark-mode', true, { debounceKey: 'test' })

    // Handler should not have been called yet
    expect(handler).toHaveBeenCalledTimes(0)

    // Advance time to trigger the debounced function
    vi.advanceTimersByTime(400)

    // Now the handler should have been called only once
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith(true)

    vi.useRealTimers()
  })

  it('handles different debounce keys independently', () => {
    vi.useFakeTimers()
    const bus = createWorkspaceEventBus()
    const handler = vi.fn()

    bus.on('update:dark-mode', handler)

    // Emit with two different debounce keys
    bus.emit('update:dark-mode', true, { debounceKey: 'key1' })
    bus.emit('update:dark-mode', false, { debounceKey: 'key2' })

    expect(handler).toHaveBeenCalledTimes(0)

    // Advance time
    vi.advanceTimersByTime(400)

    // Both should have been called once each
    expect(handler).toHaveBeenCalledTimes(2)

    vi.useRealTimers()
  })

  it('does not debounce when no debounce key is provided', () => {
    vi.useFakeTimers()
    const bus = createWorkspaceEventBus()
    const handler = vi.fn()

    bus.on('update:dark-mode', handler)
    bus.emit('update:dark-mode', true)
    bus.emit('update:dark-mode', false)
    bus.emit('update:dark-mode', true)

    // Should be called immediately without debouncing
    expect(handler).toHaveBeenCalledTimes(3)

    vi.useRealTimers()
  })

  it('handles mix of debounced and non-debounced emits', () => {
    vi.useFakeTimers()
    const bus = createWorkspaceEventBus()
    const handler = vi.fn()

    bus.on('update:dark-mode', handler)

    // Non-debounced emit
    bus.emit('update:dark-mode', true)
    expect(handler).toHaveBeenCalledTimes(1)

    // Debounced emits
    bus.emit('update:dark-mode', false, { debounceKey: 'test' })
    bus.emit('update:dark-mode', true, { debounceKey: 'test' })
    expect(handler).toHaveBeenCalledTimes(1)

    // Advance time
    vi.advanceTimersByTime(400)
    expect(handler).toHaveBeenCalledTimes(2)

    vi.useRealTimers()
  })

  it('uses the latest payload value when debouncing multiple emits', () => {
    vi.useFakeTimers()
    const bus = createWorkspaceEventBus()
    const handler = vi.fn()

    bus.on('update:dark-mode', handler)

    // Emit multiple times with different payloads
    bus.emit('update:dark-mode', true, { debounceKey: 'test' })
    bus.emit('update:dark-mode', false, { debounceKey: 'test' })
    bus.emit('update:dark-mode', true, { debounceKey: 'test' })

    expect(handler).toHaveBeenCalledTimes(0)

    // Advance time
    vi.advanceTimersByTime(400)

    // Should be called once with the last payload value
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith(true)

    vi.useRealTimers()
  })

  it('flushes pending debounced emits immediately', () => {
    vi.useFakeTimers()
    const bus = createWorkspaceEventBus()
    const handler = vi.fn()

    bus.on('update:dark-mode', handler)
    bus.emit('update:dark-mode', true, { debounceKey: 'test' })

    expect(handler).toHaveBeenCalledTimes(0)

    flushDebouncedEmits(bus)

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith(true)

    vi.advanceTimersByTime(400)

    expect(handler).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })

  it('delegates debounced emit flushing to debounce flushAll', () => {
    const bus = createWorkspaceEventBus()

    bus.emit('update:dark-mode', true, { debounceKey: 'test' })
    flushDebouncedEmits(bus)

    expect(debounceInstances.length).toBe(1)
    expect(debounceInstances[0]?.flushAll).toHaveBeenCalledTimes(1)
  })

  it('flushes the latest payload for each pending debounce key', () => {
    vi.useFakeTimers()
    const bus = createWorkspaceEventBus()
    const handler = vi.fn()

    bus.on('update:dark-mode', handler)
    bus.emit('update:dark-mode', true, { debounceKey: 'first' })
    bus.emit('update:dark-mode', false, { debounceKey: 'first' })
    bus.emit('update:dark-mode', true, { debounceKey: 'second' })

    flushDebouncedEmits(bus)

    expect(handler).toHaveBeenCalledTimes(2)
    expect(handler).toHaveBeenNthCalledWith(1, false)
    expect(handler).toHaveBeenNthCalledWith(2, true)

    vi.advanceTimersByTime(400)

    expect(handler).toHaveBeenCalledTimes(2)

    vi.useRealTimers()
  })

  it('does not flush already executed debounced emits again', () => {
    vi.useFakeTimers()
    const bus = createWorkspaceEventBus()
    const handler = vi.fn()

    bus.on('update:dark-mode', handler)
    bus.emit('update:dark-mode', true, { debounceKey: 'test' })

    vi.advanceTimersByTime(400)

    expect(handler).toHaveBeenCalledTimes(1)

    flushDebouncedEmits(bus)

    expect(handler).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })

  describe('onGlob / offGlob', () => {
    it('catches every event with the wildcard pattern', () => {
      const bus = createWorkspaceEventBus()
      const handler = vi.fn()

      bus.onGlob('*', handler)
      bus.emit('update:dark-mode', true)
      bus.emit('update:active-document', 'doc-123')

      expect(handler).toHaveBeenCalledTimes(2)
      expect(handler).toHaveBeenNthCalledWith(1, 'update:dark-mode', true)
      expect(handler).toHaveBeenNthCalledWith(2, 'update:active-document', 'doc-123')
    })

    it('catches only matching events with a prefix glob pattern', () => {
      const bus = createWorkspaceEventBus()
      const handler = vi.fn()

      bus.onGlob('operation:*', handler)
      bus.emit('operation:cancel:request')
      bus.emit('update:dark-mode', true)
      bus.emit('operation:send:request:hotkey')

      expect(handler).toHaveBeenCalledTimes(2)
      expect(handler).toHaveBeenNthCalledWith(1, 'operation:cancel:request', undefined)
      expect(handler).toHaveBeenNthCalledWith(2, 'operation:send:request:hotkey', undefined)
    })

    it('returns an unsubscribe function that stops the listener', () => {
      const bus = createWorkspaceEventBus()
      const handler = vi.fn()

      const unsubscribe = bus.onGlob('*', handler)
      bus.emit('update:dark-mode', true)
      expect(handler).toHaveBeenCalledTimes(1)

      unsubscribe()
      bus.emit('update:dark-mode', false)
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('offGlob removes a specific listener without affecting others', () => {
      const bus = createWorkspaceEventBus()
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      bus.onGlob('*', handler1)
      bus.onGlob('*', handler2)

      bus.offGlob('*', handler1)
      bus.emit('update:dark-mode', true)

      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).toHaveBeenCalledWith('update:dark-mode', true)
    })

    it('two different patterns work independently', () => {
      const bus = createWorkspaceEventBus()
      const allHandler = vi.fn()
      const opHandler = vi.fn()

      bus.onGlob('*', allHandler)
      bus.onGlob('operation:*', opHandler)

      bus.emit('update:dark-mode', true)
      bus.emit('operation:cancel:request')

      expect(allHandler).toHaveBeenCalledTimes(2)
      expect(opHandler).toHaveBeenCalledTimes(1)
      expect(opHandler).toHaveBeenCalledWith('operation:cancel:request', undefined)
    })

    it('cleans up the pattern entry when the last glob listener is removed', () => {
      const bus = createWorkspaceEventBus()
      const handler = vi.fn()

      bus.onGlob('*', handler)
      bus.offGlob('*', handler)

      // After removing, emitting should still not throw
      expect(() => bus.emit('update:dark-mode', true)).not.toThrow()
      expect(handler).not.toHaveBeenCalled()
    })

    it('does not break exact-match listeners when a glob listener is also registered', () => {
      const bus = createWorkspaceEventBus()
      const exactHandler = vi.fn()
      const globHandler = vi.fn()

      bus.on('update:dark-mode', exactHandler)
      bus.onGlob('*', globHandler)

      bus.emit('update:dark-mode', false)

      expect(exactHandler).toHaveBeenCalledWith(false)
      expect(globHandler).toHaveBeenCalledWith('update:dark-mode', false)
    })

    it('glob listener receives debounced events once settled', () => {
      vi.useFakeTimers()
      const bus = createWorkspaceEventBus()
      const handler = vi.fn()

      bus.onGlob('update:*', handler)
      bus.emit('update:dark-mode', true, { debounceKey: 'test' })
      bus.emit('update:dark-mode', false, { debounceKey: 'test' })

      expect(handler).toHaveBeenCalledTimes(0)

      vi.advanceTimersByTime(400)

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith('update:dark-mode', false)

      vi.useRealTimers()
    })

    it('all glob listeners on the same pattern fire when that pattern matches', () => {
      const bus = createWorkspaceEventBus()
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const handler3 = vi.fn()

      bus.onGlob('operation:*', handler1)
      bus.onGlob('operation:*', handler2)
      bus.onGlob('operation:*', handler3)

      bus.emit('operation:cancel:request')

      expect(handler1).toHaveBeenCalledWith('operation:cancel:request', undefined)
      expect(handler2).toHaveBeenCalledWith('operation:cancel:request', undefined)
      expect(handler3).toHaveBeenCalledWith('operation:cancel:request', undefined)
    })

    it('a throwing glob listener does not prevent other glob listeners from firing', () => {
      const bus = createWorkspaceEventBus()
      const throwingHandler = vi.fn(() => {
        throw new Error('glob boom')
      })
      const safeHandler = vi.fn()

      bus.onGlob('*', throwingHandler)
      bus.onGlob('*', safeHandler)

      expect(() => bus.emit('update:dark-mode', true)).not.toThrow()

      expect(throwingHandler).toHaveBeenCalledTimes(1)
      expect(safeHandler).toHaveBeenCalledWith('update:dark-mode', true)
    })

    it('a throwing glob listener does not prevent exact-match listeners from firing', () => {
      const bus = createWorkspaceEventBus()
      const throwingGlobHandler = vi.fn(() => {
        throw new Error('glob boom')
      })
      const exactHandler = vi.fn()

      bus.on('update:dark-mode', exactHandler)
      bus.onGlob('*', throwingGlobHandler)

      expect(() => bus.emit('update:dark-mode', true)).not.toThrow()

      expect(exactHandler).toHaveBeenCalledWith(true)
    })

    it('offGlob on a pattern that was never registered does not throw', () => {
      const bus = createWorkspaceEventBus()
      const handler = vi.fn()

      expect(() => bus.offGlob('operation:*', handler)).not.toThrow()
    })

    it('offGlob removing a listener that is not registered for that pattern does not throw', () => {
      const bus = createWorkspaceEventBus()
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      bus.onGlob('*', handler1)

      // handler2 was never added — should be a no-op
      expect(() => bus.offGlob('*', handler2)).not.toThrow()

      bus.emit('update:dark-mode', true)
      expect(handler1).toHaveBeenCalledTimes(1)
    })

    it('same listener registered under two patterns is tracked independently', () => {
      const bus = createWorkspaceEventBus()
      const handler = vi.fn()

      bus.onGlob('*', handler)
      bus.onGlob('operation:*', handler)

      // Removing from one pattern leaves the other intact
      bus.offGlob('operation:*', handler)

      bus.emit('operation:cancel:request')

      // Should still fire once via '*', but not twice
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith('operation:cancel:request', undefined)
    })

    it('a deeply nested prefix pattern only matches events under that prefix', () => {
      const bus = createWorkspaceEventBus()
      const handler = vi.fn()

      bus.onGlob('operation:update:*', handler)

      bus.emit('operation:cancel:request') // should NOT match
      bus.emit('operation:send:request:hotkey') // should NOT match
      bus.emit('operation:update:meta', {
        payload: { summary: 'new' },
        meta: { method: 'get', path: '/pets' },
      })
      bus.emit('operation:update:pathMethod', {
        payload: { method: 'post', path: '/pets' },
        meta: { method: 'get', path: '/pets' },
        blurTargetSelector: null,
        callback: vi.fn(),
      })

      expect(handler).toHaveBeenCalledTimes(2)
      expect(handler.mock.calls[0]?.[0]).toBe('operation:update:meta')
      expect(handler.mock.calls[1]?.[0]).toBe('operation:update:pathMethod')
    })

    it('handles removing a glob listener during emission without breaking other listeners', () => {
      const bus = createWorkspaceEventBus()
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const handler3 = vi.fn()

      let unsubscribe2: (() => void) | null = null

      bus.onGlob('*', () => {
        unsubscribe2?.()
        handler1()
      })

      unsubscribe2 = bus.onGlob('*', handler2)
      bus.onGlob('*', handler3)

      // All three fire on the first emit (snapshot taken before mutation)
      bus.emit('update:dark-mode', true)
      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)
      expect(handler3).toHaveBeenCalledTimes(1)

      // handler2 was removed mid-first-emit, so it should not fire again
      bus.emit('update:dark-mode', false)
      expect(handler1).toHaveBeenCalledTimes(2)
      expect(handler2).toHaveBeenCalledTimes(1)
      expect(handler3).toHaveBeenCalledTimes(2)
    })
  })
})
