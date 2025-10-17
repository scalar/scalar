// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import Authentication from './Authentication.vue'

// Mock ResizeObserver
window.ResizeObserver =
  window.ResizeObserver ||
  vi.fn().mockImplementation(() => ({
    disconnect: vi.fn(),
    observe: vi.fn(),
    unobserve: vi.fn(),
  }))

describe('Authentication', () => {
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

  const baseSecuritySchemes = {
    BearerAuth: {
      type: 'http',
      scheme: 'bearer',
    },
    ApiKeyAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'X-API-Key',
    },
    OAuth2Auth: {
      type: 'oauth2',
      flows: {
        authorizationCode: {
          authorizationUrl: 'https://example.com/oauth/authorize',
          tokenUrl: 'https://example.com/oauth/token',
          scopes: {
            read: 'Read access',
            write: 'Write access',
          },
        },
      },
    },
  }

  const baseSecurity = [{ BearerAuth: [] }]

  const mountWithProps = (
    custom: Partial<{
      useDocumentSecurity: boolean
      security: any
      selectedSecurity: any
      securitySchemes: any
      server: any
      environment: any
      envVariables: any[]
    }> = {},
  ) => {
    const useDocumentSecurity = custom.useDocumentSecurity ?? true
    const security = custom.security ?? baseSecurity
    const selectedSecurity = custom.selectedSecurity ?? baseSecurity
    const securitySchemes = custom.securitySchemes ?? baseSecuritySchemes
    const server = 'server' in custom ? custom.server : baseServer
    const environment = custom.environment ?? baseEnvironment
    const envVariables = custom.envVariables ?? []

    return mount(Authentication, {
      props: {
        useDocumentSecurity,
        security,
        selectedSecurity,
        securitySchemes,
        server,
        environment,
        envVariables,
      },
    })
  }

  describe('rendering', () => {
    it('renders the component', () => {
      const wrapper = mountWithProps()

      expect(wrapper.exists()).toBe(true)
    })

    it('renders the title "Authentication"', () => {
      const wrapper = mountWithProps()

      expect(wrapper.text()).toContain('Authentication')
    })

    it('renders the ScalarToggle component', () => {
      const wrapper = mountWithProps()

      const toggle = wrapper.findComponent({ name: 'ScalarToggle' })
      expect(toggle.exists()).toBe(true)
    })

    it('renders the description text', () => {
      const wrapper = mountWithProps()

      expect(wrapper.text()).toContain('Added authentication will apply to all requests under this collection.')
      expect(wrapper.text()).toContain('You can override this by specifying another one in the request.')
    })

    it('renders the AuthSelector component', () => {
      const wrapper = mountWithProps()

      const authSelector = wrapper.findComponent({ name: 'AuthSelector' })
      expect(authSelector.exists()).toBe(true)
    })
  })

  describe('toggle interaction', () => {
    it('passes useDocumentSecurity prop to ScalarToggle', () => {
      const wrapper = mountWithProps({ useDocumentSecurity: true })

      const toggle = wrapper.findComponent({ name: 'ScalarToggle' })
      expect(toggle.props('modelValue')).toBe(true)
    })

    it('passes false value to ScalarToggle when useDocumentSecurity is false', () => {
      const wrapper = mountWithProps({ useDocumentSecurity: false })

      const toggle = wrapper.findComponent({ name: 'ScalarToggle' })
      expect(toggle.props('modelValue')).toBe(false)
    })

    it('emits update:useDocumentSecurity when toggle is changed to true', async () => {
      const wrapper = mountWithProps({ useDocumentSecurity: false })

      const toggle = wrapper.findComponent({ name: 'ScalarToggle' })
      await toggle.vm.$emit('update:modelValue', true)
      await nextTick()

      expect(wrapper.emitted('update:useDocumentSecurity')).toBeTruthy()
      expect(wrapper.emitted('update:useDocumentSecurity')?.[0]).toEqual([true])
    })

    it('emits update:useDocumentSecurity when toggle is changed to false', async () => {
      const wrapper = mountWithProps({ useDocumentSecurity: true })

      const toggle = wrapper.findComponent({ name: 'ScalarToggle' })
      await toggle.vm.$emit('update:modelValue', false)
      await nextTick()

      expect(wrapper.emitted('update:useDocumentSecurity')).toBeTruthy()
      expect(wrapper.emitted('update:useDocumentSecurity')?.[0]).toEqual([false])
    })
  })

  describe('AuthSelector props', () => {
    it('passes all required props to AuthSelector', () => {
      const envVariables = [{ key: 'API_KEY', value: 'test-key' }]
      const wrapper = mountWithProps({ envVariables })

      const authSelector = wrapper.findComponent({ name: 'AuthSelector' })
      const props = authSelector.props()

      expect(props.envVariables).toEqual(envVariables)
      expect(props.environment).toEqual(baseEnvironment)
      expect(props.layout).toBe('client')
      expect(props.security).toEqual(baseSecurity)
      expect(props.securitySchemes).toEqual(baseSecuritySchemes)
      expect(props.selectedSecurity).toEqual(baseSecurity)
      expect(props.server).toEqual(baseServer)
      expect(props.title).toBe('Authentication')
    })

    it('passes layout as "client" to AuthSelector', () => {
      const wrapper = mountWithProps()

      const authSelector = wrapper.findComponent({ name: 'AuthSelector' })
      expect(authSelector.props('layout')).toBe('client')
    })

    it('passes custom security schemes to AuthSelector', () => {
      const customSchemes = {
        CustomAuth: {
          type: 'http',
          scheme: 'basic',
        },
      }
      const wrapper = mountWithProps({ securitySchemes: customSchemes })

      const authSelector = wrapper.findComponent({ name: 'AuthSelector' })
      expect(authSelector.props('securitySchemes')).toEqual(customSchemes)
    })

    it('passes empty envVariables array to AuthSelector', () => {
      const wrapper = mountWithProps({ envVariables: [] })

      const authSelector = wrapper.findComponent({ name: 'AuthSelector' })
      expect(authSelector.props('envVariables')).toEqual([])
    })
  })

  describe('AuthSelector event forwarding', () => {
    it('forwards deleteOperationAuth event from AuthSelector', async () => {
      const wrapper = mountWithProps()

      const authSelector = wrapper.findComponent({ name: 'AuthSelector' })
      const names = ['BearerAuth', 'ApiKeyAuth']

      await authSelector.vm.$emit('deleteOperationAuth', names)

      expect(wrapper.emitted('deleteOperationAuth')).toBeTruthy()
      expect(wrapper.emitted('deleteOperationAuth')?.[0]).toEqual([names])
    })

    it('forwards update:securityScheme event from AuthSelector', async () => {
      const wrapper = mountWithProps()

      const authSelector = wrapper.findComponent({ name: 'AuthSelector' })
      const payload = {
        scheme: 'BearerAuth',
        value: 'test-token-123',
      }

      await authSelector.vm.$emit('update:securityScheme', payload)

      expect(wrapper.emitted('update:securityScheme')).toBeTruthy()
      expect(wrapper.emitted('update:securityScheme')?.[0]).toEqual([payload])
    })

    it('forwards update:selectedScopes event from AuthSelector', async () => {
      const wrapper = mountWithProps()

      const authSelector = wrapper.findComponent({ name: 'AuthSelector' })
      const payload = {
        id: ['oauth2-auth'],
        name: 'OAuth2Auth',
        scopes: ['read', 'write'],
      }

      await authSelector.vm.$emit('update:selectedScopes', payload)

      expect(wrapper.emitted('update:selectedScopes')).toBeTruthy()
      expect(wrapper.emitted('update:selectedScopes')?.[0]).toEqual([payload])
    })

    it('forwards update:selectedSecurity event from AuthSelector', async () => {
      const wrapper = mountWithProps()

      const authSelector = wrapper.findComponent({ name: 'AuthSelector' })
      const payload = {
        value: [{ BearerAuth: [] }],
        create: [baseSecuritySchemes.BearerAuth],
      }

      await authSelector.vm.$emit('update:selectedSecurity', payload)

      expect(wrapper.emitted('update:selectedSecurity')).toBeTruthy()
      expect(wrapper.emitted('update:selectedSecurity')?.[0]).toEqual([payload])
    })
  })

  describe('multiple event emissions', () => {
    it('emits multiple toggle events in sequence', async () => {
      const wrapper = mountWithProps({ useDocumentSecurity: false })

      const toggle = wrapper.findComponent({ name: 'ScalarToggle' })

      await toggle.vm.$emit('update:modelValue', true)
      await nextTick()
      await toggle.vm.$emit('update:modelValue', false)
      await nextTick()
      await toggle.vm.$emit('update:modelValue', true)
      await nextTick()

      expect(wrapper.emitted('update:useDocumentSecurity')).toHaveLength(3)
      expect(wrapper.emitted('update:useDocumentSecurity')?.[0]).toEqual([true])
      expect(wrapper.emitted('update:useDocumentSecurity')?.[1]).toEqual([false])
      expect(wrapper.emitted('update:useDocumentSecurity')?.[2]).toEqual([true])
    })

    it('handles multiple AuthSelector events independently', async () => {
      const wrapper = mountWithProps()

      const authSelector = wrapper.findComponent({ name: 'AuthSelector' })

      await authSelector.vm.$emit('deleteOperationAuth', ['Auth1'])
      await authSelector.vm.$emit('update:securityScheme', { scheme: 'test' })
      await authSelector.vm.$emit('update:selectedScopes', {
        id: ['1'],
        name: 'test',
        scopes: [],
      })

      expect(wrapper.emitted('deleteOperationAuth')).toBeTruthy()
      expect(wrapper.emitted('update:securityScheme')).toBeTruthy()
      expect(wrapper.emitted('update:selectedScopes')).toBeTruthy()
    })
  })

  describe('props validation', () => {
    it('accepts different environment configurations', () => {
      const customEnvironment = {
        uid: 'custom-env',
        name: 'Custom Environment',
        color: '#FF5733',
        value: 'custom',
        isDefault: false,
      }
      const wrapper = mountWithProps({ environment: customEnvironment })

      const authSelector = wrapper.findComponent({ name: 'AuthSelector' })
      expect(authSelector.props('environment')).toEqual(customEnvironment)
    })

    it('accepts all security scheme types', () => {
      const allSchemeTypes = {
        BasicAuth: { type: 'http', scheme: 'basic' },
        BearerAuth: { type: 'http', scheme: 'bearer' },
        ApiKeyAuth: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
        OAuth2Auth: {
          type: 'oauth2',
          flows: {
            implicit: {
              authorizationUrl: 'https://example.com/oauth/authorize',
              scopes: { read: 'Read' },
            },
          },
        },
        OpenIdAuth: {
          type: 'openIdConnect',
          openIdConnectUrl: 'https://example.com/.well-known/openid-configuration',
        },
      }
      const wrapper = mountWithProps({ securitySchemes: allSchemeTypes as any })

      const authSelector = wrapper.findComponent({ name: 'AuthSelector' })
      expect(authSelector.props('securitySchemes')).toEqual(allSchemeTypes)
    })

    it('handles mismatched security and selectedSecurity', () => {
      const wrapper = mountWithProps({
        security: [{ BearerAuth: [] }],
        selectedSecurity: [{ ApiKeyAuth: [] }],
      })

      const authSelector = wrapper.findComponent({ name: 'AuthSelector' })
      expect(authSelector.props('security')).toEqual([{ BearerAuth: [] }])
      expect(authSelector.props('selectedSecurity')).toEqual([{ ApiKeyAuth: [] }])
    })
  })
})
