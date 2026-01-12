import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import ServerSelector from './ServerSelector.vue'

describe('ServerSelector', () => {
  const eventBus = createWorkspaceEventBus()
  const mockServers: ServerObject[] = [
    {
      url: 'https://api.example.com',
      description: 'Production server',
    },
    {
      url: 'https://staging.example.com',
      description: 'Staging server',
    },
    {
      url: 'https://localhost:3000',
      description: 'Local development server',
    },
  ]

  const serversWithVariables: ServerObject[] = [
    {
      url: 'https://{environment}.example.com',
      description: 'Server with variables',
      variables: {
        environment: {
          default: 'api',
          description: 'Environment name',
          enum: ['api', 'staging', 'dev'],
        },
      },
    },
  ]

  const serversWithoutDescription: ServerObject[] = [
    {
      url: 'https://api.example.com',
    },
  ]

  it('renders with default state', () => {
    const wrapper = mount(ServerSelector, {
      props: {
        servers: mockServers,
        eventBus,
        selectedServer: mockServers[0]!,
      },
    })

    // Should render the server label
    expect(wrapper.text()).toContain('Server')
  })

  it('renders server selector when servers are available', () => {
    const wrapper = mount(ServerSelector, {
      props: {
        servers: mockServers,
        eventBus,
        selectedServer: mockServers[0]!,
      },
    })

    // Should render the Selector component
    expect(wrapper.findComponent({ name: 'Selector' }).exists()).toBe(true)
  })

  it('does not render selector when no servers are available', () => {
    const wrapper = mount(ServerSelector, {
      props: {
        servers: [],
        eventBus,
        selectedServer: null,
      },
    })

    // Should not render the Selector component when no servers
    expect(wrapper.findComponent({ name: 'Selector' }).exists()).toBe(false)
  })

  it('renders server description when available', () => {
    const wrapper = mount(ServerSelector, {
      props: {
        servers: mockServers,
        eventBus,
        selectedServer: mockServers[0]!,
      },
    })

    // Should render the server description
    expect(wrapper.text()).toContain('Production server')
  })

  it('does not render description when not available', () => {
    const wrapper = mount(ServerSelector, {
      props: {
        servers: serversWithoutDescription,
        eventBus,
        selectedServer: serversWithoutDescription[0]!,
      },
    })

    // Should not have description content when none exists
    expect(wrapper.text()).not.toContain('Production server')
  })

  it('renders server variables form when variables are available', () => {
    const wrapper = mount(ServerSelector, {
      props: {
        servers: serversWithVariables,
        eventBus,
        selectedServer: serversWithVariables[0]!,
      },
    })

    // Should have content related to server variables
    expect(wrapper.findComponent({ name: 'ServerVariablesForm' }).exists()).toBe(true)
  })

  it('finds correct server and displays description', () => {
    const wrapper = mount(ServerSelector, {
      props: {
        servers: mockServers,
        eventBus,
        selectedServer: mockServers[1]!,
      },
    })

    // Should display the staging server's description
    expect(wrapper.text()).toContain('Staging server')
  })

  it('handles null selectedServer gracefully', () => {
    const wrapper = mount(ServerSelector, {
      props: {
        servers: mockServers,
        eventBus,
        selectedServer: null,
      },
    })

    // Should not crash and should render basic structure
    expect(wrapper.text()).toContain('Server')
  })

  it('handles server not found in list', () => {
    const wrapper = mount(ServerSelector, {
      props: {
        servers: mockServers,
        eventBus,
        selectedServer: { url: 'https://nonexistent.example.com' },
      },
    })

    // Should not display any server description
    expect(wrapper.text()).not.toContain('Production server')
    expect(wrapper.text()).not.toContain('Staging server')
  })

  it('handles component lifecycle correctly', async () => {
    const wrapper = mount(ServerSelector, {
      props: {
        servers: mockServers,
        eventBus,
        selectedServer: null,
      },
    })

    // Wait for nextTick to complete
    await nextTick()

    // Component should render without errors
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('Server')
  })

  it('handles server changes correctly', async () => {
    const wrapper = mount(ServerSelector, {
      props: {
        servers: mockServers,
        eventBus,
        selectedServer: mockServers[1]!,
      },
    })

    await nextTick()

    // Should display the selected server's description
    expect(wrapper.text()).toContain('Staging server')
  })

  it('handles empty server list correctly', async () => {
    const wrapper = mount(ServerSelector, {
      props: {
        servers: [],
        eventBus,
        selectedServer: null,
      },
    })

    await nextTick()

    // Should not render selector when no servers
    expect(wrapper.findComponent({ name: 'Selector' }).exists()).toBe(false)
  })

  it('responds to selector component events', async () => {
    const wrapper = mount(ServerSelector, {
      props: {
        servers: mockServers,
        eventBus,
        selectedServer: mockServers[0]!,
      },
    })

    // Simulate the Selector component emitting update:modelValue
    const selector = wrapper.findComponent({ name: 'Selector' })
    await selector.vm.$emit('update:modelValue', 'https://staging.example.com')

    // The component should handle the event without errors
    expect(wrapper.exists()).toBe(true)
  })

  it('responds to server variables form events', async () => {
    const wrapper = mount(ServerSelector, {
      props: {
        servers: serversWithVariables,
        eventBus,
        selectedServer: serversWithVariables[0]!,
      },
    })

    // Simulate the ServerVariablesForm emitting update:variable
    const variablesForm = wrapper.findComponent({ name: 'ServerVariablesForm' })
    await variablesForm.vm.$emit('update:variable', { key: 'environment', value: 'staging' })

    // The component should handle the event without errors
    expect(wrapper.exists()).toBe(true)
  })

  it('handles servers with variables correctly', () => {
    const wrapper = mount(ServerSelector, {
      props: {
        servers: serversWithVariables,
        eventBus,
        selectedServer: serversWithVariables[0]!,
      },
    })

    // Should render ServerVariablesForm when server has variables
    expect(wrapper.findComponent({ name: 'ServerVariablesForm' }).exists()).toBe(true)

    // Should pass the variables to the form
    const variablesForm = wrapper.findComponent({ name: 'ServerVariablesForm' })
    expect(variablesForm.props('variables')).toEqual({
      environment: {
        default: 'api',
        description: 'Environment name',
        enum: ['api', 'staging', 'dev'],
      },
    })
  })

  it('passes correct props to selector component', () => {
    const wrapper = mount(ServerSelector, {
      props: {
        servers: mockServers,
        eventBus,
        selectedServer: mockServers[0]!,
      },
    })

    const selector = wrapper.findComponent({ name: 'Selector' })
    expect(selector.props('servers')).toEqual(mockServers)
    expect(selector.props('selectedServer')).toEqual(mockServers[0])
    expect(selector.props('target')).toBeDefined()
  })

  it('passes correct props to server variables form', () => {
    const wrapper = mount(ServerSelector, {
      props: {
        servers: serversWithVariables,
        eventBus,
        selectedServer: serversWithVariables[0]!,
      },
    })

    const variablesForm = wrapper.findComponent({ name: 'ServerVariablesForm' })
    expect(variablesForm.props('variables')).toEqual({
      environment: {
        default: 'api',
        description: 'Environment name',
        enum: ['api', 'staging', 'dev'],
      },
    })
    expect(variablesForm.props('layout')).toBe('reference')
  })

  it('reactively updates the store when the variables are updated', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test',
      document: {
        openapi: '3.1.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        'servers': [
          {
            'url': 'https://galaxy.scalar.com',
          },
          {
            'url': '{protocol}://void.scalar.com/{path}',
            'description': 'Responds with your request data',
            'variables': {
              'protocol': {
                'enum': ['abcd', '1234'],
                'default': 'abcd',
              },
              'path': {
                'default': '',
              },
            },
          },
        ],
      },
    })

    const wrapper = mount(ServerSelector, {
      props: {
        servers: store.workspace.activeDocument!.servers!,
        eventBus,
        selectedServer: store.workspace.activeDocument!.servers![1]!,
      },
    })

    const variables = wrapper.findComponent({ name: 'ServerVariablesForm' })
    expect(variables.exists()).toBe(true)

    // Check that the variables form has the correct props
    expect(variables.props('variables')).toEqual({
      'protocol': {
        'enum': ['abcd', '1234'],
        'default': 'abcd',
      },
      'path': {
        'default': '',
      },
    })

    // Update the default value in the store
    store.workspace.activeDocument!.servers![1]!.variables!.protocol!.default = '1234'
    await nextTick()

    // Check that the variables form props have been updated
    expect(variables.props('variables')?.protocol?.default).toBe('1234')
  })

  it('renders with multiple servers and complex configuration', () => {
    const complexServers: ServerObject[] = [
      {
        url: 'https://api.example.com',
        description: 'Production server with detailed description',
        variables: {
          version: {
            default: 'v1',
            enum: ['v1', 'v2'],
          },
        },
      },
      {
        url: 'https://staging.example.com',
        description: 'Staging environment',
      },
    ]

    const wrapper = mount(ServerSelector, {
      props: {
        servers: complexServers,
        eventBus,
        selectedServer: complexServers[0]!,
      },
    })

    // Should render all components
    expect(wrapper.findComponent({ name: 'Selector' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'ServerVariablesForm' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'ScalarMarkdown' }).exists()).toBe(true)

    // Should display the description
    expect(wrapper.text()).toContain('Production server with detailed description')
  })

  it('handles prop updates correctly', async () => {
    const wrapper = mount(ServerSelector, {
      props: {
        servers: [],
        eventBus,
        selectedServer: null,
      },
    })

    // Initially no selector should be rendered
    expect(wrapper.findComponent({ name: 'Selector' }).exists()).toBe(false)

    // Update props to include servers
    await wrapper.setProps({
      servers: mockServers,
      eventBus,
      selectedServer: mockServers[0],
    })

    // Now selector should be rendered
    expect(wrapper.findComponent({ name: 'Selector' }).exists()).toBe(true)
    expect(wrapper.text()).toContain('Production server')
  })
})
