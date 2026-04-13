import { describe, expect, it, vi } from 'vitest'

vi.mock('posthog-js', () => {
  const instance = {
    register: vi.fn(),
    opt_in_capturing: vi.fn(),
    reset: vi.fn(),
  }

  return {
    default: {
      init: vi.fn(() => instance),
    },
    __instance: instance,
  }
})

const { __instance: mockPostHogInstance } = (await import('posthog-js')) as any

import { PostHogClientPlugin } from './index'

const TEST_CONFIG = {
  apiKey: 'phc_test_key',
  apiHost: 'https://test.example.com',
}

describe('posthog-plugin', () => {
  it('returns a plugin with lifecycle hooks', () => {
    const plugin = PostHogClientPlugin(TEST_CONFIG)
    expect(plugin.lifecycle?.onInit).toBeDefined()
    expect(plugin.lifecycle?.onDestroy).toBeDefined()
  })

  it('initializes PostHog on onInit', () => {
    const plugin = PostHogClientPlugin(TEST_CONFIG)
    plugin.lifecycle?.onInit?.()

    expect(mockPostHogInstance.register).toHaveBeenCalledWith({ product: 'api-client' })
    expect(mockPostHogInstance.opt_in_capturing).toHaveBeenCalled()
  })

  it('resets PostHog on onDestroy', () => {
    const plugin = PostHogClientPlugin(TEST_CONFIG)
    plugin.lifecycle?.onInit?.()
    plugin.lifecycle?.onDestroy?.()

    expect(mockPostHogInstance.reset).toHaveBeenCalled()
  })
})
