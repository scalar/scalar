import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import AuthSelector from './AuthSelector.vue'

describe('AuthSelector', () => {
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

  const mountWithProps = (
    custom: Partial<{
      environment: any
      envVariables: any[]
      layout: 'client' | 'reference'
      security: any
      selectedSecurity: any
      securitySchemes: any
      server: any
      title: string
    }> = {},
  ) => {
    const environment = custom.environment ?? baseEnvironment
    const envVariables = custom.envVariables ?? []
    const layout = custom.layout ?? 'client'
    const security = custom.security ?? [{ BearerAuth: [] }]
    const selectedSecurity = custom.selectedSecurity ?? [{ BearerAuth: [] }]
    const securitySchemes = custom.securitySchemes ?? baseSecuritySchemes
    const server = custom.server ?? baseServer
    const title = custom.title ?? 'Authentication'

    return mount(AuthSelector, {
      props: {
        environment,
        envVariables,
        layout,
        security,
        selectedSecurity,
        securitySchemes,
        server,
        title,
      },
    })
  }

  describe('rendering', () => {
    it('renders with basic props', () => {
      const wrapper = mountWithProps()

      expect(wrapper.find('[data-testid="auth-selector"]').exists()).toBe(false) // No testid in component
      expect(wrapper.text()).toContain('Authentication')
      expect(wrapper.findComponent({ name: 'ViewLayoutCollapse' }).exists()).toBe(true)
    })

    it('renders with custom title', () => {
      const wrapper = mountWithProps({ title: 'Custom Auth Title' })

      expect(wrapper.text()).toContain('Custom Auth Title')
    })

    it('renders combobox for auth selection', () => {
      const wrapper = mountWithProps()

      const combobox = wrapper.findComponent({ name: 'ScalarComboboxMultiselect' })
      expect(combobox.exists()).toBe(true)
    })

    it('renders RequestAuthDataTable component', () => {
      const wrapper = mountWithProps()

      const dataTable = wrapper.findComponent({ name: 'RequestAuthDataTable' })
      expect(dataTable.exists()).toBe(true)
    })
  })

  describe('authentication indicator', () => {
    it('shows required indicator for required auth', () => {
      const wrapper = mountWithProps({
        security: [{ BearerAuth: [] }],
      })

      const vm = wrapper.vm
      expect(vm.authIndicator).toEqual({
        icon: 'Lock',
        text: 'Required',
      })
    })

    it('shows optional indicator for optional auth', () => {
      const wrapper = mountWithProps({
        security: [{ BearerAuth: [] }, {}],
      })

      const vm = wrapper.vm
      expect(vm.authIndicator).toEqual({
        icon: 'Unlock',
        text: 'Optional',
      })
    })

    it('shows required indicator for complex auth requirements', () => {
      const wrapper = mountWithProps({
        security: [{ BearerAuth: [], ApiKeyAuth: [] }],
      })

      const vm = wrapper.vm
      expect(vm.authIndicator).toEqual({
        icon: 'Lock',
        text: 'Required',
      })
    })

    it('returns null when no security requirements', () => {
      const wrapper = mountWithProps({
        security: [],
      })

      const vm = wrapper.vm
      expect(vm.authIndicator).toBeNull()
    })

    it('displays auth indicator in template when present', () => {
      const wrapper = mountWithProps({
        security: [{ BearerAuth: [] }],
      })

      const indicator = wrapper.find('[data-testid="auth-indicator"]')
      expect(indicator.exists()).toBe(true)
      expect(indicator.text()).toBe('Required')
    })
  })

  describe('selected scheme options computation', () => {
    it('computes selected scheme options from selectedSecurity', () => {
      const wrapper = mountWithProps({
        selectedSecurity: [{ BearerAuth: [] }],
        securitySchemes: baseSecuritySchemes,
      })

      const vm = wrapper.vm
      expect(vm.selectedSchemeOptions).toHaveLength(1)
      expect(vm.selectedSchemeOptions[0]).toMatchObject({
        label: expect.any(String),
        value: { BearerAuth: [] },
      })
    })

    it('handles multiple selected schemes', () => {
      const wrapper = mountWithProps({
        selectedSecurity: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
        securitySchemes: baseSecuritySchemes,
      })

      const vm = wrapper.vm
      expect(vm.selectedSchemeOptions).toHaveLength(2)
    })

    it('handles complex auth schemes', () => {
      const wrapper = mountWithProps({
        selectedSecurity: [{ BearerAuth: [], ApiKeyAuth: [] }],
        securitySchemes: baseSecuritySchemes,
      })

      const vm = wrapper.vm
      expect(vm.selectedSchemeOptions).toHaveLength(1) // Complex scheme is formatted as one option
      expect(vm.selectedSchemeOptions[0]?.label).toContain('BearerAuth & ApiKeyAuth')
    })

    it('returns empty array when no selected security', () => {
      const wrapper = mountWithProps({
        selectedSecurity: [],
      })

      const vm = wrapper.vm
      expect(vm.selectedSchemeOptions).toEqual([])
    })

    it('filters out undefined schemes', () => {
      const wrapper = mountWithProps({
        selectedSecurity: [{ BearerAuth: [] }, { NonExistentAuth: [] }],
        securitySchemes: baseSecuritySchemes,
      })

      const vm = wrapper.vm
      expect(vm.selectedSchemeOptions).toHaveLength(1)
    })
  })

  describe('scheme options computation', () => {
    it('computes scheme options from security and securitySchemes', () => {
      const wrapper = mountWithProps({
        security: [{ BearerAuth: [] }],
        securitySchemes: baseSecuritySchemes,
      })

      const vm = wrapper.vm
      expect(vm.schemeOptions).toBeDefined()
      expect(Array.isArray(vm.schemeOptions)).toBe(true)
    })

    it('handles empty security array', () => {
      const wrapper = mountWithProps({
        security: [],
        securitySchemes: baseSecuritySchemes,
      })

      const vm = wrapper.vm
      expect(vm.schemeOptions).toBeDefined()
    })
  })

  describe('combobox interactions', () => {
    it('updates selected auth when combobox selection changes', async () => {
      const wrapper = mountWithProps()

      const combobox = wrapper.findComponent({ name: 'ScalarComboboxMultiselect' })
      const newSelection = [
        {
          label: 'Bearer Auth',
          value: { BearerAuth: [] },
          payload: baseSecuritySchemes.BearerAuth,
        },
      ]

      await combobox.vm?.$emit('update:modelValue', newSelection)
      await nextTick()

      expect(wrapper.emitted('update:selectedSecurity')).toBeTruthy()
      expect(wrapper.emitted('update:selectedSecurity')?.[0]).toEqual([
        {
          value: [{ BearerAuth: [] }],
          create: [baseSecuritySchemes.BearerAuth],
        },
      ])
    })
  })

  describe('event emissions', () => {
    it('emits update:securityScheme event from RequestAuthDataTable', async () => {
      const wrapper = mountWithProps()

      const dataTable = wrapper.findComponent({ name: 'RequestAuthDataTable' })
      const eventData = {
        scheme: 'BearerAuth',
        value: 'test-token',
      }

      await dataTable.vm?.$emit('update:securityScheme', eventData)

      expect(wrapper.emitted('update:securityScheme')).toBeTruthy()
      expect(wrapper.emitted('update:securityScheme')?.[0]).toEqual([eventData])
    })

    it('emits update:selectedScopes event from RequestAuthDataTable', async () => {
      const wrapper = mountWithProps()

      const dataTable = wrapper.findComponent({ name: 'RequestAuthDataTable' })
      const eventData = {
        id: ['oauth2'],
        name: 'OAuth2',
        scopes: ['read', 'write'],
      }

      await dataTable.vm?.$emit('update:selectedScopes', eventData)

      expect(wrapper.emitted('update:selectedScopes')).toBeTruthy()
      expect(wrapper.emitted('update:selectedScopes')?.[0]).toEqual([eventData])
    })
  })

  describe('props passing', () => {
    it('passes all required props to RequestAuthDataTable', () => {
      const envVariables = [{ key: 'API_KEY', value: 'test-key' }]
      const wrapper = mountWithProps({
        envVariables,
        layout: 'reference',
        selectedSecurity: [{ BearerAuth: [] }],
      })

      const dataTable = wrapper.findComponent({ name: 'RequestAuthDataTable' })
      const props = dataTable.props()

      expect(props.envVariables).toEqual(envVariables)
      expect(props.environment).toEqual(baseEnvironment)
      expect(props.layout).toBe('reference')
      expect(props.securitySchemes).toEqual(baseSecuritySchemes)
      expect(props.server).toEqual(baseServer)
      expect(props.selectedSchemeOptions).toBeDefined()
    })

    it('passes selectedSchemeOptions to RequestAuthDataTable', () => {
      const wrapper = mountWithProps({
        selectedSecurity: [{ BearerAuth: [] }],
      })

      const dataTable = wrapper.findComponent({ name: 'RequestAuthDataTable' })
      const props = dataTable.props()

      expect(props.selectedSchemeOptions).toBeDefined()
      expect(Array.isArray(props.selectedSchemeOptions)).toBe(true)
    })
  })

  describe('combobox button display', () => {
    it('shows single auth type when one scheme selected', () => {
      const wrapper = mountWithProps({
        selectedSecurity: [{ BearerAuth: [] }],
        securitySchemes: baseSecuritySchemes,
      })

      const button = wrapper.findComponent({ name: 'ScalarButton' })
      expect(button.text()).toContain('BearerAuth')
    })

    it('shows "Multiple" when multiple schemes selected', () => {
      const wrapper = mountWithProps({
        selectedSecurity: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
        securitySchemes: baseSecuritySchemes,
      })

      const button = wrapper.findComponent({ name: 'ScalarButton' })
      expect(button.text()).toContain('Multiple')
    })

    it('shows "Auth Type" when no schemes selected', () => {
      const wrapper = mountWithProps({
        selectedSecurity: [],
      })

      const button = wrapper.findComponent({ name: 'ScalarButton' })
      expect(button.text()).toContain('Auth Type')
    })
  })
})
