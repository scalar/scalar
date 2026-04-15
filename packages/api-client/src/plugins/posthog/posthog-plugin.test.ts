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

import { PostHogClientPlugin } from './index'

const TEST_CONFIG = {
  apiKey: 'phc_test_key',
  apiHost: 'https://test.example.com',
}

describe('posthog-plugin', () => {
  it('returns a plugin with lifecycle hooks', () => {
    const plugin = PostHogClientPlugin(TEST_CONFIG)
    expect(plugin.lifecycle?.onInit).toBeDefined()
    expect(plugin.lifecycle?.onConfigChange).toBeDefined()
    expect(plugin.lifecycle?.onDestroy).toBeDefined()
  })

  it('initializes PostHog on onInit', () => {
    const plugin = PostHogClientPlugin(TEST_CONFIG)
    plugin.lifecycle?.onInit?.()

    expect(mockPostHogInstance.register).toHaveBeenCalledWith({ product: 'api-client' })
    expect(mockPostHogInstance.opt_in_capturing).toHaveBeenCalled()
  })

  it('does not opt in when telemetry is disabled', () => {
    const plugin = PostHogClientPlugin(TEST_CONFIG)

    mockPostHogInstance.opt_in_capturing.mockClear()
    plugin.lifecycle?.onInit?.({ config: { telemetry: false } })

    expect(mockPostHogInstance.register).toHaveBeenCalledWith({ product: 'api-client' })
    expect(mockPostHogInstance.opt_in_capturing).not.toHaveBeenCalled()
  })

  it('reacts to telemetry config changes', () => {
    const plugin = PostHogClientPlugin(TEST_CONFIG)
    plugin.lifecycle?.onInit?.({ config: { telemetry: true } })

    mockPostHogInstance.opt_in_capturing.mockClear()
    mockPostHogInstance.opt_out_capturing.mockClear()

    plugin.lifecycle?.onConfigChange?.({ config: { telemetry: false } })
    expect(mockPostHogInstance.opt_out_capturing).toHaveBeenCalled()

    plugin.lifecycle?.onConfigChange?.({ config: { telemetry: true } })
    expect(mockPostHogInstance.opt_in_capturing).toHaveBeenCalled()
  })

  it('captures events via event bus subscriptions', () => {
    const plugin = PostHogClientPlugin(TEST_CONFIG)
    plugin.lifecycle?.onInit?.()

    const trackedEvents = [
      'hooks:on:request:sent',
      'operation:create:operation',
      'operation:delete:operation',
      'document:create:empty-document',
      'document:delete:document',
      'tag:create:tag',
      'server:add:server',
      'auth:update:selected-security-schemes',
      'environment:upsert:environment',
      'ui:open:client-modal',
      'ui:download:document',
    ] as const

    for (const event of trackedEvents) {
      mockPostHogInstance.capture.mockClear()
      plugin.on?.[event]?.({} as never)
      expect(mockPostHogInstance.capture).toHaveBeenCalledWith(event)
    }
  })

  it('resets PostHog on onDestroy', () => {
    const plugin = PostHogClientPlugin(TEST_CONFIG)
    plugin.lifecycle?.onInit?.()
    plugin.lifecycle?.onDestroy?.()

    expect(mockPostHogInstance.reset).toHaveBeenCalled()
  })
})
