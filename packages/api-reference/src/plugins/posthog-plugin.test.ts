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

import { PostHogPlugin } from './posthog-plugin'

describe('posthog-plugin', () => {
  it('returns a plugin with the correct name', () => {
    const plugin = PostHogPlugin()
    const instance = plugin()
    expect(instance.name).toBe('posthog')
  })

  it('returns empty extensions', () => {
    const plugin = PostHogPlugin()
    const instance = plugin()
    expect(instance.extensions).toEqual([])
  })

  it('has lifecycle hooks defined', () => {
    const plugin = PostHogPlugin()
    const instance = plugin()
    expect(instance.hooks?.onInit).toBeDefined()
    expect(instance.hooks?.onDestroy).toBeDefined()
  })

  it('initializes PostHog on onInit', () => {
    const plugin = PostHogPlugin()
    const instance = plugin()
    instance.hooks?.onInit?.({ config: {} })

    expect(mockPostHogInstance.register).toHaveBeenCalledWith({ product: 'api-reference' })
    expect(mockPostHogInstance.opt_in_capturing).toHaveBeenCalled()
  })

  it('resets PostHog on onDestroy', () => {
    const plugin = PostHogPlugin()
    const instance = plugin()
    instance.hooks?.onInit?.({ config: {} })
    instance.hooks?.onDestroy?.()

    expect(mockPostHogInstance.reset).toHaveBeenCalled()
  })
})
