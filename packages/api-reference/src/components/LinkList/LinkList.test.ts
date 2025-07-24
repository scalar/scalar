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
  // Reset mocks
  vi.clearAllMocks()
  capturedCallback = null

  // Mock MutationObserver
  global.MutationObserver = mockMutationObserver
  mockMutationObserver.mockImplementation((callback: () => void) => {
    capturedCallback = callback
    return {
      observe: mockObserve,
      disconnect: mockDisconnect,
    }
  })

  // Mock window resize event
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

    // Trigger the checkScrollability function manually by calling the captured callback
    capturedCallback?.()

    await nextTick()

    expect(wrapper.classes()).toContain('icons-only')
  })

  it('sets up MutationObserver on mount', () => {
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
  })

  it('adds window resize event listener on mount', () => {
    mount(LinkList, {
      slots: {
        default: '<span>Test</span>',
      },
    })

    expect(global.window.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
  })

  it('removes window resize event listener on unmount', () => {
    const wrapper = mount(LinkList, {
      slots: {
        default: '<span>Test</span>',
      },
    })

    wrapper.unmount()

    expect(global.window.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
  })

  it('disconnects MutationObserver on unmount', () => {
    const wrapper = mount(LinkList, {
      slots: {
        default: '<span>Test</span>',
      },
    })

    wrapper.unmount()

    expect(mockDisconnect).toHaveBeenCalled()
  })

  it('handles MutationObserver callback correctly', async () => {
    const wrapper = mount(LinkList, {
      slots: {
        default: '<span>Test</span>',
      },
    })

    // Mock that scroll is needed
    Object.defineProperty(wrapper.element, 'scrollWidth', {
      value: 300,
      writable: true,
    })
    Object.defineProperty(wrapper.element, 'clientWidth', {
      value: 200,
      writable: true,
    })

    // Call the captured MutationObserver callback
    capturedCallback?.()
    await nextTick()

    expect(wrapper.classes()).toContain('icons-only')
  })

  it('handles window resize event correctly', async () => {
    const wrapper = mount(LinkList, {
      slots: {
        default: '<span>Test</span>',
      },
    })

    // Get the resize event listener
    const resizeHandler = (global.window.addEventListener as any).mock.calls[0][1]

    // Mock that scroll is needed after resize
    Object.defineProperty(wrapper.element, 'scrollWidth', {
      value: 300,
      writable: true,
    })
    Object.defineProperty(wrapper.element, 'clientWidth', {
      value: 200,
      writable: true,
    })

    // Call the resize handler
    resizeHandler()
    await nextTick()

    expect(wrapper.classes()).toContain('icons-only')
  })

  it('applies icons-only CSS when scroll is needed', async () => {
    const wrapper = mount(LinkList, {
      slots: {
        default: '<span>Long content</span>',
      },
    })

    // Mock scroll needed
    Object.defineProperty(wrapper.element, 'scrollWidth', {
      value: 300,
      writable: true,
    })
    Object.defineProperty(wrapper.element, 'clientWidth', {
      value: 200,
      writable: true,
    })

    // Trigger the checkScrollability function manually by calling the captured callback
    capturedCallback?.()
    await nextTick()

    // Check that the component has the icons-only class
    expect(wrapper.classes()).toContain('icons-only')

    // Verify the scoped style is applied
    expect(wrapper.attributes('class')).toContain('icons-only')
  })

  it('updates scroll state when content changes dynamically', async () => {
    const wrapper = mount(LinkList, {
      slots: {
        default: '<span>Initial content</span>',
      },
    })

    // Initially no scroll needed
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

    // Simulate content change that requires scroll
    Object.defineProperty(wrapper.element, 'scrollWidth', {
      value: 300,
      writable: true,
    })

    // Call the captured MutationObserver callback
    capturedCallback?.()

    await nextTick()
    expect(wrapper.classes()).toContain('icons-only')
  })
})
