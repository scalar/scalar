/**
 * @vitest-environment jsdom
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { type Toaster, toast } from 'vue-sonner'

import { useToasts } from '../hooks/useToasts'
import ScalarToasts from './ScalarToasts.vue'

vi.mock('../hooks/useToasts', () => ({
  useToasts: vi.fn(() => ({
    initializeToasts: vi.fn(),
  })),
}))

vi.mock('vue-sonner', async (importOriginal) => {
  const actual = (await importOriginal()) as {
    Toaster: typeof Toaster
    toast: typeof toast
  }

  return {
    ...actual,
    toast: vi.fn(),
    Toaster: actual.Toaster,
  }
})

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

  it('should initialize toasts with correct parameters', async () => {
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
})
