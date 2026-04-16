import type { ApiClientConfiguration } from '@scalar/types/api-reference'
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
      scheme: any
      configuration: Partial<ApiClientConfiguration>
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
        scheme: custom.scheme ?? { type: 'oauth2' },
        options: custom.configuration ?? {},
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
        authorizationCode: {
          'x-scalar-secret-token': '',
          'x-scalar-secret-refresh-token': '',
        },
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

  it('emits credentials location updates to both the scheme config and auth secrets', async () => {
    const wrapper = mountWithProps({
      flows: {
        authorizationCode: {
          authorizationUrl: 'https://example.com/auth',
          tokenUrl: 'https://example.com/token',
          refreshUrl: '',
          scopes: {},
          'x-scalar-secret-client-id': '',
          'x-scalar-secret-client-secret': '',
        },
      },
    })

    const schemeEmitted = vi.fn()
    const secretsEmitted = vi.fn()
    eventBus.on('auth:update:security-scheme', schemeEmitted)
    eventBus.on('auth:update:security-scheme-secrets', secretsEmitted)

    const credentialsLocationInput = wrapper
      .findAllComponents(RequestAuthDataTableInput)
      .find((input) => input.text().includes('Credentials Location'))

    expect(credentialsLocationInput, 'Credentials Location input should exist').toBeTruthy()

    credentialsLocationInput!.vm.$emit('update:modelValue', 'body')
    await nextTick()

    expect(schemeEmitted).toHaveBeenCalledTimes(1)
    expect(schemeEmitted).toHaveBeenCalledWith({
      payload: {
        type: 'oauth2',
        flows: {
          authorizationCode: { 'x-scalar-credentials-location': 'body' },
        },
      },
      name: 'OAuth2',
    })

    expect(secretsEmitted).toHaveBeenCalledTimes(1)
    expect(secretsEmitted).toHaveBeenCalledWith({
      payload: {
        type: 'oauth2',
        authorizationCode: { 'x-scalar-credentials-location': 'body' },
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

  it('defaults x-scalar-secret-redirect-uri to window.location.origin + pathname', async () => {
    const expectedRedirectUri = window.location.origin + window.location.pathname

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

  it('uses oauth2RedirectUri config when pre-filling redirect URI', async () => {
    const emitted = vi.fn()
    eventBus.on('auth:update:security-scheme-secrets', emitted)

    mountWithProps({
      configuration: {
        oauth2RedirectUri: 'myapp://oauth/callback',
      },
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

    expect(emitted).toHaveBeenCalledTimes(1)
    expect(emitted).toHaveBeenCalledWith({
      payload: {
        type: 'oauth2',
        authorizationCode: {
          'x-scalar-secret-redirect-uri': 'myapp://oauth/callback',
        },
      },
      name: 'OAuth2',
    })
  })

  it('does not pre-fill redirect URI on file protocol without config override', async () => {
    const originalLocation = window.location
    Object.defineProperty(window, 'location', {
      value: {
        protocol: 'file:',
        origin: 'file://',
        pathname: '/index.html',
        href: 'file:///index.html',
      },
      writable: true,
    })

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
    expect(emitted).not.toHaveBeenCalled()

    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    })
  })

  it('does not overwrite an existing x-scalar-secret-redirect-uri on mount', async () => {
    const emitted = vi.fn()
    eventBus.on('auth:update:security-scheme-secrets', emitted)

    mountWithProps({
      flows: {
        authorizationCode: {
          authorizationUrl: 'https://example.com/auth',
          tokenUrl: 'https://example.com/token',
          'x-scalar-secret-token': '',
          'x-usePkce': 'no',
          'x-scalar-secret-redirect-uri': 'https://myapp.com/callback',
          scopes: {},
          'x-scalar-secret-client-id': '',
          'x-scalar-secret-client-secret': '',
        },
      },
    })

    await nextTick()

    expect(emitted).not.toHaveBeenCalled()
  })

  it('prefills redirect URI again when switching to a different flow instance', async () => {
    const expectedRedirectUri = window.location.origin + window.location.pathname
    const emitted = vi.fn()
    eventBus.on('auth:update:security-scheme-secrets', emitted)

    const wrapper = mountWithProps({
      flows: {
        authorizationCode: {
          authorizationUrl: 'https://example.com/auth-v1',
          tokenUrl: 'https://example.com/token-v1',
          refreshUrl: '',
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
    expect(emitted).toHaveBeenCalledTimes(1)

    await wrapper.setProps({
      flows: {
        authorizationCode: {
          authorizationUrl: 'https://example.com/auth-v2',
          tokenUrl: 'https://example.com/token-v2',
          refreshUrl: '',
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
    expect(emitted).toHaveBeenCalledTimes(2)
    expect(emitted).toHaveBeenLastCalledWith({
      payload: {
        type: 'oauth2',
        authorizationCode: {
          'x-scalar-secret-redirect-uri': expectedRedirectUri,
        },
      },
      name: 'OAuth2',
    })
  })

  it('emits clear security scheme secrets for openIdConnect flow', async () => {
    const wrapper = mountWithProps({
      scheme: { type: 'openIdConnect' },
      flows: {
        authorizationCode: {
          authorizationUrl: 'https://example.com/auth',
          tokenUrl: 'https://example.com/token',
          refreshUrl: 'https://example.com/token',
          'x-usePkce': 'no',
          scopes: { openid: 'OpenID' },
          'x-scalar-secret-client-id': '',
          'x-scalar-secret-client-secret': '',
          'x-scalar-secret-redirect-uri': '',
        },
      },
    })

    const emitted = vi.fn()
    eventBus.on('auth:clear:security-scheme-secrets', emitted)

    const clearBtn = wrapper.findAll('button').find((b) => b.text() === 'Clear')
    expect(clearBtn, 'Clear button should exist').toBeTruthy()
    await clearBtn!.trigger('click')

    expect(emitted).toHaveBeenCalledTimes(1)
    expect(emitted).toHaveBeenCalledWith({
      name: 'OAuth2',
    })
  })
})
