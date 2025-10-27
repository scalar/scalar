import { mockRequestIdleCallbackController } from '@test/utils/idle-request-controller'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { scrollToLazy } from '@/components/Lazy/lazyBus'

import Lazy from './Lazy.vue'

/** Manually trigger the requestIdleCallback events */
const ricController = mockRequestIdleCallbackController()

const LAZY_DEBOUNCE_TIME = 300

describe('lazy rendering', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('requestIdleCallback', ricController.mock)
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('renders content lazily when the id is not in the priority queue', async () => {
    const wrapper = mount(Lazy, {
      props: { id: 'test-id-0' },
      slots: {
        default: '<div>Test Content</div>',
      },
    })

    await nextTick()
    await nextTick()
    // The initial run of the lazy bus is debounced for 300ms to we need to wait for it to run
    vi.advanceTimersByTime(LAZY_DEBOUNCE_TIME + 50)

    // Not rendered yet
    expect(wrapper.html()).not.toContain('Test Content')
    expect(wrapper.find('div').exists()).toBe(false)

    ricController.runNext()

    await nextTick()

    expect(wrapper.html()).toContain('Test Content')
    expect(wrapper.find('div').exists()).toBe(true)
  })

  it('renders content immediately when the id is in the priority queue', async () => {
    const wrapper = mount(Lazy, {
      props: { id: 'test-id-1' },
      slots: {
        default: '<div>Test Content</div>',
      },
    })
    // Triggers additional elements to be added to the priority queue
    scrollToLazy(
      'test-id-1',
      () => true,
      () => ({ id: 'test-id-1' }),
    )

    await nextTick()
    await nextTick()

    expect(wrapper.html()).toContain('Test Content')
    expect(wrapper.find('div').exists()).toBe(true)
  })

  it('handles browsers without requestIdleCallback support', async () => {
    // Remove requestIdleCallback from window
    vi.stubGlobal('requestIdleCallback', undefined)

    expect(window.requestIdleCallback).toBeUndefined()

    const wrapper = mount(Lazy, {
      props: { id: 'test-id-2' },
      slots: {
        default: '<div>Test Content</div>',
      },
    })

    await nextTick()

    // Not rendered yet
    expect(wrapper.html()).not.toContain('Test Content')

    // When requestIdleCallback is not available, it uses lazyTimeout ?? DEFAULT_LAZY_TIMEOUT
    vi.advanceTimersByTime(LAZY_DEBOUNCE_TIME + 50)

    await nextTick()
    await nextTick()

    expect(wrapper.html()).toContain('Test Content')
  })

  it('handles empty slot content', async () => {
    const wrapper = mount(Lazy, {
      props: { id: 'test-id-4' },
      slots: {
        default: '',
      },
    })

    await nextTick()

    // Should not crash with empty content - shows v-if comment when not rendered
    expect(wrapper.html()).toBe('<!--v-if-->')

    vi.advanceTimersByTime(LAZY_DEBOUNCE_TIME + 50)
    ricController.runNext()

    await nextTick()

    // Should render empty content after lazy loading
    expect(wrapper.html()).toBe('')
  })
})
