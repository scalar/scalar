/**
 * @vitest-environment jsdom
 */
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { toast } from 'vue-sonner'

import { useToasts } from '../hooks/useToasts'
import ScalarToasts from './ScalarToasts.vue'

vi.mock(import('../hooks/useToasts'), () => ({
  initializeToasts: vi.fn(),
  useToasts: vi.fn(() => ({
    initializeToasts: vi.fn(),
    toast: vi.fn(),
  })),
}))

vi.mock(import('vue-sonner'), async (importOriginal) => ({
  ...(await importOriginal()),
  toast: vi.fn() as unknown as typeof toast,
}))

describe('ScalarToasts', () => {
  it('should not render Toaster before mount', () => {
    const wrapper = mount(ScalarToasts)
    expect(wrapper.find('.scalar-toaster').exists()).toBe(false)
  })

  it('should render Toaster after mount', async () => {
    const wrapper = mount(ScalarToasts)
    await nextTick()
    expect(wrapper.find('.scalar-toaster').exists()).toBe(true)
  })

  it('should initialize toasts with correct parameters', () => {
    const mockInitializeToasts = vi.fn()
    vi.mocked(useToasts).mockImplementation(() => ({
      initializeToasts: mockInitializeToasts,
      toast: vi.fn(),
    }))

    mount(ScalarToasts)

    expect(mockInitializeToasts).toHaveBeenCalledTimes(1)

    // Get the callback function passed to initializeToasts
    const toastCallback = mockInitializeToasts?.mock.calls?.[0]?.[0]

    // Test default parameters
    toastCallback('Test message')
    expect(vi.mocked(toast)).toHaveBeenCalledWith('Test message', {
      duration: 3000,
      description: undefined,
    })

    // Test with custom parameters
    toastCallback('Error message', 'error', {
      timeout: 5000,
      description: 'Details',
    })
    expect(vi.mocked(toast)).toHaveBeenCalledWith('Error message', {
      duration: 5000,
      description: 'Details',
    })
  })

  describe('top layer', () => {
    /** jsdom has no Popover API, so stand in for the methods the component calls */
    const stubPopover = () => {
      let open = false
      const showPopover = vi.fn(() => {
        open = true
      })
      const hidePopover = vi.fn(() => {
        open = false
      })
      Object.assign(HTMLElement.prototype, { showPopover, hidePopover })
      const matches = HTMLElement.prototype.matches
      vi.spyOn(HTMLElement.prototype, 'matches').mockImplementation(function (this: HTMLElement, selector: string) {
        return selector === ':popover-open' ? open : matches.call(this, selector)
      })
      return { showPopover, hidePopover }
    }

    afterEach(() => {
      vi.restoreAllMocks()
      Reflect.deleteProperty(HTMLElement.prototype, 'showPopover')
      Reflect.deleteProperty(HTMLElement.prototype, 'hidePopover')
    })

    it('shows the toaster as a popover once mounted', async () => {
      const { showPopover } = stubPopover()
      const wrapper = mount(ScalarToasts)
      await nextTick()
      await nextTick()

      expect(wrapper.get('.scalar-toaster-layer').attributes('popover')).toBe('manual')
      expect(showPopover).toHaveBeenCalledOnce()
    })

    it('raises the toaster above anything opened since, each time a toast fires', async () => {
      const { showPopover, hidePopover } = stubPopover()
      const mockInitializeToasts = vi.fn()
      vi.mocked(useToasts).mockImplementation(() => ({
        initializeToasts: mockInitializeToasts,
        toast: vi.fn(),
      }))
      mount(ScalarToasts)
      await nextTick()
      await nextTick()

      mockInitializeToasts.mock.calls[0]?.[0]('Saved')

      expect(hidePopover).toHaveBeenCalledOnce()
      expect(showPopover).toHaveBeenCalledTimes(2)
    })
  })
})
