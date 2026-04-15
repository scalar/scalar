import { describe, expect, it, vi } from 'vitest'

const mockPostHogInstance = vi.hoisted(() => ({
  register: vi.fn(),
  opt_in_capturing: vi.fn(),
  opt_out_capturing: vi.fn(),
  capture: vi.fn(),
  reset: vi.fn(),
}))

vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(() => mockPostHogInstance),
  },
}))

import { PostHogPlugin } from './index'

const TEST_CONFIG = {
  apiKey: 'phc_test_key',
  apiHost: 'https://test.example.com',
}

describe('posthog-plugin', () => {
  it('returns a plugin with the correct name', () => {
    const plugin = PostHogPlugin(TEST_CONFIG)
    const instance = plugin()
    expect(instance.name).toBe('posthog')
  })

  it('returns empty extensions', () => {
    const plugin = PostHogPlugin(TEST_CONFIG)
    const instance = plugin()
    expect(instance.extensions).toEqual([])
  })

  it('has lifecycle hooks defined', () => {
    const plugin = PostHogPlugin(TEST_CONFIG)
    const instance = plugin()
    expect(instance.hooks?.onInit).toBeDefined()
    expect(instance.hooks?.onConfigChange).toBeDefined()
    expect(instance.hooks?.onDestroy).toBeDefined()
  })

  it('initializes PostHog on onInit', () => {
    const plugin = PostHogPlugin(TEST_CONFIG)
    const instance = plugin()
    instance.hooks?.onInit?.({ config: {} })

    expect(mockPostHogInstance.register).toHaveBeenCalledWith({ product: 'api-reference' })
    expect(mockPostHogInstance.opt_in_capturing).toHaveBeenCalled()
  })

  it('does not opt in when telemetry is disabled', () => {
    const plugin = PostHogPlugin(TEST_CONFIG)
    const instance = plugin()

    mockPostHogInstance.opt_in_capturing.mockClear()
    instance.hooks?.onInit?.({ config: { telemetry: false } })

    expect(mockPostHogInstance.register).toHaveBeenCalledWith({ product: 'api-reference' })
    expect(mockPostHogInstance.opt_in_capturing).not.toHaveBeenCalled()
  })

  it('reacts to telemetry config changes', () => {
    const plugin = PostHogPlugin(TEST_CONFIG)
    const instance = plugin()
    instance.hooks?.onInit?.({ config: { telemetry: true } })

    mockPostHogInstance.opt_in_capturing.mockClear()
    mockPostHogInstance.opt_out_capturing.mockClear()

    instance.hooks?.onConfigChange?.({ config: { telemetry: false } })
    expect(mockPostHogInstance.opt_out_capturing).toHaveBeenCalled()

    instance.hooks?.onConfigChange?.({ config: { telemetry: true } })
    expect(mockPostHogInstance.opt_in_capturing).toHaveBeenCalled()
  })

  it('includes an API client plugin', () => {
    const plugin = PostHogPlugin(TEST_CONFIG)
    const instance = plugin()
    expect(instance.apiClientPlugins).toHaveLength(1)
  })

  it('resets PostHog on onDestroy', () => {
    const plugin = PostHogPlugin(TEST_CONFIG)
    const instance = plugin()
    instance.hooks?.onInit?.({ config: {} })
    instance.hooks?.onDestroy?.()

    expect(mockPostHogInstance.reset).toHaveBeenCalled()
  })

  it('propagates lifecycle to client plugin', () => {
    const plugin = PostHogPlugin(TEST_CONFIG)
    const instance = plugin()
    const clientPlugin = instance.apiClientPlugins![0]

    const onInit = vi.spyOn(clientPlugin.lifecycle!, 'onInit')
    const onConfigChange = vi.spyOn(clientPlugin.lifecycle!, 'onConfigChange')
    const onDestroy = vi.spyOn(clientPlugin.lifecycle!, 'onDestroy')

    instance.hooks?.onInit?.({ config: { telemetry: true } })
    expect(onInit).toHaveBeenCalledWith({ config: { telemetry: true } })

    instance.hooks?.onConfigChange?.({ config: { telemetry: false } })
    expect(onConfigChange).toHaveBeenCalledWith({ config: { telemetry: false } })

    instance.hooks?.onDestroy?.()
    expect(onDestroy).toHaveBeenCalled()
  })
})
