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

  describe('onAny / offAny', () => {
    it('catches every event with name and payload', () => {
      const bus = createWorkspaceEventBus()
      const handler = vi.fn()

      bus.onAny(handler)
      bus.emit('update:dark-mode', true)
      bus.emit('update:active-document', 'doc-123')

      expect(handler).toHaveBeenCalledTimes(2)
      expect(handler).toHaveBeenNthCalledWith(1, { event: 'update:dark-mode', payload: true })
      expect(handler).toHaveBeenNthCalledWith(2, { event: 'update:active-document', payload: 'doc-123' })
    })

    it('forwards undefined payloads on the tagged-union argument', () => {
      const bus = createWorkspaceEventBus()
      const handler = vi.fn()

      bus.onAny(handler)
      bus.emit('operation:cancel:request')

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith({ event: 'operation:cancel:request', payload: undefined })
    })

    it('returns an unsubscribe function that stops the listener', () => {
      const bus = createWorkspaceEventBus()
      const handler = vi.fn()

      const unsubscribe = bus.onAny(handler)
      bus.emit('update:dark-mode', true)
      expect(handler).toHaveBeenCalledTimes(1)

      unsubscribe()
      bus.emit('update:dark-mode', false)
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('offAny removes a specific listener without affecting others', () => {
      const bus = createWorkspaceEventBus()
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      bus.onAny(handler1)
      bus.onAny(handler2)

      bus.offAny(handler1)
      bus.emit('update:dark-mode', true)

      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).toHaveBeenCalledWith({ event: 'update:dark-mode', payload: true })
    })

    it('does not break exact-match listeners when a wildcard listener is also registered', () => {
      const bus = createWorkspaceEventBus()
      const exactHandler = vi.fn()
      const anyHandler = vi.fn()

      bus.on('update:dark-mode', exactHandler)
      bus.onAny(anyHandler)

      bus.emit('update:dark-mode', false)

      expect(exactHandler).toHaveBeenCalledWith(false)
      expect(anyHandler).toHaveBeenCalledWith({ event: 'update:dark-mode', payload: false })
    })

    it('invokes exact-match listeners before wildcard listeners', () => {
      const bus = createWorkspaceEventBus()
      const order: string[] = []

      bus.on('update:dark-mode', () => order.push('exact'))
      bus.onAny(() => order.push('wildcard'))

      bus.emit('update:dark-mode', true)

      expect(order).toEqual(['exact', 'wildcard'])
    })

    it('wildcard listener receives debounced events once settled', () => {
      vi.useFakeTimers()
      const bus = createWorkspaceEventBus()
      const handler = vi.fn()

      bus.onAny(handler)
      bus.emit('update:dark-mode', true, { debounceKey: 'test' })
      bus.emit('update:dark-mode', false, { debounceKey: 'test' })

      expect(handler).toHaveBeenCalledTimes(0)

      vi.advanceTimersByTime(400)

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith({ event: 'update:dark-mode', payload: false })

      vi.useRealTimers()
    })

    it('all wildcard listeners fire on every emit', () => {
      const bus = createWorkspaceEventBus()
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const handler3 = vi.fn()

      bus.onAny(handler1)
      bus.onAny(handler2)
      bus.onAny(handler3)

      bus.emit('operation:cancel:request')

      const expected = { event: 'operation:cancel:request', payload: undefined }
      expect(handler1).toHaveBeenCalledWith(expected)
      expect(handler2).toHaveBeenCalledWith(expected)
      expect(handler3).toHaveBeenCalledWith(expected)
    })

    it('a throwing wildcard listener does not prevent other wildcard listeners from firing', () => {
      const bus = createWorkspaceEventBus()
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const throwingHandler = vi.fn(() => {
        throw new Error('any boom')
      })
      const safeHandler = vi.fn()

      bus.onAny(throwingHandler)
      bus.onAny(safeHandler)

      expect(() => bus.emit('update:dark-mode', true)).not.toThrow()

      expect(throwingHandler).toHaveBeenCalledTimes(1)
      expect(safeHandler).toHaveBeenCalledWith({ event: 'update:dark-mode', payload: true })

      errorSpy.mockRestore()
    })

    it('a throwing wildcard listener does not prevent exact-match listeners from firing', () => {
      const bus = createWorkspaceEventBus()
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const throwingAnyHandler = vi.fn(() => {
        throw new Error('any boom')
      })
      const exactHandler = vi.fn()

      bus.on('update:dark-mode', exactHandler)
      bus.onAny(throwingAnyHandler)

      expect(() => bus.emit('update:dark-mode', true)).not.toThrow()

      expect(exactHandler).toHaveBeenCalledWith(true)

      errorSpy.mockRestore()
    })

    it('offAny on a listener that was never registered does not throw', () => {
      const bus = createWorkspaceEventBus()
      const handler = vi.fn()

      expect(() => bus.offAny(handler)).not.toThrow()
    })

    it('handles removing a wildcard listener during emission without breaking other listeners', () => {
      const bus = createWorkspaceEventBus()
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const handler3 = vi.fn()

      let unsubscribe2: (() => void) | null = null

      bus.onAny(() => {
        unsubscribe2?.()
        handler1()
      })

      unsubscribe2 = bus.onAny(handler2)
      bus.onAny(handler3)

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
