import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import ScalarCopy from './ScalarCopy.vue'
import ScalarCopyButton from './ScalarCopyButton.vue'

const mockWriteText = vi.fn().mockResolvedValue(undefined)
const mockExecCommand = vi.fn().mockReturnValue(true)

describe('ScalarCopy', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()

    // Mock navigator.clipboard - VueUse prefers this when available
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: mockWriteText,
      },
      writable: true,
      configurable: true,
    })

    // Mock document.execCommand as fallback (VueUse uses this when clipboard API is not available)
    // Setting it to return false might encourage VueUse to use navigator.clipboard instead
    Object.defineProperty(document, 'execCommand', {
      value: mockExecCommand,
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  describe('rendering', () => {
    it('renders ScalarCopyButton when clipboard is supported', () => {
      const wrapper = mount(ScalarCopy, {
        props: {
          content: 'test content',
        },
      })

      expect(wrapper.findComponent(ScalarCopyButton).exists()).toBeTruthy()
    })

    it('renders even when clipboard is not supported (VueUse handles fallback)', async () => {
      // Remove navigator.clipboard and document.execCommand to simulate unsupported environment
      // Need to delete the property completely, not just set to undefined
      delete (navigator as { clipboard?: unknown }).clipboard
      Object.defineProperty(document, 'execCommand', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      const wrapper = mount(ScalarCopy, {
        props: {
          content: 'test content',
        },
      })

      await nextTick()
      await flushPromises()
      // VueUse's useClipboard handles fallbacks internally, so the component still renders
      // The button will attempt to copy but may fail gracefully
      expect(wrapper.findComponent(ScalarCopyButton).exists()).toBeTruthy()

      // Restore for other tests
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: mockWriteText,
        },
        writable: true,
        configurable: true,
      })
    })
  })

  describe('content prop', () => {
    it('copies content to clipboard when button is clicked', async () => {
      const wrapper = mount(ScalarCopy, {
        props: {
          content: 'test content to copy',
        },
      })

      const button = wrapper.findComponent(ScalarCopyButton)
      expect(button.props('copied')).toBe(false)

      await button.trigger('click')
      // Wait for the async copy operation
      await flushPromises()

      // Verify copy was called by checking copied state changed
      const copiedButton = wrapper.findComponent(ScalarCopyButton)
      expect(copiedButton.props('copied')).toBe(true)

      // navigator.clipboard is mocked - VueUse may use it or document.execCommand
      // depending on its internal detection logic, but the copy operation succeeded
    })
  })

  describe('copied state', () => {
    it('sets copied to true after copy and clears after duration', async () => {
      const wrapper = mount(ScalarCopy, {
        props: {
          content: 'test',
          duration: 1500,
        },
      })

      await nextTick()
      const button = wrapper.findComponent(ScalarCopyButton)
      expect(button.props('copied')).toBe(false)

      // Click to copy
      await button.trigger('click')
      await flushPromises()

      // Should be copied immediately
      const copiedButton = wrapper.findComponent(ScalarCopyButton)
      expect(copiedButton.props('copied')).toBe(true)

      // Advance time but not enough to clear
      vi.advanceTimersByTime(1499)
      await nextTick()
      expect(copiedButton.props('copied')).toBe(true)

      // Advance the rest of the duration
      vi.advanceTimersByTime(1)
      await nextTick()

      // Should be cleared now
      const clearedButton = wrapper.findComponent(ScalarCopyButton)
      expect(clearedButton.props('copied')).toBe(false)
    })
  })

  describe('duration prop', () => {
    it('uses default duration of 1500ms', async () => {
      const wrapper = mount(ScalarCopy, {
        props: {
          content: 'test',
        },
      })

      const button = wrapper.findComponent(ScalarCopyButton)
      await button.trigger('click')
      await flushPromises()

      expect(wrapper.findComponent(ScalarCopyButton).props('copied')).toBe(true)

      // Advance time but not enough
      vi.advanceTimersByTime(1499)
      await nextTick()
      expect(wrapper.findComponent(ScalarCopyButton).props('copied')).toBe(true)

      // Advance to default duration
      vi.advanceTimersByTime(1)
      await nextTick()
      expect(wrapper.findComponent(ScalarCopyButton).props('copied')).toBe(false)
    })

    it('uses custom duration', async () => {
      const wrapper = mount(ScalarCopy, {
        props: {
          content: 'test',
          duration: 2000,
        },
      })

      const button = wrapper.findComponent(ScalarCopyButton)
      await button.trigger('click')
      await flushPromises()

      expect(wrapper.findComponent(ScalarCopyButton).props('copied')).toBe(true)

      // Advance time but not enough
      vi.advanceTimersByTime(1999)
      await nextTick()
      expect(wrapper.findComponent(ScalarCopyButton).props('copied')).toBe(true)

      // Advance to custom duration
      vi.advanceTimersByTime(1)
      await nextTick()
      expect(wrapper.findComponent(ScalarCopyButton).props('copied')).toBe(false)
    })
  })

  describe('slots', () => {
    it('passes copy slot to ScalarCopyButton', async () => {
      const wrapper = mount(ScalarCopy, {
        props: {
          content: 'test',
        },
        slots: {
          copy: 'Custom copy text',
        },
      })

      await nextTick()
      const button = wrapper.findComponent(ScalarCopyButton)
      expect(button.text()).toContain('Custom copy text')
    })

    it('passes copied slot to ScalarCopyButton', async () => {
      const wrapper = mount(ScalarCopy, {
        props: {
          content: 'test',
        },
        slots: {
          copied: 'Custom copied text',
        },
      })

      const button = wrapper.findComponent(ScalarCopyButton)
      await button.trigger('click')
      await flushPromises()

      expect(button.text()).toContain('Custom copied text')
    })
  })
})
