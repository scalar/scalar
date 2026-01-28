import type { AuthStore } from '@scalar/workspace-store/entities/auth/index'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { OAuthFlowsObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import OAuth2, { type OAuth2Props } from '@/v2/blocks/scalar-auth-selector-block/components/OAuth2.vue'
import OAuthScopesInput from '@/v2/blocks/scalar-auth-selector-block/components/OAuthScopesInput.vue'
import RequestAuthDataTableInput from '@/v2/blocks/scalar-auth-selector-block/components/RequestAuthDataTableInput.vue'

// Helper to create a mock auth store with custom secret returns
const createMockAuthStore = (secretsMap: Record<string, any>): AuthStore => ({
  getAuthSecrets: (_docName: string, schemeName: string) => secretsMap[schemeName] || undefined,
  setAuthSecrets: () => {
    /* no-op */
  },
  clearDocumentAuth: () => {
    /* no-op */
  },
  load: () => {
    /* no-op */
  },
  export: () => ({}),
})

describe('OAuth2', () => {
  const baseEnv = {
    color: '#FFFFFF',
    variables: [],
  } satisfies XScalarEnvironment

  const mountWithProps = (custom: Partial<OAuth2Props> = {}) => {
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
        environment: baseEnv,
        type: 'authorizationCode',
        selectedScopes: [],
        server: null,
        proxyUrl: '',
        authStore: createMockAuthStore({
          oauth2: {
            type: 'oauth2',
            authorizationCode: {
              'x-scalar-secret-token': 'abc123',
            },
          },
        }),
        eventBus: createWorkspaceEventBus(),
        name: 'oauth2',
        documentSlug: 'test-document',
        ...custom,
        flows,
      },
    })
  }

  it('renders Access Token view when token is present and supports clearing', async () => {
    const eventBus = createWorkspaceEventBus()
    const fn = vi.fn()
    eventBus.on('auth:update:security-scheme-secrets', fn)

    const wrapper = mountWithProps({
      flows: {
        authorizationCode: {
          'x-usePkce': 'no',
          authorizationUrl: 'https://example.com/auth',
          tokenUrl: 'https://example.com/token',
          scopes: { read: 'Read', write: 'Write' },
          refreshUrl: 'https://example.com/token',
        },
      },
      authStore: createMockAuthStore({
        oauth2: {
          type: 'oauth2',
          authorizationCode: {
            'x-scalar-secret-token': 'abc123',
          },
        },
      }),
      name: 'oauth2',
      eventBus,
    })

    expect(wrapper.text()).toContain('Access Token')
    expect(wrapper.text()).not.toContain('Authorize')

    // Clear button emits update:securityScheme with empty token
    const clearBtn = wrapper.findAll('button').find((b) => b.text() === 'Clear')
    expect(clearBtn, 'Clear button should exist').toBeTruthy()
    await clearBtn!.trigger('click')

    expect(fn).toHaveBeenCalledWith({
      name: 'oauth2',
      payload: {
        type: 'oauth2',
        authorizationCode: { 'x-scalar-secret-token': '' },
      },
    })

    // Updating the token input propagates via update:modelValue
    const tokenInput = wrapper.findComponent(RequestAuthDataTableInput)
    expect(tokenInput.exists()).toBe(true)
    tokenInput.vm.$emit('update:modelValue', 'xyz')
    await nextTick()

    expect(fn).toHaveBeenCalledWith({
      name: 'oauth2',
      payload: {
        type: 'oauth2',
        authorizationCode: { 'x-scalar-secret-token': 'xyz' },
      },
    })
  })

  it('renders configuration inputs without token and shows Authorize button', async () => {
    const eventBus = createWorkspaceEventBus()
    const fn = vi.fn()
    eventBus.on('auth:update:security-scheme', fn)

    const wrapper = mountWithProps({
      eventBus,
      authStore: createMockAuthStore({
        oauth2: {
          type: 'oauth2',
          authorizationCode: {
            'x-scalar-secret-token': '',
          },
        },
      }),
    })

    // Should render the Authorize action when no token present
    const authorizeBtn = wrapper.findAll('button').find((b) => b.text() === 'Authorize')
    expect(authorizeBtn, 'Authorize button should exist').toBeTruthy()

    // Emits for Auth URL
    const inputs = wrapper.findAllComponents(RequestAuthDataTableInput)
    expect(inputs.length).toBeGreaterThan(0)

    // First input corresponds to Auth URL in this configuration
    inputs[0]!.vm.$emit('update:modelValue', 'https://new-auth.test')
    await nextTick()

    expect(fn).toHaveBeenCalledWith({
      name: 'oauth2',
      payload: {
        type: 'oauth2',
        flows: {
          authorizationCode: { authorizationUrl: 'https://new-auth.test' },
        },
      },
    })

    // Second input corresponds to Token URL
    inputs[1]!.vm.$emit('update:modelValue', 'https://new-token.test')
    await nextTick()

    expect(fn).toHaveBeenCalledWith({
      name: 'oauth2',
      payload: {
        type: 'oauth2',
        flows: {
          authorizationCode: { tokenUrl: 'https://new-token.test' },
        },
      },
    })
  })

  it('re-emits selected scopes from child component', async () => {
    const wrapper = mountWithProps({
      selectedScopes: [],
      authStore: createMockAuthStore({
        oauth2: {
          type: 'oauth2',
          authorizationCode: {
            'x-scalar-secret-token': '',
          },
        },
      }),
    })

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

    const eventBus = createWorkspaceEventBus()
    const fn = vi.fn()
    eventBus.on('auth:update:security-scheme-secrets', fn)

    mountWithProps({
      flows: {
        authorizationCode: {
          authorizationUrl: 'https://example.com/auth',
          tokenUrl: 'https://example.com/token',
          refreshUrl: 'https://example.com/token',
          'x-usePkce': 'no',
          scopes: {},
        },
      },
      eventBus,
    })

    await nextTick()

    const expectedRedirectUri = originalOrigin + originalPathname

    expect(fn).toHaveBeenCalledWith({
      name: 'oauth2',
      payload: {
        type: 'oauth2',
        authorizationCode: {
          'x-scalar-secret-redirect-uri': expectedRedirectUri,
        },
      },
    })
  })
})
