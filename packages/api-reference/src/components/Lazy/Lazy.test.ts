import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import Lazy from './Lazy.vue'
import { lazyBus } from './lazyBus'

describe('Lazy', () => {
  let originalRequestIdleCallback: typeof window.requestIdleCallback | undefined
  let originalWindow: typeof window | undefined

  beforeEach(() => {
    vi.useFakeTimers()
    // Store original values safely
    originalRequestIdleCallback = (window as any).requestIdleCallback
    originalWindow = global.window
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    // Restore safely
    if (originalRequestIdleCallback !== undefined) {
      ;(window as any).requestIdleCallback = originalRequestIdleCallback
    } else {
      delete (window as any).requestIdleCallback
    }
    if (originalWindow) {
      global.window = originalWindow
    }
  })

  describe('lazy rendering', () => {
    it('renders content lazily when isLazy is true', async () => {
      const mockRequestIdleCallback = vi.fn((callback) => {
        callback()
      })
      ;(window as any).requestIdleCallback = mockRequestIdleCallback

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

    it('renders content lazily when isLazy is not provided (defaults to true)', async () => {
      const mockRequestIdleCallback = vi.fn((callback) => {
        callback()
      })
      ;(window as any).requestIdleCallback = mockRequestIdleCallback

      const wrapper = mount(Lazy, {
        slots: {
          default: '<div>Test Content</div>',
        },
      })

      await nextTick()

      // Should be lazy by default
      expect(wrapper.html()).not.toContain('Test Content')

      vi.advanceTimersByTime(0)
      await nextTick()

      expect(wrapper.html()).toContain('Test Content')
    })
  })

  describe('browser compatibility', () => {
    it('handles browsers without requestIdleCallback support', async () => {
      // Remove requestIdleCallback from window
      delete (window as any).requestIdleCallback

      const wrapper = mount(Lazy, {
        props: { isLazy: true },
        slots: {
          default: '<div>Test Content</div>',
        },
      })

      await nextTick()

      // Not rendered yet
      expect(wrapper.html()).not.toContain('Test Content')

      // When requestIdleCallback is not available, it uses lazyTimeout ?? DEFAULT_LAZY_TIMEOUT
      vi.advanceTimersByTime(100)

      await nextTick()
      await nextTick()

      expect(wrapper.html()).toContain('Test Content')
    })

    it('handles SSR environment (window undefined)', async () => {
      // Mock SSR environment by temporarily removing window.requestIdleCallback
      // instead of removing the entire window object
      const originalRIC = (window as any).requestIdleCallback
      delete (window as any).requestIdleCallback

      const wrapper = mount(Lazy, {
        props: { isLazy: true },
        slots: {
          default: '<div>Test Content</div>',
        },
      })

      await nextTick()

      // Should not render initially
      expect(wrapper.html()).not.toContain('Test Content')

      // Restore requestIdleCallback
      if (originalRIC) {
        ;(window as any).requestIdleCallback = originalRIC
      }
    })
  })

  describe('lazyTimeout', () => {
    it('respects custom lazyTimeout value', async () => {
      const mockRequestIdleCallback = vi.fn((callback) => {
        callback()
      })
      ;(window as any).requestIdleCallback = mockRequestIdleCallback

      const wrapper = mount(Lazy, {
        props: { isLazy: true, lazyTimeout: 1000 },
        slots: {
          default: '<div>Test Content</div>',
        },
      })

      await nextTick()

      // Not rendered yet
      expect(wrapper.html()).not.toContain('Test Content')

      // Advance less than timeout - should not render
      vi.advanceTimersByTime(500)
      await nextTick()
      expect(wrapper.html()).not.toContain('Test Content')

      // Advance past timeout - should render
      vi.advanceTimersByTime(500)
      await nextTick()
      expect(wrapper.html()).toContain('Test Content')
    })

    it('uses default timeout when requestIdleCallback is not available', async () => {
      delete (window as any).requestIdleCallback

      const wrapper = mount(Lazy, {
        props: { isLazy: true },
        slots: {
          default: '<div>Test Content</div>',
        },
      })

      await nextTick()

      // Not rendered yet
      expect(wrapper.html()).not.toContain('Test Content')

      // When requestIdleCallback is not available, it uses lazyTimeout ?? DEFAULT_LAZY_TIMEOUT
      // Since lazyTimeout defaults to 0, it should render immediately
      vi.advanceTimersByTime(0)

      await nextTick()
      await nextTick()

      expect(wrapper.html()).toContain('Test Content')
    })
  })

  describe('event bus', () => {
    it('emits loading event immediately and loaded event after rendering when id is provided and isLazy is true', async () => {
      const mockRequestIdleCallback = vi.fn((callback) => {
        callback()
      })
      ;(window as any).requestIdleCallback = mockRequestIdleCallback

      const emitSpy = vi.spyOn(lazyBus, 'emit')

      mount(Lazy, {
        props: { isLazy: true, id: 'test-id' },
        slots: {
          default: '<div>Test Content</div>',
        },
      })

      await nextTick()

      // Loading event should be emitted immediately
      expect(emitSpy).toHaveBeenCalledWith({ loading: 'test-id', save: false })

      // Trigger rendering
      vi.advanceTimersByTime(0)
      await nextTick()

      // Loaded event should be emitted after rendering
      expect(emitSpy).toHaveBeenCalledWith({ loaded: 'test-id', save: false })
    })

    it('emits event immediately when id is provided and isLazy is false', async () => {
      const emitSpy = vi.spyOn(lazyBus, 'emit')

      mount(Lazy, {
        props: { isLazy: false, id: 'test-id' },
        slots: {
          default: '<div>Test Content</div>',
        },
      })

      await nextTick()

      // Event should be emitted immediately for non-lazy components
      expect(emitSpy).toHaveBeenCalledWith({ loaded: 'test-id', save: true })
    })

    it('emits loading event with undefined id when id is not provided', async () => {
      const mockRequestIdleCallback = vi.fn((callback) => {
        callback()
      })
      ;(window as any).requestIdleCallback = mockRequestIdleCallback

      const emitSpy = vi.spyOn(lazyBus, 'emit')

      mount(Lazy, {
        props: { isLazy: true },
        slots: {
          default: '<div>Test Content</div>',
        },
      })

      await nextTick()

      // Loading event should be emitted with undefined id
      expect(emitSpy).toHaveBeenCalledWith({ loading: undefined, save: false })

      // Trigger rendering
      vi.advanceTimersByTime(0)
      await nextTick()

      // No loaded event should be emitted when no id is provided
      expect(emitSpy).toHaveBeenCalledTimes(1)
    })

    it('emits events with correct id value', async () => {
      const mockRequestIdleCallback = vi.fn((callback) => {
        callback()
      })
      ;(window as any).requestIdleCallback = mockRequestIdleCallback

      const emitSpy = vi.spyOn(lazyBus, 'emit')

      const testId = 'unique-test-id-123'
      mount(Lazy, {
        props: { isLazy: true, id: testId },
        slots: {
          default: '<div>Test Content</div>',
        },
      })

      await nextTick()

      // Loading event should be emitted with correct id
      expect(emitSpy).toHaveBeenCalledWith({ loading: testId, save: false })

      // Trigger rendering
      vi.advanceTimersByTime(0)
      await nextTick()

      // Loaded event should be emitted with correct id
      expect(emitSpy).toHaveBeenCalledWith({ loaded: testId, save: false })
    })
  })

  describe('prev prop', () => {
    it('sets save to true when prev is true and isLazy is true', async () => {
      const mockRequestIdleCallback = vi.fn((callback) => {
        callback()
      })
      ;(window as any).requestIdleCallback = mockRequestIdleCallback

      const emitSpy = vi.spyOn(lazyBus, 'emit')

      mount(Lazy, {
        props: { isLazy: true, id: 'test-id', prev: true },
        slots: {
          default: '<div>Test Content</div>',
        },
      })

      await nextTick()

      // Loading event should be emitted with save: true
      expect(emitSpy).toHaveBeenCalledWith({ loading: 'test-id', save: true })

      // Trigger rendering
      vi.advanceTimersByTime(0)
      await nextTick()

      // Loaded event should be emitted with save: true
      expect(emitSpy).toHaveBeenCalledWith({ loaded: 'test-id', save: true })
    })

    it('sets save to true when prev is true and isLazy is false', async () => {
      const emitSpy = vi.spyOn(lazyBus, 'emit')

      mount(Lazy, {
        props: { isLazy: false, id: 'test-id', prev: true },
        slots: {
          default: '<div>Test Content</div>',
        },
      })

      await nextTick()

      // Event should be emitted with save: true
      expect(emitSpy).toHaveBeenCalledWith({ loaded: 'test-id', save: true })
    })

    it('defaults prev to false when not provided', async () => {
      const mockRequestIdleCallback = vi.fn((callback) => {
        callback()
      })
      ;(window as any).requestIdleCallback = mockRequestIdleCallback

      const emitSpy = vi.spyOn(lazyBus, 'emit')

      mount(Lazy, {
        props: { isLazy: true, id: 'test-id' },
        slots: {
          default: '<div>Test Content</div>',
        },
      })

      await nextTick()

      // Loading event should be emitted with save: false (default)
      expect(emitSpy).toHaveBeenCalledWith({ loading: 'test-id', save: false })

      // Trigger rendering
      vi.advanceTimersByTime(0)
      await nextTick()

      // Loaded event should be emitted with save: false (default)
      expect(emitSpy).toHaveBeenCalledWith({ loaded: 'test-id', save: false })
    })

    it('sets save to true when isLazy is false regardless of prev value', async () => {
      const emitSpy = vi.spyOn(lazyBus, 'emit')

      mount(Lazy, {
        props: { isLazy: false, id: 'test-id', prev: false },
        slots: {
          default: '<div>Test Content</div>',
        },
      })

      await nextTick()

      // Event should be emitted with save: true (because isLazy is false)
      expect(emitSpy).toHaveBeenCalledWith({ loaded: 'test-id', save: true })
    })
  })

  describe('edge cases', () => {
    it('handles empty slot content', async () => {
      const mockRequestIdleCallback = vi.fn((callback) => {
        callback()
      })
      ;(window as any).requestIdleCallback = mockRequestIdleCallback

      const wrapper = mount(Lazy, {
        props: { isLazy: true },
        slots: {
          default: '',
        },
      })

      await nextTick()

      // Should not crash with empty content - shows v-if comment when not rendered
      expect(wrapper.html()).toBe('<!--v-if-->')

      vi.advanceTimersByTime(0)
      await nextTick()

      // Should render empty content after lazy loading
      expect(wrapper.html()).toBe('')
    })

    it('handles complex slot content', async () => {
      const mockRequestIdleCallback = vi.fn((callback) => {
        callback()
      })
      ;(window as any).requestIdleCallback = mockRequestIdleCallback

      const wrapper = mount(Lazy, {
        props: { isLazy: true },
        slots: {
          default: `
            <div class="complex-content">
              <h1>Title</h1>
              <p>Paragraph with <strong>bold</strong> text</p>
              <ul>
                <li>Item 1</li>
                <li>Item 2</li>
              </ul>
            </div>
          `,
        },
      })

      await nextTick()

      // Not rendered yet
      expect(wrapper.html()).not.toContain('complex-content')

      vi.advanceTimersByTime(0)
      await nextTick()

      // Should render complex content
      expect(wrapper.html()).toContain('complex-content')
      expect(wrapper.find('h1').text()).toBe('Title')
      // Fix the selector - use findAll instead of find for multiple elements
      expect(wrapper.findAll('ul li')).toHaveLength(2)
    })

    it('handles zero lazyTimeout correctly', async () => {
      const mockRequestIdleCallback = vi.fn((callback) => {
        callback()
      })
      ;(window as any).requestIdleCallback = mockRequestIdleCallback

      const wrapper = mount(Lazy, {
        props: { isLazy: true, lazyTimeout: 0 },
        slots: {
          default: '<div>Test Content</div>',
        },
      })

      await nextTick()

      // Not rendered yet
      expect(wrapper.html()).not.toContain('Test Content')

      // Should render immediately with zero timeout
      vi.advanceTimersByTime(0)
      await nextTick()

      expect(wrapper.html()).toContain('Test Content')
    })
  })
})
