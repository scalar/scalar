import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import type { OAuthFlowsObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import OAuth2 from '@/v2/blocks/scalar-auth-selector-block/components/OAuth2.vue'
import OAuthScopesInput from '@/v2/blocks/scalar-auth-selector-block/components/OAuthScopesInput.vue'
import RequestAuthDataTableInput from '@/v2/blocks/scalar-auth-selector-block/components/RequestAuthDataTableInput.vue'

describe('OAuth2', () => {
  const baseEnv = {
    uid: 'env-1',
    name: 'Default',
    color: '#FFFFFF',
    value: '',
    isDefault: true,
  }

  const eventBus = createWorkspaceEventBus()

  const mountWithProps = (
    custom: Partial<{
      flows: any
      type: string
      selectedScopes: string[]
      server: any
      proxyUrl: string
    }> = {},
  ) => {
    const flows =
      custom.flows ??
      ({
        authorizationCode: {
          authorizationUrl: 'https://example.com/auth',
          tokenUrl: 'https://example.com/token',
          refreshUrl: 'https://example.com/token',
          'x-usePkce': 'no',
          scopes: { read: 'Read', write: 'Write' },
        },
      } satisfies OAuthFlowsObject)

    return mount(OAuth2, {
      attachTo: document.body,
      props: {
        environment: baseEnv as any,
        flows,
        type: (custom.type ?? 'authorizationCode') as any,
        selectedScopes: custom.selectedScopes ?? [],
        server: custom.server ?? null,
        proxyUrl: custom.proxyUrl ?? '',
        eventBus,
        name: 'OAuth2',
      },
    })
  }

  it('renders Access Token view when token is present and supports clearing', async () => {
    const wrapper = mountWithProps({
      flows: {
        authorizationCode: {
          'x-scalar-secret-token': 'abc123',
          scopes: {},
          'x-scalar-client-id': '',
        },
      },
    })

    expect(wrapper.text()).toContain('Access Token')
    expect(wrapper.text()).not.toContain('Authorize')

    // Clear button emits auth:update:security-scheme-secrets with empty token
    const emitted = vi.fn()
    eventBus.on('auth:update:security-scheme-secrets', emitted)

    const clearBtn = wrapper.findAll('button').find((b) => b.text() === 'Clear')
    expect(clearBtn, 'Clear button should exist').toBeTruthy()
    await clearBtn!.trigger('click')

    expect(emitted).toHaveBeenCalledTimes(1)
    expect(emitted).toHaveBeenCalledWith({
      payload: {
        type: 'oauth2',
        authorizationCode: { 'x-scalar-secret-token': '' },
      },
      name: 'OAuth2',
    })

    // Updating the token input propagates via update:modelValue
    const tokenInput = wrapper.findComponent(RequestAuthDataTableInput)
    expect(tokenInput.exists()).toBe(true)
    tokenInput.vm.$emit('update:modelValue', 'xyz')
    await nextTick()

    expect(emitted).toHaveBeenCalledTimes(2)
    expect(emitted).toHaveBeenLastCalledWith({
      payload: {
        type: 'oauth2',
        authorizationCode: { 'x-scalar-secret-token': 'xyz' },
      },
      name: 'OAuth2',
    })
  })

  it('renders configuration inputs without token and shows Authorize button', async () => {
    const wrapper = mountWithProps()

    // Should render the Authorize action when no token present
    const authorizeBtn = wrapper.findAll('button').find((b) => b.text() === 'Authorize')
    expect(authorizeBtn, 'Authorize button should exist').toBeTruthy()

    // Emits for Auth URL
    const emitted = vi.fn()
    eventBus.on('auth:update:security-scheme', emitted)

    const inputs = wrapper.findAllComponents(RequestAuthDataTableInput)
    expect(inputs.length).toBeGreaterThan(0)

    // First input corresponds to Auth URL in this configuration
    inputs[0]!.vm.$emit('update:modelValue', 'https://new-auth.test')
    await nextTick()

    expect(emitted).toHaveBeenCalledTimes(1)
    expect(emitted).toHaveBeenCalledWith({
      payload: {
        type: 'oauth2',
        flows: {
          authorizationCode: { authorizationUrl: 'https://new-auth.test' },
        },
      },
      name: 'OAuth2',
    })

    // Second input corresponds to Token URL
    inputs[1]!.vm.$emit('update:modelValue', 'https://new-token.test')
    await nextTick()

    expect(emitted).toHaveBeenCalledTimes(2)
    expect(emitted).toHaveBeenLastCalledWith({
      payload: {
        type: 'oauth2',
        flows: {
          authorizationCode: { tokenUrl: 'https://new-token.test' },
        },
      },
      name: 'OAuth2',
    })
  })

  it('re-emits selected scopes from child component', async () => {
    const wrapper = mountWithProps({ selectedScopes: [] })

    const scopes = wrapper.findComponent(OAuthScopesInput)
    expect(scopes.exists()).toBe(true)

    scopes.vm.$emit('update:selectedScopes', { scopes: ['read'] })
    await nextTick()

    const emit = wrapper.emitted('update:selectedScopes')?.at(-1)?.[0] as any
    expect(emit).toEqual({ scopes: ['read'] })
  })

  it('defaults x-scalar-secret-redirect-uri to window.location.origin + window.location.pathname', async () => {
    const originalOrigin = window.location.origin
    const originalPathname = window.location.pathname

    const emitted = vi.fn()
    eventBus.on('auth:update:security-scheme-secrets', emitted)

    mountWithProps({
      flows: {
        authorizationCode: {
          authorizationUrl: 'https://example.com/auth',
          tokenUrl: 'https://example.com/token',
          'x-scalar-secret-token': '',
          'x-usePkce': 'no',
          'x-scalar-secret-redirect-uri': '',
          scopes: {},
          'x-scalar-secret-client-id': '',
          'x-scalar-secret-client-secret': '',
        },
      },
    })

    await nextTick()

    const expectedRedirectUri = originalOrigin + originalPathname

    expect(emitted).toHaveBeenCalledTimes(1)
    expect(emitted).toHaveBeenCalledWith({
      payload: {
        type: 'oauth2',
        authorizationCode: {
          'x-scalar-secret-redirect-uri': expectedRedirectUri,
        },
      },
      name: 'OAuth2',
    })
  })
})
