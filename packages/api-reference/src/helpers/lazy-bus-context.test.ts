import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'

import { provideLazyBus, useLazyBusContext } from './lazy-bus'

const mountContext = (isolated = true) => {
  let bus = useLazyBusContext()
  let ownerBus = bus
  const Consumer = defineComponent({
    setup() {
      bus = useLazyBusContext()
      const { isReady } = bus.useLazyBus('shared-operation')
      return () => h('div', isReady.value ? 'Operation content' : 'Loading')
    },
  })
  const Provider = defineComponent({
    setup() {
      if (isolated) ownerBus = provideLazyBus()
      return () => h(Consumer)
    },
  })
  return {
    wrapper: mount(Provider),
    get ownerBus() {
      return ownerBus
    },
    get bus() {
      return bus
    },
  }
}

describe('lazy-bus-context', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('keeps readiness, cached heights, and scroll targets local to each reference', async () => {
    const first = mountContext()
    const second = mountContext()
    const ordinary = mountContext(false)
    expect(first.ownerBus).toBe(first.bus)
    expect(second.ownerBus).toBe(second.bus)
    expect(first.ownerBus).not.toBe(second.ownerBus)
    first.ownerBus.requestLazyRender('shared-operation', true)
    first.bus.setLazyPlaceholderHeight('shared-operation', 123)
    first.bus.scrollTargetId.value = 'shared-operation.body.name'
    await nextTick()

    expect(first.wrapper.text()).toBe('Operation content')
    expect(second.wrapper.text()).toBe('Loading')
    expect(ordinary.wrapper.text()).toBe('Loading')
    expect(first.bus.getLazyPlaceholderHeight('shared-operation')).toBe(123)
    expect(second.bus.getLazyPlaceholderHeight('shared-operation')).toBeUndefined()
    expect(first.bus.isOnScrollTargetPath('shared-operation.body')).toBe(true)
    expect(second.bus.isOnScrollTargetPath('shared-operation.body')).toBe(false)

    second.bus.requestLazyRender('shared-operation', true)
    ordinary.bus.requestLazyRender('shared-operation', true)
    await nextTick()
    second.wrapper.unmount()
    await nextTick()
    expect(first.wrapper.text()).toBe('Operation content')
    expect(first.bus.getLazyPlaceholderHeight('shared-operation')).toBe(123)
    expect(ordinary.wrapper.text()).toBe('Operation content')
    first.wrapper.unmount()
    ordinary.wrapper.unmount()
  })

  it('cancels idle rendering, retries, and initialization timers on unmount', async () => {
    vi.useFakeTimers()
    const cancelIdle = vi.fn()
    vi.stubGlobal(
      'requestIdleCallback',
      vi.fn(() => 42),
    )
    vi.stubGlobal('cancelIdleCallback', cancelIdle)
    const pendingFrames = new Map<number, FrameRequestCallback>()
    let frameId = 0
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      pendingFrames.set(++frameId, callback)
      return frameId
    })
    vi.stubGlobal('cancelAnimationFrame', (id: number) => pendingFrames.delete(id))
    const { bus, wrapper } = mountContext()
    bus.scheduleInitialLoadComplete()
    bus.requestLazyRender('shared-operation', true)
    bus.scrollToLazy(
      'missing-target',
      () => {},
      () => undefined,
    )
    await nextTick()
    expect(pendingFrames.size).toBe(2)
    expect(vi.getTimerCount()).toBe(1)

    wrapper.unmount()
    expect(cancelIdle).toHaveBeenCalledExactlyOnceWith(42)
    expect(pendingFrames.size).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
    await vi.runAllTimersAsync()
    expect(bus.firstLazyLoadComplete.value).toBe(false)
  })
})
