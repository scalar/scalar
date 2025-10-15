import { mount } from '@vue/test-utils'
import { assert, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import RequestAuthDataTable from './RequestAuthDataTable.vue'

// Mock ResizeObserver
window.ResizeObserver =
  window.ResizeObserver ||
  vi.fn().mockImplementation(() => ({
    disconnect: vi.fn(),
    observe: vi.fn(),
    unobserve: vi.fn(),
  }))

describe('RequestAuthDataTable', () => {
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
  }

  const mountWithProps = (
    custom: Partial<{
      selectedSchemeOptions: any[]
      securitySchemes: any
      layout: 'client' | 'reference'
      environment: any
      envVariables: any[]
      server: any
    }> = {},
  ) => {
    const selectedSchemeOptions = custom.selectedSchemeOptions ?? [
      {
        id: 'bearer-auth',
        label: 'Bearer Auth',
        value: { BearerAuth: [] },
      },
    ]

    const securitySchemes = custom.securitySchemes ?? baseSecuritySchemes
    const layout = custom.layout ?? 'client'
    const environment = custom.environment ?? baseEnvironment
    const envVariables = custom.envVariables ?? []
    const server = custom.server ?? baseServer

    return mount(RequestAuthDataTable, {
      props: {
        selectedSchemeOptions,
        securitySchemes,
        layout,
        environment,
        envVariables,
        server,
      },
    })
  }

  describe('rendering', () => {
    it('renders with single auth scheme', () => {
      const wrapper = mountWithProps()

      expect(wrapper.find('form').exists()).toBe(true)
      expect(wrapper.find('[data-testid="auth-tabs"]').exists()).toBe(false)
      expect(wrapper.findComponent({ name: 'DataTable' }).exists()).toBe(true)
    })

    it('renders with multiple auth schemes', () => {
      const selectedSchemeOptions = [
        {
          id: 'bearer-auth',
          label: 'Bearer Auth',
          value: { BearerAuth: [] },
        },
        {
          id: 'api-key-auth',
          label: 'API Key Auth',
          value: { ApiKeyAuth: [] },
        },
      ]

      const wrapper = mountWithProps({ selectedSchemeOptions })

      expect(wrapper.find('form').exists()).toBe(true)
      const tabs = wrapper.find('[data-testid="auth-tabs"]')
      expect(tabs.exists()).toBe(true)
      expect(tabs.findAll('button').length).toBe(2)
    })

    it('renders no auth message when no schemes selected', () => {
      const wrapper = mountWithProps({ selectedSchemeOptions: [] })

      expect(wrapper.find('form').exists()).toBe(true)
      expect(wrapper.text()).toContain('No authentication selected')
    })
  })

  describe('tab switching', () => {
    it('switches between auth schemes when clicked', async () => {
      const selectedSchemeOptions = [
        {
          id: 'bearer-auth',
          label: 'Bearer Auth',
          value: { BearerAuth: [] },
        },
        {
          id: 'api-key-auth',
          label: 'API Key Auth',
          value: { ApiKeyAuth: [] },
        },
      ]

      const wrapper = mountWithProps({ selectedSchemeOptions })

      const tabs = wrapper.find('[data-testid="auth-tabs"]')
      expect(tabs.exists()).toBe(true)

      const buttons = tabs.findAll('button')
      expect(buttons.length).toBe(2)

      assert(buttons[0])
      assert(buttons[1])

      expect(buttons[0].text()).toBe('Bearer Auth')

      expect(wrapper.vm.activeAuthIndex).toBe(0)

      // Click second tab
      await buttons[1].trigger('click')
      await nextTick()

      expect(buttons[1].text()).toBe('API Key Auth')

      expect(wrapper.vm.activeAuthIndex).toBe(1)
    })

    it('shows active tab indicator', async () => {
      const selectedSchemeOptions = [
        {
          id: 'bearer-auth',
          label: 'Bearer Auth',
          value: { BearerAuth: [] },
        },
        {
          id: 'api-key-auth',
          label: 'API Key Auth',
          value: { ApiKeyAuth: [] },
        },
      ]

      const wrapper = mountWithProps({ selectedSchemeOptions })

      const buttons = wrapper.findAll('button')

      // First tab should have active indicator
      expect(wrapper.find('.absolute.inset-x-1').exists()).toBe(true)

      // Click second tab
      await buttons[1]?.trigger('click')
      await nextTick()

      // Active indicator should move to second tab
      const activeIndicators = wrapper.findAll('.absolute.inset-x-1')
      expect(activeIndicators.length).toBe(1)
    })
  })

  describe('active scheme computation', () => {
    it('returns correct active scheme', () => {
      const selectedSchemeOptions = [
        {
          id: 'bearer-auth',
          label: 'Bearer Auth',
          value: { BearerAuth: [] },
        },
        {
          id: 'api-key-auth',
          label: 'API Key Auth',
          value: { ApiKeyAuth: [] },
        },
      ]

      const wrapper = mountWithProps({ selectedSchemeOptions })
      const vm = wrapper.vm

      expect(vm.activeScheme).toEqual(selectedSchemeOptions[0])
    })

    it('updates active scheme when tab changes', async () => {
      const selectedSchemeOptions = [
        {
          id: 'bearer-auth',
          label: 'Bearer Auth',
          value: { BearerAuth: [] },
        },
        {
          id: 'api-key-auth',
          label: 'API Key Auth',
          value: { ApiKeyAuth: [] },
        },
      ]

      const wrapper = mountWithProps({ selectedSchemeOptions })
      const vm = wrapper.vm

      // Initially first scheme should be active
      expect(vm.activeScheme).toEqual(selectedSchemeOptions[0])

      // Change active index
      vm.activeAuthIndex = 1
      await nextTick()

      expect(vm.activeScheme).toEqual(selectedSchemeOptions[1])
    })
  })

  describe('scheme options watching', () => {
    it('adjusts active index when schemes change', async () => {
      const wrapper = mountWithProps({
        selectedSchemeOptions: [
          { label: 'Bearer Auth', value: { BearerAuth: [] } },
          { label: 'API Key Auth', value: { ApiKeyAuth: [] } },
        ],
      })

      const vm = wrapper.vm

      // Set active index to 1
      vm.activeAuthIndex = 1
      await nextTick()

      // Update props to remove the second scheme
      await wrapper.setProps({
        selectedSchemeOptions: [{ id: 'bearer-auth', label: 'Bearer Auth', value: { BearerAuth: [] } }],
      })

      // Active index should adjust to 0
      expect(vm.activeAuthIndex).toBe(0)
    })

    it('handles empty schemes array', async () => {
      const wrapper = mountWithProps({
        selectedSchemeOptions: [{ label: 'Bearer Auth', value: { BearerAuth: [] } }],
      })

      const vm = wrapper.vm

      // Set active index to 0
      vm.activeAuthIndex = 0
      await nextTick()

      // Update props to empty array
      await wrapper.setProps({
        selectedSchemeOptions: [],
      })

      // Active index should adjust to 0 (Math.max(0, 0-1) = 0)
      expect(vm.activeAuthIndex).toBe(0)
    })
  })

  describe('event emissions', () => {
    it('emits update:securityScheme event', async () => {
      const wrapper = mountWithProps()

      const requestAuthTab = wrapper.findComponent({ name: 'RequestAuthTab' })
      expect(requestAuthTab.exists()).toBe(true)

      // The component should pass through the event
      await requestAuthTab.vm?.$emit('update:securityScheme', {
        scheme: 'BearerAuth',
        value: 'test-token',
      })

      expect(wrapper.emitted('update:securityScheme')).toBeTruthy()
    })

    it('emits update:selectedScopes event', async () => {
      const wrapper = mountWithProps()

      const requestAuthTab = wrapper.findComponent({ name: 'RequestAuthTab' })
      expect(requestAuthTab.exists()).toBe(true)

      // The component should pass through the event
      await requestAuthTab.vm?.$emit('update:selectedScopes', {
        id: ['oauth2'],
        name: 'OAuth2',
        scopes: ['read', 'write'],
      })

      expect(wrapper.emitted('update:selectedScopes')).toBeTruthy()
    })
  })

  describe('props passing', () => {
    it('passes all required props to RequestAuthTab', () => {
      const envVariables = [{ key: 'API_KEY', value: 'test-key' }]

      const wrapper = mountWithProps({
        envVariables,
        layout: 'reference',
      })

      const requestAuthTab = wrapper.findComponent({ name: 'RequestAuthTab' })
      expect(requestAuthTab.exists()).toBe(true)

      const props = requestAuthTab.props()
      expect(props.envVariables).toEqual(envVariables)
      expect(props.environment).toEqual(baseEnvironment)
      expect(props.layout).toBe('reference')
      expect(props.securitySchemes).toEqual(baseSecuritySchemes)
      expect(props.server).toEqual(baseServer)
    })

    it('passes active scheme as selectedSecuritySchema', () => {
      const selectedSchemeOptions = [
        {
          id: 'bearer-auth',
          label: 'Bearer Auth',
          value: { BearerAuth: [] },
        },
      ]

      const wrapper = mountWithProps({ selectedSchemeOptions })

      const requestAuthTab = wrapper.findComponent({ name: 'RequestAuthTab' })
      const props = requestAuthTab.props()

      expect(props.selectedSecuritySchema).toEqual(selectedSchemeOptions[0]?.value)
    })
  })

  describe('edge cases', () => {
    it('handles single scheme without tabs', () => {
      const wrapper = mountWithProps({
        selectedSchemeOptions: [{ label: 'Bearer Auth', value: { BearerAuth: [] } }],
      })

      // Should not show tab navigation for single scheme
      expect(wrapper.find('[data-testid="auth-tabs"]').exists()).toBe(false)
      expect(wrapper.findComponent({ name: 'DataTable' }).exists()).toBe(true)
    })
  })
})
