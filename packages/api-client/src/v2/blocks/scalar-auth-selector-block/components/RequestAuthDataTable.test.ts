import { type AuthMeta, type WorkspaceEventBus, createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { mount } from '@vue/test-utils'
import { assert, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import RequestAuthDataTable from './RequestAuthDataTable.vue'

describe('RequestAuthDataTable', () => {
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
      isStatic: boolean
      environment: any
      server: any
      activeAuthIndex: number
      eventBus: WorkspaceEventBus
      meta: AuthMeta
      proxyUrl: string
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
    const isStatic = custom.isStatic ?? true
    const environment = custom.environment ?? baseEnvironment
    const server = custom.server ?? baseServer
    const activeAuthIndex = custom.activeAuthIndex ?? 0
    const eventBus = custom.eventBus ?? createWorkspaceEventBus()
    const meta = custom.meta ?? { type: 'document' }
    const proxyUrl = custom.proxyUrl ?? ''

    return mount(RequestAuthDataTable, {
      props: {
        proxyUrl,
        selectedSchemeOptions,
        securitySchemes,
        isStatic,
        environment,
        server,
        activeAuthIndex,
        eventBus,
        meta,
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

      const eventBus = createWorkspaceEventBus()
      const fn = vi.fn()
      eventBus.on('auth:update:active-index', fn)

      const wrapper = mountWithProps({ selectedSchemeOptions, eventBus })

      const tabs = wrapper.find('[data-testid="auth-tabs"]')
      expect(tabs.exists()).toBe(true)

      const buttons = tabs.findAll('button')
      expect(buttons.length).toBe(2)

      assert(buttons[0])
      assert(buttons[1])

      // Click second tab
      expect(buttons[1].text()).toBe('API Key Auth')
      await buttons[1].trigger('click')
      await nextTick()

      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith({
        index: 1,
        meta: { type: 'document' },
      })
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
  })

  describe('event emissions', () => {
    it('emits update:selectedScopes event', async () => {
      const eventBus = createWorkspaceEventBus()
      const fn = vi.fn()
      eventBus.on('auth:update:selected-scopes', fn)
      const wrapper = mountWithProps({ eventBus })

      const requestAuthTab = wrapper.findComponent({ name: 'RequestAuthTab' })
      expect(requestAuthTab.exists()).toBe(true)

      // The component should pass through the event
      // RequestAuthTab emits with id, name, and scopes (id comes from Object.keys(selectedSecuritySchemas))
      await requestAuthTab.vm?.$emit('update:selectedScopes', {
        id: ['BearerAuth'],
        name: 'BearerAuth',
        scopes: ['read', 'write'],
      })

      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith({
        id: ['BearerAuth'],
        name: 'BearerAuth',
        scopes: ['read', 'write'],
        meta: { type: 'document' },
      })
    })
  })

  describe('props passing', () => {
    it('passes all required props to RequestAuthTab', () => {
      const wrapper = mountWithProps({
        isStatic: false,
        proxyUrl: 'https://proxy.example.com',
      })

      const requestAuthTab = wrapper.findComponent({ name: 'RequestAuthTab' })
      expect(requestAuthTab.exists()).toBe(true)

      const props = requestAuthTab.props()
      expect(props.environment).toEqual(baseEnvironment)
      expect(props.securitySchemes).toEqual(baseSecuritySchemes)
      expect(props.server).toEqual(baseServer)
      expect(props.proxyUrl).toBe('https://proxy.example.com')
      expect(props.isStatic).toBe(false)
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

      expect(props.selectedSecuritySchemas).toEqual(selectedSchemeOptions[0]?.value)
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
