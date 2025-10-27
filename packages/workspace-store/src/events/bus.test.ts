import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createWorkspaceEventBus } from './bus'

describe('createWorkspaceEventBus', () => {
  beforeEach(() => {
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
})
