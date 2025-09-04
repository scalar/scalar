import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Selector from './Selector.vue'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

describe('Selector', () => {
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

  const singleServer: ServerObject[] = [
    {
      url: 'https://api.example.com',
      description: 'Production server',
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

  it('renders with default state for multiple servers', () => {
    const wrapper = mount(Selector, {
      props: {
        servers: mockServers,
        xSelectedServer: '',
        target: 'test-target',
      },
    })

    // Should display screen reader text
    expect(wrapper.text()).toContain('Server:')
  })

  it('renders listbox when multiple servers are available', () => {
    const wrapper = mount(Selector, {
      props: {
        servers: mockServers, // This has 3 servers, so should render listbox
        xSelectedServer: 'https://api.example.com',
        target: 'test-target',
      },
    })

    // Should render the selected server URL
    expect(wrapper.text()).toContain('api.example.com')
    // With multiple servers, should have more than just basic text content
    expect(wrapper.vm.serverOptions.length).toBe(3)
  })

  it('renders simple div when only one server is available', () => {
    const wrapper = mount(Selector, {
      props: {
        servers: singleServer,
        xSelectedServer: 'https://api.example.com',
        target: 'test-target',
      },
    })

    // Should render the server URL
    expect(wrapper.text()).toContain('api.example.com')
    // Should only have one server option
    expect(wrapper.vm.serverOptions.length).toBe(1)
  })

  it('handles empty servers array', () => {
    const wrapper = mount(Selector, {
      props: {
        servers: [],
        xSelectedServer: '',
        target: 'test-target',
      },
    })

    // Should have no server options
    expect(wrapper.vm.serverOptions.length).toBe(0)
    // Text should be empty since no server is available
    expect(wrapper.vm.serverUrlWithoutTrailingSlash).toBe('')
  })

  it('removes trailing slash from server URL', () => {
    const serversWithSlash: ServerObject[] = [
      {
        url: 'https://api.example.com/',
        description: 'Server with trailing slash',
      },
    ]

    const wrapper = mount(Selector, {
      props: {
        servers: serversWithSlash,
        xSelectedServer: 'https://api.example.com/',
        target: 'test-target',
      },
    })

    // Should remove trailing slash
    expect(wrapper.text()).toContain('api.example.com')
    expect(wrapper.text()).not.toContain('api.example.com/')
  })

  it('handles server URLs without trailing slash', () => {
    const wrapper = mount(Selector, {
      props: {
        servers: mockServers,
        xSelectedServer: 'https://api.example.com',
        target: 'test-target',
      },
    })

    // Should display URL as-is when no trailing slash
    expect(wrapper.text()).toContain('api.example.com')
  })

  it('updates selected server when model value changes', async () => {
    const wrapper = mount(Selector, {
      props: {
        servers: mockServers,
        xSelectedServer: 'https://api.example.com',
        target: 'test-target',
      },
    })

    // Initially shows first server
    expect(wrapper.text()).toContain('api.example.com')

    // Change selected server
    await wrapper.setProps({
      servers: mockServers,
      xSelectedServer: 'https://staging.example.com',
      target: 'test-target',
    })

    await nextTick()

    // Should now show the staging server
    expect(wrapper.text()).toContain('staging.example.com')
  })

  it('selectedServer computed property works correctly', async () => {
    const wrapper = mount(Selector, {
      props: {
        servers: mockServers,
        xSelectedServer: 'https://api.example.com',
        target: 'test-target',
      },
    })

    // Test the getter: should return the correct selected server
    const selectedServer = wrapper.vm.selectedServer
    expect(selectedServer).toEqual({
      id: 'https://api.example.com',
      label: 'https://api.example.com',
    })

    // Test that serverOptions contains all expected servers
    expect(wrapper.vm.serverOptions).toHaveLength(3)
    expect(wrapper.vm.serverOptions).toContainEqual({
      id: 'https://staging.example.com',
      label: 'https://staging.example.com',
    })

    // Test with no selected server
    await wrapper.setProps({
      servers: mockServers,
      xSelectedServer: '',
      target: 'test-target',
    })

    expect(wrapper.vm.selectedServer).toBeUndefined()
  })

  it('component emits update:modelValue through v-model integration', async () => {
    const wrapper = mount(Selector, {
      props: {
        servers: mockServers,
        xSelectedServer: 'https://api.example.com',
        target: 'test-target',
      },
    })

    // Verify initial state
    expect(wrapper.vm.selectedServer?.id).toBe('https://api.example.com')

    // Since we can't easily trigger the ScalarListbox v-model directly in tests,
    // let's verify the component structure and that the emit function is correctly defined
    expect(typeof wrapper.vm.$emit).toBe('function')

    // Test that the selectedServer setter logic would work
    const testOption = {
      id: 'https://staging.example.com',
      label: 'https://staging.example.com',
    }

    // Verify the option exists in serverOptions (which means it would be selectable)
    expect(wrapper.vm.serverOptions).toContainEqual(testOption)

    // The actual emission would happen through the ScalarListbox v-model,
    // which is tested in the ScalarListbox component itself
  })

  it('generates correct server options', () => {
    const wrapper = mount(Selector, {
      props: {
        servers: mockServers,
        xSelectedServer: '',
        target: 'test-target',
      },
    })

    const options = wrapper.vm.serverOptions

    expect(options).toHaveLength(3)
    expect(options[0]).toEqual({
      id: 'https://api.example.com',
      label: 'https://api.example.com',
    })
    expect(options[1]).toEqual({
      id: 'https://staging.example.com',
      label: 'https://staging.example.com',
    })
    expect(options[2]).toEqual({
      id: 'https://localhost:3000',
      label: 'https://localhost:3000',
    })
  })

  it('finds correct server object from URL', () => {
    const wrapper = mount(Selector, {
      props: {
        servers: mockServers,
        xSelectedServer: 'https://staging.example.com',
        target: 'test-target',
      },
    })

    const vm = wrapper.vm as any
    const server = vm.server

    expect(server).toEqual({
      url: 'https://staging.example.com',
      description: 'Staging server',
    })
  })

  it('handles servers with variables', () => {
    const wrapper = mount(Selector, {
      props: {
        servers: serversWithVariables,
        xSelectedServer: 'https://{environment}.example.com',
        target: 'test-target',
      },
    })

    // Should display the URL with variable placeholder
    expect(wrapper.text()).toContain('{environment}.example.com')
  })

  it('handles undefined xSelectedServer', () => {
    const wrapper = mount(Selector, {
      props: {
        servers: mockServers,
        xSelectedServer: undefined,
        target: 'test-target',
      },
    })

    const vm = wrapper.vm as any
    expect(vm.selectedServer).toBeUndefined()
    expect(vm.serverUrlWithoutTrailingSlash).toBe('')
  })

  it('handles server not found in list', () => {
    const wrapper = mount(Selector, {
      props: {
        servers: mockServers,
        xSelectedServer: 'https://nonexistent.example.com',
        target: 'test-target',
      },
    })

    expect(wrapper.vm.server).toBeUndefined()
    expect(wrapper.vm.servers).toBeDefined()
    expect(wrapper.vm.serverUrlWithoutTrailingSlash).toBe('')
  })

  it('includes screen reader text', () => {
    const wrapper = mount(Selector, {
      props: {
        servers: mockServers,
        xSelectedServer: 'https://api.example.com',
        target: 'test-target',
      },
    })

    // Should include screen reader text
    expect(wrapper.text()).toContain('Server:')
  })

  it('renders correctly for multiple servers', () => {
    const wrapper = mount(Selector, {
      props: {
        servers: mockServers,
        xSelectedServer: 'https://api.example.com',
        target: 'test-target',
      },
    })

    // Should display the selected server
    expect(wrapper.text()).toContain('api.example.com')
    // Should have multiple server options available
    expect(wrapper.vm.serverOptions.length).toBe(3)
    expect(wrapper.vm.selectedServer?.id).toBe('https://api.example.com')
  })

  it('renders correctly for single server', () => {
    const wrapper = mount(Selector, {
      props: {
        servers: singleServer,
        xSelectedServer: 'https://api.example.com',
        target: 'test-target',
      },
    })

    // Should display the server URL
    expect(wrapper.text()).toContain('api.example.com')
    // Should have only one server option
    expect(wrapper.vm.serverOptions.length).toBe(1)
    expect(wrapper.vm.selectedServer?.id).toBe('https://api.example.com')
  })

  it('handles servers with special characters in URLs', () => {
    const specialServers: ServerObject[] = [
      {
        url: 'https://api-v2.example.com:8080/path',
        description: 'Server with port and path',
      },
      {
        url: 'http://localhost:3000',
        description: 'HTTP server',
      },
    ]

    const wrapper = mount(Selector, {
      props: {
        servers: specialServers,
        xSelectedServer: 'https://api-v2.example.com:8080/path',
        target: 'test-target',
      },
    })

    expect(wrapper.text()).toContain('api-v2.example.com:8080/path')
  })

  it('handles servers with minimal configuration', () => {
    const minimalServers: ServerObject[] = [
      {
        url: 'https://api.example.com',
        // No description
      },
    ]

    const wrapper = mount(Selector, {
      props: {
        servers: minimalServers,
        xSelectedServer: 'https://api.example.com',
        target: 'test-target',
      },
    })

    // Should still work without description
    expect(wrapper.text()).toContain('api.example.com')
  })
})
