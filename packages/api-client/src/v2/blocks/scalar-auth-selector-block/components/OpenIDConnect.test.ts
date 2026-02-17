import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import OpenIDConnect from './OpenIDConnect.vue'
import RequestAuthDataTableInput from './RequestAuthDataTableInput.vue'

const mockToast = vi.fn()
const mockFetchOpenIDConnectDiscovery = vi.fn()
const mockOpenIDDiscoveryToFlows = vi.fn()

vi.mock('@scalar/use-toasts', () => ({
  useToasts: () => ({
    toast: mockToast,
  }),
}))

vi.mock('@/v2/blocks/scalar-auth-selector-block/helpers/fetch-openid-connect-discovery', () => ({
  fetchOpenIDConnectDiscovery: (...args: unknown[]) => mockFetchOpenIDConnectDiscovery(...args),
}))

vi.mock('@/v2/blocks/scalar-auth-selector-block/helpers/openid-discovery-to-flows', () => ({
  openIDDiscoveryToFlows: (...args: unknown[]) => mockOpenIDDiscoveryToFlows(...args),
}))

describe('OpenIDConnect', () => {
  const eventBus = createWorkspaceEventBus()
  const baseEnvironment = {
    uid: 'env-1' as any,
    name: 'Default',
    color: '#FFFFFF',
    value: '',
    isDefault: true,
    variables: [],
  }

  const mountWithProps = (
    custom: Partial<{
      openIdConnectUrl: string
      proxyUrl: string
    }> = {},
  ) =>
    mount(OpenIDConnect, {
      attachTo: document.body,
      props: {
        environment: baseEnvironment,
        eventBus,
        getStaticBorderClass: () => false,
        name: 'OpenIDConnect',
        proxyUrl: custom.proxyUrl ?? '',
        scheme: {
          type: 'openIdConnect',
          openIdConnectUrl: custom.openIdConnectUrl ?? 'https://issuer.example.com',
        },
      },
    })

  beforeEach(() => {
    mockToast.mockClear()
    mockFetchOpenIDConnectDiscovery.mockReset()
    mockOpenIDDiscoveryToFlows.mockReset()
  })

  const waitForDebounce = async (): Promise<void> =>
    new Promise((resolve) => {
      setTimeout(resolve, 360)
    })

  const waitForLoadingState = async (): Promise<void> =>
    new Promise((resolve) => {
      setTimeout(resolve, 700)
    })

  it('emits auth:update:security-scheme when discovery URL changes', async () => {
    const wrapper = mountWithProps()
    const emitted = vi.fn()
    eventBus.on('auth:update:security-scheme', emitted)

    const discoveryUrlInput = wrapper.findComponent(RequestAuthDataTableInput)
    discoveryUrlInput.vm.$emit('update:modelValue', 'https://new-issuer.example.com')
    await nextTick()
    await waitForDebounce()

    expect(emitted).toHaveBeenCalledTimes(1)
    expect(emitted).toHaveBeenCalledWith({
      payload: {
        type: 'openIdConnect',
        openIdConnectUrl: 'https://new-issuer.example.com',
      },
      name: 'OpenIDConnect',
    })
  })

  it('fetches discovery and emits auth:update:security-scheme-secrets on success', async () => {
    const wrapper = mountWithProps({
      openIdConnectUrl: 'https://issuer.example.com',
      proxyUrl: 'https://proxy.example.com',
    })
    const emitted = vi.fn()
    eventBus.on('auth:update:security-scheme-secrets', emitted)

    const discovery = {
      authorization_endpoint: 'https://issuer.example.com/oauth/authorize',
      token_endpoint: 'https://issuer.example.com/oauth/token',
      grant_types_supported: ['authorization_code'],
    }
    const flows = {
      type: 'openIdConnect',
      authorizationCode: {
        authorizationUrl: 'https://issuer.example.com/oauth/authorize',
        tokenUrl: 'https://issuer.example.com/oauth/token',
        scopes: {},
      },
    }
    mockFetchOpenIDConnectDiscovery.mockResolvedValue([null, discovery])
    mockOpenIDDiscoveryToFlows.mockReturnValue(flows)

    const fetchButton = wrapper.findComponent({ name: 'ScalarButton' })
    expect(fetchButton.exists()).toBe(true)
    fetchButton.vm.$emit('click')
    await nextTick()
    await waitForLoadingState()

    expect(mockFetchOpenIDConnectDiscovery).toHaveBeenCalledWith(
      'https://issuer.example.com',
      'https://proxy.example.com',
    )
    expect(mockOpenIDDiscoveryToFlows).toHaveBeenCalledWith(discovery)
    expect(emitted).toHaveBeenCalledTimes(1)
    expect(emitted).toHaveBeenCalledWith({
      payload: flows,
      name: 'OpenIDConnect',
      overwrite: true,
    })
    expect(mockToast).not.toHaveBeenCalled()
  })

  it('shows an error toast when discovery fetch fails', async () => {
    const wrapper = mountWithProps({
      openIdConnectUrl: 'https://issuer.example.com',
    })

    const emitted = vi.fn()
    eventBus.on('auth:update:security-scheme-secrets', emitted)
    mockFetchOpenIDConnectDiscovery.mockResolvedValue([new Error('Failed to load discovery'), null])

    const fetchButton = wrapper.findComponent({ name: 'ScalarButton' })
    expect(fetchButton.exists()).toBe(true)
    fetchButton.vm.$emit('click')
    await nextTick()
    await waitForLoadingState()

    expect(emitted).not.toHaveBeenCalled()
    expect(mockToast).toHaveBeenCalledTimes(1)
    expect(mockToast).toHaveBeenCalledWith('Failed to load discovery', 'error')
  })
})
