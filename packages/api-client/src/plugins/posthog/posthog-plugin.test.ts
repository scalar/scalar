import { describe, expect, it, vi } from 'vitest'

const mockPostHogInstance = vi.hoisted(() => ({
  register: vi.fn(),
  opt_in_capturing: vi.fn(),
  opt_out_capturing: vi.fn(),
  capture: vi.fn(),
  identify: vi.fn(),
  reset: vi.fn(),
}))

vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(() => mockPostHogInstance),
  },
}))

// posthog-js only initializes in a browser environment, so we need window defined
vi.stubGlobal('window', globalThis)

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
    plugin.lifecycle?.onInit?.({ config: {} })

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

  it('captures events via the wildcard handler', () => {
    const plugin = PostHogClientPlugin(TEST_CONFIG)
    plugin.lifecycle?.onInit?.({ config: {} })

    const wildcardHandler = plugin.on
    expect(wildcardHandler).toBeDefined()

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

    // Empty payloads produce no extracted properties, so PostHog is called
    // without a properties argument — we still want to know the event fired,
    // just without a noisy `{}` payload attached.
    for (const event of trackedEvents) {
      mockPostHogInstance.capture.mockClear()
      wildcardHandler?.({ event, payload: {} } as never)
      expect(mockPostHogInstance.capture).toHaveBeenCalledWith(event)
    }
  })

  it('captures with extracted properties when the payload provides them', () => {
    const plugin = PostHogClientPlugin(TEST_CONFIG)
    plugin.lifecycle?.onInit?.({ config: {} })

    // `auth:update:selected-security-schemes` extracts `meta.type` when present
    mockPostHogInstance.capture.mockClear()
    plugin.on?.({
      event: 'auth:update:selected-security-schemes',
      payload: { meta: { type: 'apiKey' } },
    } as never)
    expect(mockPostHogInstance.capture).toHaveBeenCalledWith('auth:update:selected-security-schemes', {
      'meta.type': 'apiKey',
    })

    // `ui:download:document` extracts `format` when present
    mockPostHogInstance.capture.mockClear()
    plugin.on?.({ event: 'ui:download:document', payload: { format: 'yaml' } } as never)
    expect(mockPostHogInstance.capture).toHaveBeenCalledWith('ui:download:document', { format: 'yaml' })
  })

  it('does not capture events that are not in the allowlist', () => {
    const plugin = PostHogClientPlugin(TEST_CONFIG)
    plugin.lifecycle?.onInit?.({ config: {} })
    mockPostHogInstance.capture.mockClear()

    const wildcardHandler = plugin.on

    // These events are intentionally excluded from the analytics allowlist
    const untrackedEvents = [
      'auth:update:security-scheme-secrets',
      'operation:update:requestBody:value',
      'operation:upsert:parameter',
      'select:nav-item',
      'analytics:on:loaded',
    ] as const

    for (const event of untrackedEvents) {
      wildcardHandler?.({ event, payload: {} } as never)
    }

    expect(mockPostHogInstance.capture).not.toHaveBeenCalled()
  })

  it('does not capture log: events via the wildcard handler', () => {
    const plugin = PostHogClientPlugin(TEST_CONFIG)
    plugin.lifecycle?.onInit?.({ config: {} })
    mockPostHogInstance.capture.mockClear()

    const wildcardHandler = plugin.on

    wildcardHandler?.({ event: 'log:user-login', payload: {} } as never)
    wildcardHandler?.({ event: 'log:user-logout', payload: undefined } as never)

    expect(mockPostHogInstance.capture).not.toHaveBeenCalled()
  })

  it('identifies the user on log:user-login via the wildcard handler', () => {
    const plugin = PostHogClientPlugin(TEST_CONFIG)
    plugin.lifecycle?.onInit?.({ config: {} })

    plugin.on?.({
      event: 'log:user-login',
      payload: { uid: 'u1', email: 'user@example.com', teamUid: 'team1' },
    })

    expect(mockPostHogInstance.identify).toHaveBeenCalledWith('u1', {
      email: 'user@example.com',
      teamUid: 'team1',
    })
  })

  it('resets PostHog on log:user-logout via the wildcard handler', () => {
    const plugin = PostHogClientPlugin(TEST_CONFIG)
    plugin.lifecycle?.onInit?.({ config: {} })

    mockPostHogInstance.reset.mockClear()
    plugin.on?.({ event: 'log:user-logout', payload: undefined })

    expect(mockPostHogInstance.reset).toHaveBeenCalled()
  })

  it('resets PostHog on onDestroy', () => {
    const plugin = PostHogClientPlugin(TEST_CONFIG)
    plugin.lifecycle?.onInit?.({ config: {} })

    mockPostHogInstance.reset.mockClear()
    plugin.lifecycle?.onDestroy?.()

    expect(mockPostHogInstance.reset).toHaveBeenCalled()
  })
})
