// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import Lazy from './Lazy.vue'

describe('Lazy', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders content lazily when isLazy is true', async () => {
    // Mock requestIdleCallback
    const mockRequestIdleCallback = vi.fn((callback) => {
      // Execute the callback immediately
      callback()
    })

    window.requestIdleCallback = mockRequestIdleCallback as any

    const wrapper = mount(Lazy, {
      props: { isLazy: true },
      slots: {
        default: '<div>Test Content</div>',
      },
    })

    await nextTick()

    // Not rendered yet
    expect(wrapper.html()).not.toContain('Test Content')
    expect(wrapper.find('div').exists()).toBe(false)

    // Trigger the rendering
    vi.advanceTimersByTime(0)

    await nextTick()

    expect(wrapper.html()).toContain('Test Content')
    expect(wrapper.find('div').exists()).toBe(true)
    expect(mockRequestIdleCallback).toHaveBeenCalled()
  })

  it('renders content immediately when isLazy is false', async () => {
    const wrapper = mount(Lazy, {
      props: { isLazy: false },
      slots: {
        default: '<div>Test Content</div>',
      },
    })

    await nextTick()

    expect(wrapper.html()).toContain('Test Content')
    expect(wrapper.find('div').exists()).toBe(true)
  })
})
