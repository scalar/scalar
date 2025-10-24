// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import Document from './Overview.vue'

// Mock ResizeObserver
window.ResizeObserver =
  window.ResizeObserver ||
  vi.fn().mockImplementation(() => ({
    disconnect: vi.fn(),
    observe: vi.fn(),
    unobserve: vi.fn(),
  }))

describe('Document', () => {
  const mockEvents = {
    commandPalette: {
      emit: vi.fn(),
    },
  } as any

  const baseEnvironment = {
    uid: 'env-1' as any,
    name: 'Default',
    color: '#FFFFFF',
    value: '',
    isDefault: true,
  }

  const baseServers = [
    {
      url: 'https://api.example.com',
      description: 'Production API',
      variables: {},
    },
  ]

  const mountWithProps = (
    custom: Partial<{
      selectedTab: 'overview' | 'servers' | 'authentication' | 'environment' | 'settings'
      icon: string
      title: string
      description: string
      servers: any[]
      documentUrl: string
      watchMode: boolean
      useDocumentSecurity: boolean
      security: any
      selectedSecurity: any
      securitySchemes: any
      server: any
    }> = {},
  ) => {
    const defaultProps = {
      selectedTab: 'overview' as const,
      icon: 'interface-content-folder',
      title: 'Test Document',
      description: 'Test description',
      servers: baseServers,
      events: mockEvents,
      documentUrl: undefined,
      watchMode: false,
      useDocumentSecurity: false,
      security: [],
      selectedSecurity: [],
      securitySchemes: {},
      server: undefined,
      environment: baseEnvironment,
      envVariables: [],
      environments: [],
    }

    return mount(Document, {
      props: {
        ...defaultProps,
        ...custom,
      },
    })
  }

  describe('rendering', () => {
    it('renders the component', () => {
      const wrapper = mountWithProps()

      expect(wrapper.exists()).toBe(true)
    })

    it('renders the document title section', () => {
      const wrapper = mountWithProps({ title: 'My API Document' })

      const titleSection = wrapper.find('[aria-label="Document: My API Document"]')
      expect(titleSection.exists()).toBe(true)
    })

    it('renders IconSelector component', () => {
      const wrapper = mountWithProps()

      const iconSelector = wrapper.findComponent({ name: 'IconSelector' })
      expect(iconSelector.exists()).toBe(true)
    })

    it('renders LabelInput for title', () => {
      const wrapper = mountWithProps()

      const labelInput = wrapper.findComponent({ name: 'LabelInput' })
      expect(labelInput.exists()).toBe(true)
    })

    it('renders Tabs component', () => {
      const wrapper = mountWithProps()

      const tabs = wrapper.findComponent({ name: 'Tabs' })
      expect(tabs.exists()).toBe(true)
    })

    it('renders LibraryIcon with correct icon', () => {
      const wrapper = mountWithProps({ icon: 'interface-content-folder' })

      const libraryIcon = wrapper.findComponent({ name: 'LibraryIcon' })
      expect(libraryIcon.exists()).toBe(true)
      expect(libraryIcon.props('src')).toBe('interface-content-folder')
    })

    it('renders with default icon when not provided', () => {
      const wrapper = mount(Document, {
        props: {
          selectedTab: 'overview',
          title: 'Test',
          servers: [],
          events: mockEvents,
          useDocumentSecurity: false,
          security: [],
          selectedSecurity: [],
          securitySchemes: {},
          server: undefined,
          environment: baseEnvironment,
          envVariables: [],
          environments: [],
        },
      })

      const libraryIcon = wrapper.findComponent({ name: 'LibraryIcon' })
      expect(libraryIcon.props('src')).toBe('interface-content-folder')
    })
  })

  describe('icon selector', () => {
    it('passes correct icon to IconSelector', () => {
      const wrapper = mountWithProps({ icon: 'custom-icon' })

      const iconSelector = wrapper.findComponent({ name: 'IconSelector' })
      expect(iconSelector.props('modelValue')).toBe('custom-icon')
    })

    it('emits update:documentIcon when icon is changed', async () => {
      const wrapper = mountWithProps()

      const iconSelector = wrapper.findComponent({ name: 'IconSelector' })
      await iconSelector.vm.$emit('update:modelValue', 'new-icon')
      await nextTick()

      expect(wrapper.emitted('update:documentIcon')).toBeTruthy()
      expect(wrapper.emitted('update:documentIcon')?.[0]).toEqual(['new-icon'])
    })

    it('renders ScalarButton for icon selector', () => {
      const wrapper = mountWithProps()

      const iconSelector = wrapper.findComponent({ name: 'IconSelector' })
      const button = iconSelector.findComponent({ name: 'ScalarButton' })
      expect(button.exists()).toBe(true)
      expect(button.props('variant')).toBe('ghost')
    })
  })

  describe('title editing', () => {
    it('passes title to LabelInput', () => {
      const wrapper = mountWithProps({ title: 'My Document Title' })

      const labelInput = wrapper.findComponent({ name: 'LabelInput' })
      expect(labelInput.props('value')).toBe('My Document Title')
    })

    it('sets correct placeholder for LabelInput', () => {
      const wrapper = mountWithProps()

      const labelInput = wrapper.findComponent({ name: 'LabelInput' })
      expect(labelInput.props('placeholder')).toBe('Untitled Document')
    })

    it('sets correct inputId for LabelInput', () => {
      const wrapper = mountWithProps()

      const labelInput = wrapper.findComponent({ name: 'LabelInput' })
      expect(labelInput.props('inputId')).toBe('documentName')
    })

    it('emits update:documentTitle when title is changed', async () => {
      const wrapper = mountWithProps()

      const labelInput = wrapper.findComponent({ name: 'LabelInput' })
      await labelInput.vm.$emit('updateValue', 'New Title')
      await nextTick()

      expect(wrapper.emitted('update:documentTitle')).toBeTruthy()
      expect(wrapper.emitted('update:documentTitle')?.[0]).toEqual(['New Title'])
    })

    it('handles empty title', () => {
      const wrapper = mountWithProps({ title: '' })

      const labelInput = wrapper.findComponent({ name: 'LabelInput' })
      expect(labelInput.props('value')).toBe('')
    })

    it('handles special characters in title', () => {
      const wrapper = mountWithProps({ title: 'Test & API <v2>' })

      const labelInput = wrapper.findComponent({ name: 'LabelInput' })
      expect(labelInput.props('value')).toBe('Test & API <v2>')
    })
  })

  describe('tabs', () => {
    it('passes selectedTab to Tabs component', () => {
      const wrapper = mountWithProps({ selectedTab: 'servers' })

      const tabs = wrapper.findComponent({ name: 'Tabs' })
      expect(tabs.props('selectedTab')).toBe('servers')
    })

    it('emits update:selectedTab when tab is changed', async () => {
      const wrapper = mountWithProps()

      const tabs = wrapper.findComponent({ name: 'Tabs' })
      await tabs.vm.$emit('update:selectedTab', 'settings')
      await nextTick()

      expect(wrapper.emitted('update:selectedTab')).toBeTruthy()
      expect(wrapper.emitted('update:selectedTab')?.[0]).toEqual(['settings'])
    })

    it('switches between tabs correctly', async () => {
      const wrapper = mountWithProps({ selectedTab: 'overview' })

      const tabs = wrapper.findComponent({ name: 'Tabs' })

      await tabs.vm.$emit('update:selectedTab', 'servers')
      await nextTick()

      expect(wrapper.emitted('update:selectedTab')?.[0]).toEqual(['servers'])

      await tabs.vm.$emit('update:selectedTab', 'authentication')
      await nextTick()

      expect(wrapper.emitted('update:selectedTab')?.[1]).toEqual(['authentication'])
    })
  })

  describe('overview tab', () => {
    it('renders Overview component when selectedTab is overview', () => {
      const wrapper = mountWithProps({ selectedTab: 'overview' })

      const overview = wrapper.findComponent({ name: 'Overview' })
      expect(overview.exists()).toBe(true)
    })

    it('does not render Overview when different tab is selected', () => {
      const wrapper = mountWithProps({ selectedTab: 'servers' })

      const overview = wrapper.findComponent({ name: 'Overview' })
      expect(overview.exists()).toBe(false)
    })

    it('passes empty string when description is undefined', () => {
      const wrapper = mount(Document, {
        props: {
          selectedTab: 'overview',
          title: 'Test',
          servers: [],
          events: mockEvents,
          useDocumentSecurity: false,
          security: [],
          selectedSecurity: [],
          securitySchemes: {},
          server: undefined,
          environment: baseEnvironment,
          envVariables: [],
          environments: [],
        },
      })

      const overview = wrapper.findComponent({ name: 'Overview' })
      expect(overview.props('description')).toBe('')
    })

    it('emits overview:update:description when description is updated', async () => {
      const wrapper = mountWithProps({ selectedTab: 'overview' })

      const overview = wrapper.findComponent({ name: 'Overview' })
      await overview.vm.$emit('overview:update:description', 'New description')
      await nextTick()

      expect(wrapper.emitted('overview:update:description')).toBeTruthy()
      expect(wrapper.emitted('overview:update:description')?.[0]).toEqual(['New description'])
    })
  })

  describe('servers tab', () => {
    it('renders Servers component when selectedTab is servers', () => {
      const wrapper = mountWithProps({ selectedTab: 'servers' })

      const servers = wrapper.findComponent({ name: 'Servers' })
      expect(servers.exists()).toBe(true)
    })

    it('does not render Servers when different tab is selected', () => {
      const wrapper = mountWithProps({ selectedTab: 'overview' })

      const servers = wrapper.findComponent({ name: 'Servers' })
      expect(servers.exists()).toBe(false)
    })

    it('passes servers prop to Servers component', () => {
      const wrapper = mountWithProps({ selectedTab: 'servers' })

      const servers = wrapper.findComponent({ name: 'Servers' })
      expect(servers.props('servers')).toEqual(baseServers)
    })

    it('emits server:delete when server is deleted', async () => {
      const wrapper = mountWithProps({ selectedTab: 'servers' })

      const servers = wrapper.findComponent({ name: 'Servers' })
      await servers.vm.$emit('server:delete', { serverUrl: 'https://api.example.com' })
      await nextTick()

      expect(wrapper.emitted('server:delete')).toBeTruthy()
      expect(wrapper.emitted('server:delete')?.[0]).toEqual([{ serverUrl: 'https://api.example.com' }])
    })

    it('emits server:update:variable when server variable is updated', async () => {
      const wrapper = mountWithProps({ selectedTab: 'servers' })

      const servers = wrapper.findComponent({ name: 'Servers' })
      const payload = {
        serverUrl: 'https://api.example.com',
        name: 'version',
        value: 'v2',
      }
      await servers.vm.$emit('server:update:variable', payload)
      await nextTick()

      expect(wrapper.emitted('server:update:variable')).toBeTruthy()
      expect(wrapper.emitted('server:update:variable')?.[0]).toEqual([payload])
    })
  })

  describe('authentication tab', () => {
    it('renders Authentication component when selectedTab is authentication', () => {
      const wrapper = mountWithProps({ selectedTab: 'authentication' })

      const auth = wrapper.findComponent({ name: 'Authentication' })
      expect(auth.exists()).toBe(true)
    })

    it('does not render Authentication when different tab is selected', () => {
      const wrapper = mountWithProps({ selectedTab: 'overview' })

      const auth = wrapper.findComponent({ name: 'Authentication' })
      expect(auth.exists()).toBe(false)
    })

    it('emits auth:update:useDocumentSecurity when document security is toggled', async () => {
      const wrapper = mountWithProps({ selectedTab: 'authentication' })

      const auth = wrapper.findComponent({ name: 'Authentication' })
      await auth.vm.$emit('update:useDocumentSecurity', true)
      await nextTick()

      expect(wrapper.emitted('auth:update:useDocumentSecurity')).toBeTruthy()
      expect(wrapper.emitted('auth:update:useDocumentSecurity')?.[0]).toEqual([true])
    })

    it('emits auth:deleteOperationAuth when operation auth is deleted', async () => {
      const wrapper = mountWithProps({ selectedTab: 'authentication' })

      const auth = wrapper.findComponent({ name: 'Authentication' })
      await auth.vm.$emit('deleteOperationAuth', ['apiKey'])
      await nextTick()

      expect(wrapper.emitted('auth:deleteOperationAuth')).toBeTruthy()
      expect(wrapper.emitted('auth:deleteOperationAuth')?.[0]).toEqual([['apiKey']])
    })

    it('emits auth:update:securityScheme when security scheme is updated', async () => {
      const wrapper = mountWithProps({ selectedTab: 'authentication' })

      const auth = wrapper.findComponent({ name: 'Authentication' })
      const payload = { name: 'apiKey', scheme: { type: 'apiKey' } }
      await auth.vm.$emit('update:securityScheme', payload)
      await nextTick()

      expect(wrapper.emitted('auth:update:securityScheme')).toBeTruthy()
      expect(wrapper.emitted('auth:update:securityScheme')?.[0]).toEqual([payload])
    })

    it('emits auth:update:selectedScopes when scopes are updated', async () => {
      const wrapper = mountWithProps({ selectedTab: 'authentication' })

      const auth = wrapper.findComponent({ name: 'Authentication' })
      const payload = { id: ['oauth'], name: 'oauth', scopes: ['read', 'write'] }
      await auth.vm.$emit('update:selectedScopes', payload)
      await nextTick()

      expect(wrapper.emitted('auth:update:selectedScopes')).toBeTruthy()
      expect(wrapper.emitted('auth:update:selectedScopes')?.[0]).toEqual([payload])
    })

    it('emits auth:update:selectedSecurity when selected security is updated', async () => {
      const wrapper = mountWithProps({ selectedTab: 'authentication' })

      const auth = wrapper.findComponent({ name: 'Authentication' })
      const payload = { value: [{ apiKey: [] }], create: [] }
      await auth.vm.$emit('update:selectedSecurity', payload)
      await nextTick()

      expect(wrapper.emitted('auth:update:selectedSecurity')).toBeTruthy()
      expect(wrapper.emitted('auth:update:selectedSecurity')?.[0]).toEqual([payload])
    })
  })

  describe('environment tab', () => {
    it('renders Environment component when selectedTab is environment', () => {
      const wrapper = mountWithProps({ selectedTab: 'environment' })

      const env = wrapper.findComponent({ name: 'Environment' })
      expect(env.exists()).toBe(true)
    })

    it('does not render Environment when different tab is selected', () => {
      const wrapper = mountWithProps({ selectedTab: 'overview' })

      const env = wrapper.findComponent({ name: 'Environment' })
      expect(env.exists()).toBe(false)
    })

    it('emits environment:reorder when environments are reordered', async () => {
      const wrapper = mountWithProps({ selectedTab: 'environment' })

      const env = wrapper.findComponent({ name: 'Environment' })
      const payload = {
        draggingItem: { id: 'env-1' },
        hoveredItem: { id: 'env-2' },
      }
      await env.vm.$emit('environment:reorder', payload)
      await nextTick()

      expect(wrapper.emitted('environment:reorder')).toBeTruthy()
      expect(wrapper.emitted('environment:reorder')?.[0]).toEqual([payload])
    })

    it('emits environment:add when environment is added', async () => {
      const wrapper = mountWithProps({ selectedTab: 'environment' })

      const env = wrapper.findComponent({ name: 'Environment' })
      const payload = { environment: { name: 'New Env', color: '#000000' } }
      await env.vm.$emit('environment:add', payload)
      await nextTick()

      expect(wrapper.emitted('environment:add')).toBeTruthy()
      expect(wrapper.emitted('environment:add')?.[0]).toEqual([payload])
    })

    it('emits environment:update when environment is updated', async () => {
      const wrapper = mountWithProps({ selectedTab: 'environment' })

      const env = wrapper.findComponent({ name: 'Environment' })
      const payload = {
        environmentName: 'Default',
        environment: { name: 'Updated Name' },
      }
      await env.vm.$emit('environment:update', payload)
      await nextTick()

      expect(wrapper.emitted('environment:update')).toBeTruthy()
      expect(wrapper.emitted('environment:update')?.[0]).toEqual([payload])
    })

    it('emits environment:delete when environment is deleted', async () => {
      const wrapper = mountWithProps({ selectedTab: 'environment' })

      const env = wrapper.findComponent({ name: 'Environment' })
      const payload = { environmentName: 'Default' }
      await env.vm.$emit('environment:delete', payload)
      await nextTick()

      expect(wrapper.emitted('environment:delete')).toBeTruthy()
      expect(wrapper.emitted('environment:delete')?.[0]).toEqual([payload])
    })

    it('emits environment:add:variable when variable is added', async () => {
      const wrapper = mountWithProps({ selectedTab: 'environment' })

      const env = wrapper.findComponent({ name: 'Environment' })
      const payload = {
        environmentName: 'Default',
        environmentVariable: { key: 'API_KEY', value: 'test' },
      }
      await env.vm.$emit('environment:add:variable', payload)
      await nextTick()

      expect(wrapper.emitted('environment:add:variable')).toBeTruthy()
      expect(wrapper.emitted('environment:add:variable')?.[0]).toEqual([payload])
    })

    it('emits environment:update:variable when variable is updated', async () => {
      const wrapper = mountWithProps({ selectedTab: 'environment' })

      const env = wrapper.findComponent({ name: 'Environment' })
      const payload = {
        id: 1,
        environmentName: 'Default',
        environmentVariable: { key: 'API_KEY', value: 'updated' },
      }
      await env.vm.$emit('environment:update:variable', payload)
      await nextTick()

      expect(wrapper.emitted('environment:update:variable')).toBeTruthy()
      expect(wrapper.emitted('environment:update:variable')?.[0]).toEqual([payload])
    })

    it('emits environment:delete:variable when variable is deleted', async () => {
      const wrapper = mountWithProps({ selectedTab: 'environment' })

      const env = wrapper.findComponent({ name: 'Environment' })
      const payload = { environmentName: 'Default', id: 1 }
      await env.vm.$emit('environment:delete:variable', payload)
      await nextTick()

      expect(wrapper.emitted('environment:delete:variable')).toBeTruthy()
      expect(wrapper.emitted('environment:delete:variable')?.[0]).toEqual([payload])
    })
  })

  describe('settings tab', () => {
    it('renders Settings component when selectedTab is settings', () => {
      const wrapper = mountWithProps({ selectedTab: 'settings' })

      const settings = wrapper.findComponent({ name: 'Settings' })
      expect(settings.exists()).toBe(true)
    })

    it('does not render Settings when different tab is selected', () => {
      const wrapper = mountWithProps({ selectedTab: 'overview' })

      const settings = wrapper.findComponent({ name: 'Settings' })
      expect(settings.exists()).toBe(false)
    })

    it('emits settings:deleteDocument when document is deleted', async () => {
      const wrapper = mountWithProps({ selectedTab: 'settings' })

      const settings = wrapper.findComponent({ name: 'Settings' })
      await settings.vm.$emit('deleteDocument')
      await nextTick()

      expect(wrapper.emitted('settings:deleteDocument')).toBeTruthy()
      expect(wrapper.emitted('settings:deleteDocument')?.[0]).toEqual([])
    })

    it('emits settings:update:watchMode when watch mode is updated', async () => {
      const wrapper = mountWithProps({ selectedTab: 'settings' })

      const settings = wrapper.findComponent({ name: 'Settings' })
      await settings.vm.$emit('update:watchMode', true)
      await nextTick()

      expect(wrapper.emitted('settings:update:watchMode')).toBeTruthy()
      expect(wrapper.emitted('settings:update:watchMode')?.[0]).toEqual([true])
    })
  })

  describe('edge cases', () => {
    it('handles switching between all tabs', async () => {
      const wrapper = mountWithProps({ selectedTab: 'overview' })
      const tabs = wrapper.findComponent({ name: 'Tabs' })

      const tabNames: Array<'overview' | 'servers' | 'authentication' | 'environment' | 'settings'> = [
        'servers',
        'authentication',
        'environment',
        'settings',
        'overview',
      ]

      for (const tabName of tabNames) {
        await tabs.vm.$emit('update:selectedTab', tabName)
        await nextTick()
      }

      expect(wrapper.emitted('update:selectedTab')).toHaveLength(5)
    })

    it('handles empty servers array', () => {
      const wrapper = mountWithProps({ selectedTab: 'servers', servers: [] })

      const servers = wrapper.findComponent({ name: 'Servers' })
      expect(servers.props('servers')).toEqual([])
    })

    it('handles undefined server', () => {
      const wrapper = mountWithProps({
        selectedTab: 'authentication',
        server: undefined,
      })

      const auth = wrapper.findComponent({ name: 'Authentication' })
      expect(auth.props('server')).toBeUndefined()
    })

    it('handles empty security schemes', () => {
      const wrapper = mountWithProps({
        selectedTab: 'authentication',
        securitySchemes: {},
      })

      const auth = wrapper.findComponent({ name: 'Authentication' })
      expect(auth.props('securitySchemes')).toEqual({})
    })

    it('handles very long title', () => {
      const longTitle = 'A'.repeat(200)
      const wrapper = mountWithProps({ title: longTitle })

      const labelInput = wrapper.findComponent({ name: 'LabelInput' })
      expect(labelInput.props('value')).toBe(longTitle)
    })

    it('handles multiple rapid icon changes', async () => {
      const wrapper = mountWithProps()
      const iconSelector = wrapper.findComponent({ name: 'IconSelector' })

      const icons = ['icon-1', 'icon-2', 'icon-3', 'icon-4']
      for (const icon of icons) {
        await iconSelector.vm.$emit('update:modelValue', icon)
        await nextTick()
      }

      expect(wrapper.emitted('update:documentIcon')).toHaveLength(4)
    })

    it('handles multiple rapid title changes', async () => {
      const wrapper = mountWithProps()
      const labelInput = wrapper.findComponent({ name: 'LabelInput' })

      const titles = ['Title 1', 'Title 2', 'Title 3']
      for (const title of titles) {
        await labelInput.vm.$emit('updateValue', title)
        await nextTick()
      }

      expect(wrapper.emitted('update:documentTitle')).toHaveLength(3)
    })

    it('handles title with unicode characters', () => {
      const wrapper = mountWithProps({ title: 'API 文档 🚀' })

      const labelInput = wrapper.findComponent({ name: 'LabelInput' })
      expect(labelInput.props('value')).toBe('API 文档 🚀')
    })

    it('renders correctly with all optional props provided', () => {
      const wrapper = mountWithProps({
        selectedTab: 'settings',
        icon: 'custom-icon',
        title: 'Full Document',
        description: 'Full description',
        documentUrl: 'https://api.example.com/openapi.yaml',
        watchMode: true,
        useDocumentSecurity: true,
        security: [{ apiKey: [] }],
        selectedSecurity: [{ apiKey: [] }],
        securitySchemes: { apiKey: { type: 'apiKey' } },
        server: { url: 'https://api.example.com', description: 'Test' },
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.findComponent({ name: 'Settings' }).exists()).toBe(true)
    })

    it('renders correctly with minimal required props', () => {
      const wrapper = mount(Document, {
        props: {
          selectedTab: 'overview',
          title: 'Minimal',
          servers: [],
          events: mockEvents,
          useDocumentSecurity: false,
          security: [],
          selectedSecurity: [],
          securitySchemes: {},
          server: undefined,
          environment: baseEnvironment,
          envVariables: [],
          environments: [],
        },
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.findComponent({ name: 'Overview' }).exists()).toBe(true)
    })
  })

  describe('conditional rendering', () => {
    it('only renders one tab component at a time', () => {
      const wrapper = mountWithProps({ selectedTab: 'overview' })

      expect(wrapper.findComponent({ name: 'Overview' }).exists()).toBe(true)
      expect(wrapper.findComponent({ name: 'Servers' }).exists()).toBe(false)
      expect(wrapper.findComponent({ name: 'Authentication' }).exists()).toBe(false)
      expect(wrapper.findComponent({ name: 'Environment' }).exists()).toBe(false)
      expect(wrapper.findComponent({ name: 'Settings' }).exists()).toBe(false)
    })

    it('renders correct component for each tab selection', async () => {
      const tabs: Array<{
        name: 'overview' | 'servers' | 'authentication' | 'environment' | 'settings'
        component: string
      }> = [
        { name: 'overview', component: 'Overview' },
        { name: 'servers', component: 'Servers' },
        { name: 'authentication', component: 'Authentication' },
        { name: 'environment', component: 'Environment' },
        { name: 'settings', component: 'Settings' },
      ]

      for (const tab of tabs) {
        const wrapper = mountWithProps({ selectedTab: tab.name })
        expect(wrapper.findComponent({ name: tab.component }).exists()).toBe(true)
      }
    })
  })
})
