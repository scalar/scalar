import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'

import { useNetworkStatus } from './use-network-status'

describe('useNetworkStatus', () => {
  let onLineGetter: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    onLineGetter = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
  })

  afterEach(() => {
    onLineGetter.mockRestore()
  })

  /**
   * `useNetworkStatus` registers `online` / `offline` listeners on
   * `window`, and Vue lifecycle hooks like `onScopeDispose` only fire
   * inside an active effect scope. Wrapping the call lets us drive the
   * scope manually and assert teardown behaviour.
   */
  const runInScope = <T>(callback: () => T): { value: T; dispose: () => void } => {
    const scope = effectScope()
    const value = scope.run(callback) as T
    return { value, dispose: () => scope.stop() }
  }

  it('initialises from navigator.onLine', () => {
    onLineGetter.mockReturnValue(false)

    const { value, dispose } = runInScope(() => useNetworkStatus())
    expect(value.isOnline.value).toBe(false)
    expect(value.isOffline.value).toBe(true)
    dispose()
  })

  it('flips to offline when the window fires an offline event', () => {
    const { value, dispose } = runInScope(() => useNetworkStatus())
    expect(value.isOnline.value).toBe(true)

    window.dispatchEvent(new Event('offline'))
    expect(value.isOnline.value).toBe(false)
    expect(value.isOffline.value).toBe(true)
    dispose()
  })

  it('flips back to online when the window fires an online event', () => {
    onLineGetter.mockReturnValue(false)

    const { value, dispose } = runInScope(() => useNetworkStatus())
    expect(value.isOnline.value).toBe(false)

    window.dispatchEvent(new Event('online'))
    expect(value.isOnline.value).toBe(true)
    expect(value.isOffline.value).toBe(false)
    dispose()
  })

  it('removes its listeners when the scope is disposed', () => {
    const { value, dispose } = runInScope(() => useNetworkStatus())
    expect(value.isOnline.value).toBe(true)

    dispose()

    window.dispatchEvent(new Event('offline'))
    expect(value.isOnline.value).toBe(true)
  })
})
