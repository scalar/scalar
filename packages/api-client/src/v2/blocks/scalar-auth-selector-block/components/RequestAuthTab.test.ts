import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { mount } from '@vue/test-utils'
import { assert, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import OAuth2 from '@/v2/blocks/scalar-auth-selector-block/components/OAuth2.vue'
import RequestAuthDataTableInput from '@/v2/blocks/scalar-auth-selector-block/components/RequestAuthDataTableInput.vue'
import RequestAuthTab from '@/v2/blocks/scalar-auth-selector-block/components/RequestAuthTab.vue'

describe('RequestAuthTab', () => {
  const baseEnvironment = {
    uid: 'env-1' as any,
    name: 'Default',
    color: '#FFFFFF',
    value: '',
    isDefault: true,
  }

  const baseServer = {
    url: 'https://api.example.com',
    description: 'Test server',
  }

  const eventBus = createWorkspaceEventBus()

  const mountWithProps = (
    custom: Partial<{
      selectedSecuritySchemas: any
      securitySchemes: any
      isStatic: boolean
      environment: any
      server: any
      proxyUrl: string
    }> = {},
  ) => {
    const selectedSecuritySchemas = custom.selectedSecuritySchemas ?? {
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
        proxyUrl: custom.proxyUrl ?? '',
        environment: custom.environment ?? baseEnvironment,
        isStatic: custom.isStatic ?? true,
        selectedSecuritySchemas,
        securitySchemes,
        eventBus,
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

    it('emits auth:update:security-scheme-secrets when Bearer token is updated', () => {
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
      const emitted = vi.fn()
      eventBus.on('auth:update:security-scheme-secrets', emitted)
      input.vm.$emit('update:modelValue', 'new-token-123')

      expect(emitted).toHaveBeenCalledTimes(1)
      expect(emitted).toHaveBeenCalledWith({
        payload: {
          type: 'http',
          'x-scalar-secret-token': 'new-token-123',
        },
        name: 'BearerAuth',
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
        selectedSecuritySchemas: {
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

    it('emits auth:update:security-scheme-secrets when username is updated', () => {
      const wrapper = mountWithProps({
        securitySchemes: {
          'BasicAuth': {
            type: 'http',
            scheme: 'basic',
            'x-scalar-secret-username': '',
            'x-scalar-secret-password': '',
          },
        },
        selectedSecuritySchemas: {
          'BasicAuth': [],
        },
      })

      const inputs = wrapper.findAllComponents(RequestAuthDataTableInput)
      assert(inputs[0])
      const emitted = vi.fn()
      eventBus.on('auth:update:security-scheme-secrets', emitted)
      inputs[0].vm.$emit('update:modelValue', 'testuser')

      expect(emitted).toHaveBeenCalledTimes(1)
      expect(emitted).toHaveBeenCalledWith({
        payload: {
          type: 'http',
          'x-scalar-secret-username': 'testuser',
        },
        name: 'BasicAuth',
      })
    })

    it('emits auth:update:security-scheme-secrets when password is updated', () => {
      const wrapper = mountWithProps({
        securitySchemes: {
          'BasicAuth': {
            type: 'http',
            scheme: 'basic',
            'x-scalar-secret-username': '',
            'x-scalar-secret-password': '',
          },
        },
        selectedSecuritySchemas: {
          'BasicAuth': [],
        },
      })

      const inputs = wrapper.findAllComponents(RequestAuthDataTableInput)
      assert(inputs[1])
      const emitted = vi.fn()
      eventBus.on('auth:update:security-scheme-secrets', emitted)
      inputs[1].vm.$emit('update:modelValue', 'testpass')

      expect(emitted).toHaveBeenCalledTimes(1)
      expect(emitted).toHaveBeenCalledWith({
        payload: {
          type: 'http',
          'x-scalar-secret-password': 'testpass',
        },
        name: 'BasicAuth',
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
        selectedSecuritySchemas: {
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

    it('emits auth:update:security-scheme when API key name is updated', () => {
      const wrapper = mountWithProps({
        securitySchemes: {
          'ApiKeyAuth': {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key',
            'x-scalar-secret-token': '',
          },
        },
        selectedSecuritySchemas: {
          'ApiKeyAuth': [],
        },
      })

      const inputs = wrapper.findAllComponents(RequestAuthDataTableInput)
      assert(inputs[0])
      const emitted = vi.fn()
      eventBus.on('auth:update:security-scheme', emitted)
      inputs[0].vm.$emit('update:modelValue', 'X-Custom-Key')

      expect(emitted).toHaveBeenCalledTimes(1)
      expect(emitted).toHaveBeenCalledWith({
        payload: {
          type: 'apiKey',
          name: 'X-Custom-Key',
        },
        name: 'ApiKeyAuth',
      })
    })

    it('emits auth:update:security-scheme-secrets when API key value is updated', () => {
      const wrapper = mountWithProps({
        securitySchemes: {
          'ApiKeyAuth': {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key',
            'x-scalar-secret-token': '',
          },
        },
        selectedSecuritySchemas: {
          'ApiKeyAuth': [],
        },
      })

      const inputs = wrapper.findAllComponents(RequestAuthDataTableInput)
      assert(inputs[1])
      const emitted = vi.fn()
      eventBus.on('auth:update:security-scheme-secrets', emitted)
      inputs[1].vm.$emit('update:modelValue', 'secret-key-value')

      expect(emitted).toHaveBeenCalledTimes(1)
      expect(emitted).toHaveBeenCalledWith({
        payload: {
          type: 'apiKey',
          'x-scalar-secret-token': 'secret-key-value',
        },
        name: 'ApiKeyAuth',
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
        selectedSecuritySchemas: {
          'OAuth2': [],
        },
      })

      const oauth2Component = wrapper.findComponent(OAuth2)
      expect(oauth2Component.exists()).toBe(true)
    })

    it('passes proxyUrl to OAuth2 component', () => {
      const wrapper = mountWithProps({
        proxyUrl: 'https://proxy.example.com',
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
        selectedSecuritySchemas: {
          'OAuth2': [],
        },
      })

      const oauth2Component = wrapper.findComponent(OAuth2)
      expect(oauth2Component.exists()).toBe(true)
      expect(oauth2Component.props('proxyUrl')).toBe('https://proxy.example.com')
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
        selectedSecuritySchemas: {
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
        selectedSecuritySchemas: {
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
        selectedSecuritySchemas: {
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
        selectedSecuritySchemas: {
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
        selectedSecuritySchemas: {
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
        selectedSecuritySchemas: {
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
