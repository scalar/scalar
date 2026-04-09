import { mockRequestIdleCallbackController } from '@test/utils/idle-request-controller'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { scrollToLazy } from '@/helpers/lazy-bus'

import Lazy from './Lazy.vue'

/** Manually trigger the requestIdleCallback events */
const ricController = mockRequestIdleCallbackController()

const LAZY_DEBOUNCE_TIME = 300

/** Callback and element from the IntersectionObserver mock so tests can trigger intersection. */
let intersectionObserverCallback: ((entries: IntersectionObserverEntry[]) => void) | null = null
let observedElement: Element | null = null

function createIntersectionObserverMock() {
  return class MockIntersectionObserver implements IntersectionObserver {
    callback: IntersectionObserverCallback
    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback
      intersectionObserverCallback = callback as (entries: IntersectionObserverEntry[]) => void
    }
    observe(target: Element) {
      observedElement = target
    }
    disconnect = vi.fn()
    unobserve = vi.fn()
    takeRecords = vi.fn(() => [])
    root = null
    rootMargin = ''
    thresholds = [] as number[]
  }
}

/** Call to simulate the observed element entering the viewport so requestLazyRender runs. */
function triggerIntersection() {
  if (intersectionObserverCallback && observedElement) {
    intersectionObserverCallback([
      {
        isIntersecting: true,
        target: observedElement,
        boundingClientRect: {} as DOMRectReadOnly,
        intersectionRatio: 1,
        intersectionRect: {} as DOMRectReadOnly,
        rootBounds: null,
        time: 0,
      } as IntersectionObserverEntry,
    ])
  }
}

describe('lazy rendering', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('requestIdleCallback', ricController.mock)
    intersectionObserverCallback = null
    observedElement = null
    vi.stubGlobal('IntersectionObserver', createIntersectionObserverMock())
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

    // Not rendered yet (observer does not fire by default)
    expect(wrapper.html()).not.toContain('Test Content')
    expect(wrapper.find('[data-testid="lazy-container"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="lazy-container"]').attributes('data-placeholder')).toBe('true')

    // Simulate element entering viewport so it is added to the queue
    triggerIntersection()
    vi.advanceTimersByTime(LAZY_DEBOUNCE_TIME + 50)
    ricController.runNext()

    await nextTick()

    expect(wrapper.html()).toContain('Test Content')
    expect(wrapper.find('[data-testid="lazy-container"]').attributes('data-placeholder')).toBe('false')
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
    vi.stubGlobal('requestIdleCallback', undefined)

    expect(window.requestIdleCallback).toBeUndefined()

    const wrapper = mount(Lazy, {
      props: { id: 'test-id-2' },
      slots: {
        default: '<div>Test Content</div>',
      },
    })

    await nextTick()

    // Not rendered yet (observer does not fire by default)
    expect(wrapper.html()).not.toContain('Test Content')

    // Trigger intersection so item is added to queue; without requestIdleCallback, runLazyBus uses nextTick(processQueue)
    triggerIntersection()
    vi.advanceTimersByTime(LAZY_DEBOUNCE_TIME + 50)
    await nextTick()
    await nextTick()

    expect(wrapper.html()).toContain('Test Content')
  })

  it('renders slot when expanded so child placeholders mount for navigation', async () => {
    const wrapper = mount(Lazy, {
      props: { id: 'parent-id', expanded: true },
      slots: {
        default: '<div data-child>Child content</div>',
      },
    })

    await nextTick()

    // When expanded we render the slot even before isReady so child Lazy components mount.
    expect(wrapper.html()).toContain('Child content')
    expect(wrapper.find('[data-child]').exists()).toBe(true)
  })

  it('handles empty slot content', async () => {
    const wrapper = mount(Lazy, {
      props: { id: 'test-id-4' },
      slots: {
        default: '',
      },
    })

    await nextTick()

    expect(wrapper.find('[data-testid="lazy-container"]').exists()).toBe(true)

    triggerIntersection()
    vi.advanceTimersByTime(LAZY_DEBOUNCE_TIME + 50)
    ricController.runNext()

    await nextTick()

    expect(wrapper.find('[data-testid="lazy-container"]').attributes('data-placeholder')).toBe('false')
  })
})
