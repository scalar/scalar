import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { effectScope } from 'vue'

import { useScrollLock } from './useScrollLock'

const root = document.documentElement

/** Run the composable inside its own scope so the test can dispose it. */
const createLock = (): ReturnType<typeof useScrollLock> & { dispose: () => void } => {
  const scope = effectScope()
  const lock = scope.run(() => useScrollLock())!
  return { ...lock, dispose: () => scope.stop() }
}

describe('useScrollLock', () => {
  beforeEach(() => {
    root.removeAttribute('style')
  })

  afterEach(() => {
    root.removeAttribute('style')
  })

  it('hides overflow on the document element and restores it on unlock', () => {
    root.style.setProperty('overflow', 'auto')
    const { lock, unlock } = createLock()

    lock(document.body)
    expect(root.style.overflow).toBe('hidden')

    unlock()
    expect(root.style.overflow).toBe('auto')
  })

  it('removes the inline style on unlock when none was set before', () => {
    const { lock, unlock } = createLock()

    lock(document.body)
    unlock()
    expect(root.style.getPropertyValue('overflow')).toBe('')
  })

  it('keeps the page locked until the last holder releases it', () => {
    const first = createLock()
    const second = createLock()

    first.lock(document.body)
    second.lock(document.body)
    first.unlock()
    expect(root.style.overflow).toBe('hidden')

    second.unlock()
    expect(root.style.overflow).toBe('')
  })

  it('counts repeated locks from one holder only once', () => {
    const { lock, unlock } = createLock()

    lock(document.body)
    lock(document.body)
    unlock()
    expect(root.style.overflow).toBe('')
  })

  it('releases the lock when its scope is disposed', () => {
    const { lock, dispose } = createLock()

    lock(document.body)
    dispose()
    expect(root.style.overflow).toBe('')
  })

  it('pads the document by the scrollbar width so the page does not shift', () => {
    const innerWidth = window.innerWidth
    Object.defineProperty(root, 'clientWidth', { configurable: true, value: innerWidth - 15 })
    const { lock, unlock } = createLock()

    lock(document.body)
    expect(root.style.paddingRight).toBe('15px')

    unlock()
    expect(root.style.paddingRight).toBe('')
    Reflect.deleteProperty(root, 'clientWidth')
  })
})
