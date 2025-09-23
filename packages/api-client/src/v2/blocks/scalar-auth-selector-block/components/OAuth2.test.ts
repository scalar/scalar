import type { OAuthFlowsObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
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
          'x-scalar-secret-redirect-uri': 'https://example.com/cb',
          'x-scalar-secret-token': '',
          'x-usePkce': 'no',
          scopes: { read: 'Read', write: 'Write' },
          'x-scalar-secret-client-id': '',
          'x-scalar-secret-client-secret': '',
        },
      } satisfies OAuthFlowsObject)

    return mount(OAuth2, {
      attachTo: document.body,
      props: {
        environment: baseEnv as any,
        envVariables: [],
        flows,
        type: (custom.type ?? 'authorizationCode') as any,
        selectedScopes: custom.selectedScopes ?? [],
        server: custom.server,
        proxyUrl: custom.proxyUrl ?? '',
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

    // Clear button emits update:securityScheme with empty token
    const clearBtn = wrapper.findAll('button').find((b) => b.text() === 'Clear')
    expect(clearBtn, 'Clear button should exist').toBeTruthy()
    await clearBtn!.trigger('click')

    const clearEmit = wrapper.emitted('update:securityScheme')?.at(-1)?.[0] as any
    expect(clearEmit).toEqual({ token: '' })

    // Updating the token input propagates via update:modelValue
    const tokenInput = wrapper.findComponent(RequestAuthDataTableInput)
    expect(tokenInput.exists()).toBe(true)
    tokenInput.vm.$emit('update:modelValue', 'xyz')
    await nextTick()

    const updateEmit = wrapper.emitted('update:securityScheme')?.at(-1)?.[0] as any
    expect(updateEmit).toEqual({ token: 'xyz' })
  })

  it('renders configuration inputs without token and shows Authorize button', async () => {
    const wrapper = mountWithProps()

    // Should render the Authorize action when no token present
    const authorizeBtn = wrapper.findAll('button').find((b) => b.text() === 'Authorize')
    expect(authorizeBtn, 'Authorize button should exist').toBeTruthy()

    // Emits for Auth URL
    const inputs = wrapper.findAllComponents(RequestAuthDataTableInput)
    expect(inputs.length).toBeGreaterThan(0)

    // First input corresponds to Auth URL in this configuration
    inputs[0]!.vm.$emit('update:modelValue', 'https://new-auth.test')
    await nextTick()
    const authUrlEmit = wrapper.emitted('update:securityScheme')?.at(-1)?.[0] as any
    expect(authUrlEmit).toEqual({ authUrl: 'https://new-auth.test' })

    // Second input corresponds to Token URL
    inputs[1]!.vm.$emit('update:modelValue', 'https://new-token.test')
    await nextTick()
    const tokenUrlEmit = wrapper.emitted('update:securityScheme')?.at(-1)?.[0] as any
    expect(tokenUrlEmit).toEqual({ tokenUrl: 'https://new-token.test' })
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
})
