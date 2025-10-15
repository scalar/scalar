import { mount } from '@vue/test-utils'
import { assert, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import OAuth2 from '@/v2/blocks/scalar-auth-selector-block/components/OAuth2.vue'
import RequestAuthDataTableInput from '@/v2/blocks/scalar-auth-selector-block/components/RequestAuthDataTableInput.vue'
import RequestAuthTab from '@/v2/blocks/scalar-auth-selector-block/components/RequestAuthTab.vue'

window.ResizeObserver =
  window.ResizeObserver ||
  vi.fn().mockImplementation(() => ({
    disconnect: vi.fn(),
    observe: vi.fn(),
    unobserve: vi.fn(),
  }))

describe('RequestAuthTab', () => {
  const baseEnvironment = {
    uid: 'env-1',
    name: 'Default',
    color: '#FFFFFF',
    value: '',
    isDefault: true,
  }

  const baseServer = {
    url: 'https://api.example.com',
    description: 'Test server',
  }

  const mountWithProps = (
    custom: Partial<{
      selectedSecuritySchema: any
      securitySchemes: any
      layout: 'client' | 'reference'
      environment: any
      envVariables: any[]
      server: any
    }> = {},
  ) => {
    const selectedSecuritySchema = custom.selectedSecuritySchema ?? {
      'BearerAuth': [],
    }

    const securitySchemes = custom.securitySchemes ?? {
      'BearerAuth': {
        type: 'http',
        scheme: 'bearer',
        description: 'Bearer token authentication',
        'x-scalar-secret-token': '',
      },
    }

    return mount(RequestAuthTab, {
      attachTo: document.body,
      props: {
        environment: custom.environment ?? baseEnvironment,
        envVariables: custom.envVariables ?? [],
        layout: custom.layout ?? 'client',
        selectedSecuritySchema,
        securitySchemes,
        server: custom.server ?? baseServer,
      },
    })
  }

  describe('HTTP Bearer Authentication', () => {
    it('renders Bearer token input when scheme type is http and scheme is bearer', () => {
      const wrapper = mountWithProps({
        securitySchemes: {
          'BearerAuth': {
            type: 'http',
            scheme: 'bearer',
            description: 'Bearer token authentication',
            'x-scalar-secret-token': '',
          },
        },
      })

      const input = wrapper.findComponent(RequestAuthDataTableInput)
      expect(input.exists()).toBe(true)
      expect(input.props('type')).toBe('password')
      expect(input.text()).toContain('Bearer Token')
    })

    it('emits update:securityScheme when Bearer token is updated', async () => {
      const wrapper = mountWithProps({
        securitySchemes: {
          'BearerAuth': {
            type: 'http',
            scheme: 'bearer',
            'x-scalar-secret-token': '',
          },
        },
      })

      const input = wrapper.findComponent(RequestAuthDataTableInput)
      input.vm.$emit('update:modelValue', 'new-token-123')
      await nextTick()

      const emitted = wrapper.emitted('update:securityScheme')
      expect(emitted).toBeTruthy()
      expect(emitted![0]![0]).toEqual({
        type: 'http',
        payload: { token: 'new-token-123' },
      })
    })

    it('displays existing Bearer token value', () => {
      const wrapper = mountWithProps({
        securitySchemes: {
          'BearerAuth': {
            type: 'http',
            scheme: 'bearer',
            'x-scalar-secret-token': 'existing-token-456',
          },
        },
      })

      const input = wrapper.findComponent(RequestAuthDataTableInput)
      expect(input.props('modelValue')).toBe('existing-token-456')
    })
  })

  describe('HTTP Basic Authentication', () => {
    it('renders username and password inputs when scheme type is http and scheme is basic', () => {
      const wrapper = mountWithProps({
        securitySchemes: {
          'BasicAuth': {
            type: 'http',
            scheme: 'basic',
            description: 'Basic authentication',
            'x-scalar-secret-username': '',
            'x-scalar-secret-password': '',
          },
        },
        selectedSecuritySchema: {
          'BasicAuth': [],
        },
      })

      const inputs = wrapper.findAllComponents(RequestAuthDataTableInput)
      expect(inputs).toHaveLength(2)

      // Username input
      assert(inputs[0])
      expect(inputs[0].props('required')).toBe(true)
      expect(inputs[0].text()).toContain('Username')

      // Password input
      assert(inputs[1])
      expect(inputs[1].props('type')).toBe('password')
      expect(inputs[1].text()).toContain('Password')
    })

    it('emits update:securityScheme when username is updated', async () => {
      const wrapper = mountWithProps({
        securitySchemes: {
          'BasicAuth': {
            type: 'http',
            scheme: 'basic',
            'x-scalar-secret-username': '',
            'x-scalar-secret-password': '',
          },
        },
        selectedSecuritySchema: {
          'BasicAuth': [],
        },
      })

      const inputs = wrapper.findAllComponents(RequestAuthDataTableInput)
      assert(inputs[0])
      inputs[0].vm.$emit('update:modelValue', 'testuser')
      await nextTick()

      const emitted = wrapper.emitted('update:securityScheme')
      assert(emitted)
      assert(emitted[0])
      expect(emitted[0][0]).toEqual({
        type: 'http',
        payload: { username: 'testuser' },
      })
    })

    it('emits update:securityScheme when password is updated', async () => {
      const wrapper = mountWithProps({
        securitySchemes: {
          'BasicAuth': {
            type: 'http',
            scheme: 'basic',
            'x-scalar-secret-username': '',
            'x-scalar-secret-password': '',
          },
        },
        selectedSecuritySchema: {
          'BasicAuth': [],
        },
      })

      const inputs = wrapper.findAllComponents(RequestAuthDataTableInput)
      assert(inputs[1])
      inputs[1].vm.$emit('update:modelValue', 'testpass')
      await nextTick()

      const emitted = wrapper.emitted('update:securityScheme')
      assert(emitted)
      assert(emitted[0])
      expect(emitted[0][0]).toEqual({
        type: 'http',
        payload: { password: 'testpass' },
      })
    })
  })

  describe('API Key Authentication', () => {
    it('renders name and value inputs when scheme type is apiKey', () => {
      const wrapper = mountWithProps({
        securitySchemes: {
          'ApiKeyAuth': {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key',
            description: 'API Key authentication',
            'x-scalar-secret-token': '',
          },
        },
        selectedSecuritySchema: {
          'ApiKeyAuth': [],
        },
      })

      const inputs = wrapper.findAllComponents(RequestAuthDataTableInput)
      expect(inputs).toHaveLength(2)

      // Name input
      assert(inputs[0])
      expect(inputs[0].text()).toContain('Name')

      // Value input
      assert(inputs[1])
      expect(inputs[1].props('type')).toBe('password')
      expect(inputs[1].text()).toContain('Value')
    })

    it('emits update:securityScheme when API key name is updated', async () => {
      const wrapper = mountWithProps({
        securitySchemes: {
          'ApiKeyAuth': {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key',
            'x-scalar-secret-token': '',
          },
        },
        selectedSecuritySchema: {
          'ApiKeyAuth': [],
        },
      })

      const inputs = wrapper.findAllComponents(RequestAuthDataTableInput)
      assert(inputs[0])
      inputs[0].vm.$emit('update:modelValue', 'X-Custom-Key')
      await nextTick()

      const emitted = wrapper.emitted('update:securityScheme')
      assert(emitted)
      assert(emitted[0])
      expect(emitted[0][0]).toEqual({
        type: 'apiKey',
        payload: { name: 'X-Custom-Key' },
      })
    })

    it('emits update:securityScheme when API key value is updated', async () => {
      const wrapper = mountWithProps({
        securitySchemes: {
          'ApiKeyAuth': {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key',
            'x-scalar-secret-token': '',
          },
        },
        selectedSecuritySchema: {
          'ApiKeyAuth': [],
        },
      })

      const inputs = wrapper.findAllComponents(RequestAuthDataTableInput)
      assert(inputs[1])
      inputs[1].vm.$emit('update:modelValue', 'secret-key-value')
      await nextTick()

      const emitted = wrapper.emitted('update:securityScheme')
      assert(emitted)
      assert(emitted[0])
      expect(emitted[0][0]).toEqual({
        type: 'apiKey',
        payload: { value: 'secret-key-value' },
      })
    })
  })

  describe('OAuth2 Authentication', () => {
    it('renders OAuth2 component when scheme type is oauth2', () => {
      const wrapper = mountWithProps({
        securitySchemes: {
          'OAuth2': {
            type: 'oauth2',
            flows: {
              authorizationCode: {
                authorizationUrl: 'https://example.com/auth',
                tokenUrl: 'https://example.com/token',
                scopes: { read: 'Read', write: 'Write' },
              },
            },
            description: 'OAuth2 authentication',
          },
        },
        selectedSecuritySchema: {
          'OAuth2': [],
        },
      })

      const oauth2Component = wrapper.findComponent(OAuth2)
      expect(oauth2Component.exists()).toBe(true)
    })

    it('emits update:securityScheme when OAuth2 component emits update:securityScheme', async () => {
      const wrapper = mountWithProps({
        securitySchemes: {
          'OAuth2': {
            type: 'oauth2',
            flows: {
              authorizationCode: {
                authorizationUrl: 'https://example.com/auth',
                tokenUrl: 'https://example.com/token',
                scopes: { read: 'Read', write: 'Write' },
              },
            },
          },
        },
        selectedSecuritySchema: {
          'OAuth2': [],
        },
      })

      const oauth2Component = wrapper.findComponent(OAuth2)
      oauth2Component.vm.$emit('update:securityScheme', { token: 'oauth-token' })
      await nextTick()

      const emitted = wrapper.emitted('update:securityScheme')
      assert(emitted)
      assert(emitted[0])
      expect(emitted[0][0]).toEqual({
        type: 'oauth2',
        flow: 'authorizationCode',
        payload: { token: 'oauth-token' },
      })
    })

    it('emits update:selectedScopes when OAuth2 component emits update:selectedScopes', async () => {
      const wrapper = mountWithProps({
        securitySchemes: {
          'OAuth2': {
            type: 'oauth2',
            flows: {
              authorizationCode: {
                authorizationUrl: 'https://example.com/auth',
                tokenUrl: 'https://example.com/token',
                scopes: { read: 'Read', write: 'Write' },
              },
            },
          },
        },
        selectedSecuritySchema: {
          'OAuth2': [],
        },
      })

      const oauth2Component = wrapper.findComponent(OAuth2)
      oauth2Component.vm.$emit('update:selectedScopes', { scopes: ['read'] })
      await nextTick()

      const emitted = wrapper.emitted('update:selectedScopes')
      assert(emitted)
      assert(emitted[0])
      expect(emitted![0][0]).toEqual({
        id: ['OAuth2'],
        name: 'OAuth2',
        scopes: ['read'],
      })
    })
  })

  describe('OpenID Connect Authentication', () => {
    it('renders "Coming soon" message when scheme type is openIdConnect', () => {
      const wrapper = mountWithProps({
        securitySchemes: {
          'OpenIDConnect': {
            type: 'openIdConnect',
            openIdConnectUrl: 'https://example.com/.well-known/openid_configuration',
            description: 'OpenID Connect authentication',
          },
        },
        selectedSecuritySchema: {
          'OpenIDConnect': [],
        },
      })

      expect(wrapper.text()).toContain('Coming soon')
    })
  })

  describe('shows correct description', () => {
    it('show correct description for HTTP Bearer scheme', () => {
      const wrapper = mountWithProps({
        securitySchemes: {
          'BearerAuth': {
            type: 'http',
            scheme: 'bearer',
            description: 'Bearer token authentication',
          },
        },
        selectedSecuritySchema: {
          'BearerAuth': [],
        },
      })

      expect(wrapper.text()).toContain('Bearer token authentication')
    })

    it('show correct description for API Key scheme', () => {
      const wrapper = mountWithProps({
        securitySchemes: {
          'ApiKeyAuth': {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key',
            description: 'API Key authentication',
          },
        },
        selectedSecuritySchema: {
          'ApiKeyAuth': [],
        },
      })

      expect(wrapper.text()).toContain('API Key authentication')
    })

    it('show correct label for OAuth2 scheme', () => {
      const wrapper = mountWithProps({
        securitySchemes: {
          'OAuth2': {
            type: 'oauth2',
            flows: {
              authorizationCode: {
                authorizationUrl: 'https://example.com/auth',
                tokenUrl: 'https://example.com/token',
                scopes: { read: 'Read', write: 'Write' },
              },
            },
            description: 'OAuth2 authentication',
          },
        },
        selectedSecuritySchema: {
          'OAuth2': [],
        },
      })

      expect(wrapper.text()).toContain('OAuth2 authentication')
    })
  })

  describe('Multiple Security Schemes', () => {
    it('renders multiple security schemes when multiple are selected', () => {
      const wrapper = mountWithProps({
        securitySchemes: {
          'BearerAuth': {
            type: 'http',
            scheme: 'bearer',
            description: 'Bearer token authentication',
          },
          'ApiKeyAuth': {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key',
            description: 'API Key authentication',
          },
        },
        selectedSecuritySchema: {
          'BearerAuth': [],
          'ApiKeyAuth': [],
        },
      })

      // Should show headers for multiple schemes
      expect(wrapper.text()).toContain('BearerAuth: bearer')
      expect(wrapper.text()).toContain('ApiKeyAuth: API Key authentication')
    })
  })
})
