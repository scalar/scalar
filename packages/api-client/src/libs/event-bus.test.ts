import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { createEventBus } from './event-bus'

describe('createEventBus', () => {
  it('on event and off listener', () => {
    const { on, off, listeners } = createEventBus<number>()
    const { inc } = useCounter(0)
    on(inc)
    off(inc)
    expect(listeners()).toEqual([])
  })
  it('should listen on emit', () => {
    let val = false
    const { emit, on, reset, listeners } = createEventBus<boolean>()
    on((_event) => {
      if (!_event) {
        return
      }
      val = _event
    })
    emit(true)
    expect(val).toBe(true)
    reset()
    expect(listeners()).toEqual([])
  })
  it('should call a once listener only once', () => {
    const { once, emit, reset, listeners } = createEventBus<number>()
    const { inc, count } = useCounter(0)
    once(inc)
    emit()
    emit()
    emit()
    expect(count.value).toBe(1)
    reset()
    expect(listeners()).toEqual([])
  })

  it('should not off a non-existent listener', () => {
    const bus1 = createEventBus<number>()
    const bus2 = createEventBus<number>()
    const listener = vi.fn()

    bus1.on(listener)
    bus2.off(listener)

    expect(bus1.listeners()).toBeDefined()
    expect(bus2.listeners()).toStrictEqual([])
  })
  it('should not off other events listeners', () => {
    const bus1 = createEventBus<number>()
    const bus2 = createEventBus<number>()
    const listener1 = vi.fn()
    const listener2 = vi.fn()

    bus1.on(listener1)
    bus2.on(listener2)
    bus1.off(listener2)
    bus2.off(listener1)

    expect(bus1.listeners()).toBeDefined()
    expect(bus2.listeners()).toBeDefined()
  })
  it('should remove all listeners on reset', () => {
    const { emit, on, reset, listeners } = createEventBus<number>()
    const { count, inc } = useCounter(0)
    on(inc)

    emit()
    reset()

    on(inc)

    emit()
    reset()

    expect(count.value).toBe(2)
    expect(listeners()).toEqual([])
  })

  it('should work with a complex payload', async () => {
    const { on, emit } = createEventBus<['inc' | 'dec', number]>()
    const counter = useCounter(0)
    on((value) => {
      if (!value) {
        return
      }
      const [direction, amount] = value
      counter[direction](amount)
    })
    emit(['inc', 3])
    expect(counter.count.value).toBe(3)
    emit(['dec', 1])
    expect(counter.count.value).toBe(2)
  })
})

function useCounter(initialValue = 0) {
  const count = ref(initialValue)

  const inc = (delta = 1) => (count.value += delta)
  const dec = (delta = 1) => (count.value -= delta)
  const get = () => count.value
  const set = (val: number) => (count.value = val)
  const reset = (val = initialValue) => set(val)

  return { count, inc, dec, get, set, reset }
}
