/**
 * @vitest-environment jsdom
 */
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { type Mock, afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { toast } from 'vue-sonner'

import { type ToastFunction, useToasts } from '../hooks/useToasts'
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

enableAutoUnmount(afterEach)

/** Capture the callback the component registers, so a test can fire toasts at it */
const captureToastCallback = (): { callback: () => ToastFunction } => {
  const mockInitializeToasts = vi.fn((_toast: ToastFunction) => () => undefined)
  vi.mocked(useToasts).mockImplementation(() => ({
    initializeToasts: mockInitializeToasts,
    toast: vi.fn(),
  }))
  return {
    callback: (): ToastFunction => {
      const registered = mockInitializeToasts.mock.calls[0]?.[0]
      if (!registered) {
        throw new Error('Expected the toaster to register a callback')
      }
      return registered
    },
  }
}

/** jsdom has no Popover API, so stand in for the methods the component calls */
const stubPopover = (): { showPopover: Mock<() => void>; hidePopover: Mock<() => void> } => {
  const showPopover = vi.fn()
  const hidePopover = vi.fn()
  Object.assign(HTMLElement.prototype, { showPopover, hidePopover })
  return { showPopover, hidePopover }
}

/** Stand in for the `:modal` and `:popover-open` pseudo-classes, which jsdom does not support */
const stubPseudoClasses = (popover: { showPopover: Mock<() => void>; hidePopover: Mock<() => void> }): void => {
  const matches = Element.prototype.matches
  vi.spyOn(Element.prototype, 'matches').mockImplementation(function (this: Element, selector: string) {
    if (selector === ':modal') {
      return this instanceof HTMLDialogElement && this.hasAttribute('open')
    }
    if (selector === ':popover-open') {
      return popover.showPopover.mock.calls.length > popover.hidePopover.mock.calls.length
    }
    return matches.call(this, selector)
  })
}

describe('ScalarToasts', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    Reflect.deleteProperty(HTMLElement.prototype, 'showPopover')
    Reflect.deleteProperty(HTMLElement.prototype, 'hidePopover')
    document.body.innerHTML = ''
  })

  it('should not render Toaster before mount', () => {
    const wrapper = mount(ScalarToasts)
    expect(wrapper.find('.scalar-toaster').exists()).toBe(false)
  })

  it('should render Toaster after mount', async () => {
    const wrapper = mount(ScalarToasts)
    await nextTick()
    expect(wrapper.find('.scalar-toaster').exists()).toBe(true)
  })

  it('should initialize toasts with correct parameters', async () => {
    const toasts = captureToastCallback()
    mount(ScalarToasts)

    // Test default parameters
    toasts.callback()('Test message')
    await flushPromises()
    expect(vi.mocked(toast)).toHaveBeenCalledWith('Test message', {
      duration: 3000,
      description: undefined,
    })

    // Test with custom parameters
    toasts.callback()('Error message', 'error', {
      timeout: 5000,
      description: 'Details',
    })
    await flushPromises()
    expect(vi.mocked(toast)).toHaveBeenCalledWith('Error message', {
      duration: 5000,
      description: 'Details',
    })
  })

  describe('top layer', () => {
    it('shows the toaster as a popover once mounted', async () => {
      const popover = stubPopover()
      stubPseudoClasses(popover)
      const wrapper = mount(ScalarToasts)
      await flushPromises()

      expect(wrapper.get('.scalar-toaster-layer').attributes('popover')).toBe('manual')
      expect(popover.showPopover).toHaveBeenCalledOnce()
    })

    it('raises the toaster above anything opened since, each time a toast fires', async () => {
      const popover = stubPopover()
      stubPseudoClasses(popover)
      const toasts = captureToastCallback()
      mount(ScalarToasts)
      await flushPromises()

      toasts.callback()('Saved')
      await flushPromises()

      expect(popover.hidePopover).toHaveBeenCalledOnce()
      expect(popover.showPopover).toHaveBeenCalledTimes(2)
    })

    it('moves into an open modal dialog so the toast is not inert, and back once it closes', async () => {
      stubPseudoClasses(stubPopover())
      const toasts = captureToastCallback()
      const dialog = document.createElement('dialog')
      dialog.setAttribute('open', '')
      document.body.append(dialog)
      mount(ScalarToasts, { attachTo: document.body })
      await flushPromises()

      toasts.callback()('Export failed', 'error')
      await flushPromises()
      expect(dialog.querySelector('.scalar-toaster-layer')).not.toBeNull()

      dialog.removeAttribute('open')
      dialog.dispatchEvent(new Event('close'))
      await flushPromises()
      expect(dialog.querySelector('.scalar-toaster-layer')).toBeNull()
      expect(document.querySelector('.scalar-toaster-layer')).not.toBeNull()
    })

    it('stays home when the modal is unmounted right after the toast fires', async () => {
      stubPseudoClasses(stubPopover())
      const toasts = captureToastCallback()
      const isModalOpen = ref(true)
      const Page = defineComponent({
        setup: () => () => [h(ScalarToasts), isModalOpen.value ? h('dialog', { open: '' }) : null],
      })
      mount(Page, { attachTo: document.body })
      await flushPromises()

      toasts.callback()('Successfully updated password')
      isModalOpen.value = false
      await flushPromises()

      expect(document.querySelector('dialog')).toBeNull()
      expect(document.querySelector('.scalar-toaster-layer')?.isConnected).toBe(true)
      expect(vi.mocked(toast)).toHaveBeenCalledWith('Successfully updated password', {
        duration: 3000,
        description: undefined,
      })
    })
  })
})
