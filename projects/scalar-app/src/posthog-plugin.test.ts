import { beforeEach, describe, expect, it, vi } from 'vitest'

const { initMock, captureMock, optInMock, optOutMock, resetMock, registerMock } = vi.hoisted(() => {
  const captureMock = vi.fn()
  const optInMock = vi.fn()
  const optOutMock = vi.fn()
  const resetMock = vi.fn()
  const registerMock = vi.fn()
  const initMock = vi.fn(() => ({
    capture: captureMock,
    opt_in_capturing: optInMock,
    opt_out_capturing: optOutMock,
    reset: resetMock,
    register: registerMock,
  }))

  return {
    initMock,
    captureMock,
    optInMock,
    optOutMock,
    resetMock,
    registerMock,
  }
})

vi.mock('posthog-js', () => ({
  default: {
    init: initMock,
  },
}))

import { PostHogClientPlugin } from '@scalar/api-client/plugins/posthog'

describe('PostHogClientPlugin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes posthog and captures api-client events', () => {
    const plugin = PostHogClientPlugin({
      apiKey: 'phc_test_key',
      apiHost: 'https://magic.scalar.com',
      uiHost: 'https://us.posthog.com',
    })

    plugin.lifecycle?.onInit?.({ config: { telemetry: true } } as never)

    expect(initMock).toHaveBeenCalledWith(
      'phc_test_key',
      expect.objectContaining({
        api_host: 'https://magic.scalar.com',
        ui_host: 'https://us.posthog.com',
        opt_out_capturing_by_default: true,
      }),
      'scalar-api-client',
    )
    expect(registerMock).toHaveBeenCalledWith({ product: 'api-client' })
    expect(optInMock).toHaveBeenCalledTimes(1)

    plugin.on?.['hooks:on:request:sent']?.({} as never)
    plugin.on?.['operation:create:operation']?.({} as never)
    plugin.on?.['ui:download:document']?.({} as never)

    expect(captureMock).toHaveBeenCalledWith('hooks:on:request:sent')
    expect(captureMock).toHaveBeenCalledWith('operation:create:operation')
    expect(captureMock).toHaveBeenCalledWith('ui:download:document')
  })

  it('toggles capture when telemetry config changes and resets on destroy', () => {
    const plugin = PostHogClientPlugin({
      apiKey: 'phc_test_key',
      apiHost: 'https://magic.scalar.com',
    })

    plugin.lifecycle?.onInit?.({ config: { telemetry: true } } as never)
    plugin.lifecycle?.onConfigChange?.({
      config: { telemetry: false },
    } as never)
    plugin.lifecycle?.onConfigChange?.({ config: { telemetry: true } } as never)

    expect(optOutMock).toHaveBeenCalledTimes(1)
    expect(optInMock).toHaveBeenCalledTimes(2)

    plugin.lifecycle?.onDestroy?.()

    expect(resetMock).toHaveBeenCalledTimes(1)
  })
})
