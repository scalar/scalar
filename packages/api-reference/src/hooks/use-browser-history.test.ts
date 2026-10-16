import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

import { useBrowserHistory } from './use-browser-history'

const mountHistory = (onPopState: () => void) =>
  mount(
    defineComponent({
      setup() {
        useBrowserHistory(onPopState)
        return () => null
      },
    }),
  )

describe('use-browser-history', () => {
  it('removes each listener and restores scrolling after the last reference unmounts', () => {
    window.history.scrollRestoration = 'auto'
    const firstCallback = vi.fn()
    const secondCallback = vi.fn()
    const first = mountHistory(firstCallback)
    const second = mountHistory(secondCallback)
    expect(window.history.scrollRestoration).toBe('manual')
    window.dispatchEvent(new PopStateEvent('popstate'))
    expect(firstCallback).toHaveBeenCalledTimes(1)
    expect(secondCallback).toHaveBeenCalledTimes(1)

    first.unmount()
    window.dispatchEvent(new PopStateEvent('popstate'))
    expect(firstCallback).toHaveBeenCalledTimes(1)
    expect(secondCallback).toHaveBeenCalledTimes(2)
    expect(window.history.scrollRestoration).toBe('manual')

    second.unmount()
    window.dispatchEvent(new PopStateEvent('popstate'))
    expect(secondCallback).toHaveBeenCalledTimes(2)
    expect(window.history.scrollRestoration).toBe('auto')
  })

  it('preserves the host scroll restoration setting and subsequent host changes', () => {
    window.history.scrollRestoration = 'manual'
    const first = mountHistory(() => {})
    first.unmount()
    expect(window.history.scrollRestoration).toBe('manual')

    const second = mountHistory(() => {})
    window.history.scrollRestoration = 'auto'
    second.unmount()
    expect(window.history.scrollRestoration).toBe('auto')
  })
})
