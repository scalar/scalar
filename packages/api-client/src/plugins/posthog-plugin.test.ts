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

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { __instance: mockPostHogInstance } = (await import('posthog-js')) as any

import { PostHogClientPlugin } from './posthog-plugin'

describe('posthog-plugin', () => {
  it('returns a plugin with lifecycle hooks', () => {
    const plugin = PostHogClientPlugin()
    expect(plugin.lifecycle?.onInit).toBeDefined()
    expect(plugin.lifecycle?.onDestroy).toBeDefined()
  })

  it('initializes PostHog on onInit', () => {
    const plugin = PostHogClientPlugin()
    plugin.lifecycle?.onInit?.()

    expect(mockPostHogInstance.register).toHaveBeenCalledWith({ product: 'api-client' })
    expect(mockPostHogInstance.opt_in_capturing).toHaveBeenCalled()
  })

  it('resets PostHog on onDestroy', () => {
    const plugin = PostHogClientPlugin()
    plugin.lifecycle?.onInit?.()
    plugin.lifecycle?.onDestroy?.()

    expect(mockPostHogInstance.reset).toHaveBeenCalled()
  })
})
