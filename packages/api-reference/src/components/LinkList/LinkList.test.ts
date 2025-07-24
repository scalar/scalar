import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import LinkList from './LinkList.vue'

// Mock MutationObserver
const mockMutationObserver = vi.fn()
const mockDisconnect = vi.fn()
const mockObserve = vi.fn()
let capturedCallback: (() => void) | null = null

beforeEach(() => {
  vi.clearAllMocks()
  capturedCallback = null

  global.MutationObserver = mockMutationObserver
  mockMutationObserver.mockImplementation((callback: () => void) => {
    capturedCallback = callback
    return {
      observe: mockObserve,
      disconnect: mockDisconnect,
    }
  })

  global.window = {
    ...global.window,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as any
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('LinkList', () => {
  it('renders with default slot content', () => {
    const wrapper = mount(LinkList, {
      slots: {
        default: '<span>Test Link</span>',
      },
    })

    expect(wrapper.text()).toContain('Test Link')
    expect(wrapper.classes()).toContain('custom-scroll')
  })

  it('applies icons-only class when scroll is needed', async () => {
    const wrapper = mount(LinkList, {
      slots: {
        default: '<span>Very long content that will cause scrolling</span>',
      },
    })

    // Mock scrollWidth to be greater than clientWidth (scroll needed)
    Object.defineProperty(wrapper.element, 'scrollWidth', {
      value: 300,
      writable: true,
    })
    Object.defineProperty(wrapper.element, 'clientWidth', {
      value: 200,
      writable: true,
    })

    // Trigger the checkScrollability function manually
    capturedCallback?.()
    await nextTick()

    expect(wrapper.classes()).toContain('icons-only')
  })

  it('does not apply icons-only class when scroll is not needed', async () => {
    const wrapper = mount(LinkList, {
      slots: {
        default: '<span>Short content</span>',
      },
    })

    // Mock scrollWidth to be less than clientWidth (no scroll needed)
    Object.defineProperty(wrapper.element, 'scrollWidth', {
      value: 100,
      writable: true,
    })
    Object.defineProperty(wrapper.element, 'clientWidth', {
      value: 200,
      writable: true,
    })

    await nextTick()

    expect(wrapper.classes()).not.toContain('icons-only')
  })

  it('sets up MutationObserver and window event listeners on mount', () => {
    mount(LinkList, {
      slots: {
        default: '<span>Test</span>',
      },
    })

    expect(mockMutationObserver).toHaveBeenCalled()
    expect(mockObserve).toHaveBeenCalledWith(expect.any(HTMLElement), {
      childList: true,
      subtree: true,
    })
    expect(global.window.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
  })

  it('cleans up MutationObserver and window event listeners on unmount', () => {
    const wrapper = mount(LinkList, {
      slots: {
        default: '<span>Test</span>',
      },
    })

    wrapper.unmount()

    expect(mockDisconnect).toHaveBeenCalled()
    expect(global.window.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
  })
})
