import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import Authentication from './Authentication.vue'

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
    const selectedSecurity = custom.selectedSecurity ?? {
      'x-selected-index': 0,
      'x-schemes': baseSecurity,
    }
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
        eventBus: createWorkspaceEventBus(),
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
      expect(props.selectedSecurity).toEqual({
        'x-selected-index': 0,
        'x-schemes': baseSecurity,
      })
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
        selectedSecurity: {
          'x-selected-index': 0,
          'x-schemes': [{ ApiKeyAuth: [] }],
        },
      })

      const authSelector = wrapper.findComponent({ name: 'AuthSelector' })
      expect(authSelector.props('security')).toEqual([{ BearerAuth: [] }])
      expect(authSelector.props('selectedSecurity')).toEqual({
        'x-selected-index': 0,
        'x-schemes': [{ ApiKeyAuth: [] }],
      })
    })
  })
})
