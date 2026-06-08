import type { AsyncApiServerEntry } from '@scalar/workspace-store/channel-example'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import Selector from './Selector.vue'

/** Build an AsyncAPI server entry with sensible defaults for tests. */
const createEntry = (
  overrides: Partial<AsyncApiServerEntry> & Pick<AsyncApiServerEntry, 'name' | 'url'>,
): AsyncApiServerEntry => ({
  host: 'broker.example.com',
  protocol: 'mqtt',
  isWebSocket: false,
  server: { host: 'broker.example.com', protocol: 'mqtt' },
  ...overrides,
})

describe('Selector', () => {
  const mockServers: AsyncApiServerEntry[] = [
    createEntry({ name: 'production', url: 'mqtt://broker.example.com', description: 'Production server' }),
    createEntry({ name: 'staging', url: 'mqtt://staging.example.com', description: 'Staging server' }),
    createEntry({ name: 'local', url: 'ws://localhost:3000', protocol: 'ws', isWebSocket: true }),
  ]

  const singleServer: AsyncApiServerEntry[] = [mockServers[0]!]

  it('renders screen reader text for multiple servers', () => {
    const wrapper = mount(Selector, {
      props: { servers: mockServers, selectedServer: null, target: 'test-target' },
    })

    expect(wrapper.text()).toContain('Server:')
  })

  it('renders the constructed URL as the label', () => {
    const wrapper = mount(Selector, {
      props: { servers: mockServers, selectedServer: mockServers[0]!, target: 'test-target' },
    })

    expect(wrapper.text()).toContain('mqtt://broker.example.com')
    expect(wrapper.vm.serverOptions.length).toBe(3)
  })

  it('renders a simple div when only one server is available', () => {
    const wrapper = mount(Selector, {
      props: { servers: singleServer, selectedServer: singleServer[0]!, target: 'test-target' },
    })

    expect(wrapper.text()).toContain('mqtt://broker.example.com')
    expect(wrapper.vm.serverOptions.length).toBe(1)
  })

  it('handles an empty servers array', () => {
    const wrapper = mount(Selector, {
      props: { servers: [], selectedServer: null, target: 'test-target' },
    })

    expect(wrapper.vm.serverOptions.length).toBe(0)
    expect(wrapper.vm.serverUrlWithoutTrailingSlash).toBe('')
  })

  it('removes the trailing slash from the server URL', () => {
    const serversWithSlash: AsyncApiServerEntry[] = [
      createEntry({ name: 'production', url: 'mqtt://broker.example.com/' }),
    ]

    const wrapper = mount(Selector, {
      props: { servers: serversWithSlash, selectedServer: serversWithSlash[0]!, target: 'test-target' },
    })

    expect(wrapper.text()).toContain('mqtt://broker.example.com')
    expect(wrapper.text()).not.toContain('broker.example.com/')
  })

  it('keys options by name and labels them by URL', () => {
    const wrapper = mount(Selector, {
      props: { servers: mockServers, selectedServer: null, target: 'test-target' },
    })

    const options = wrapper.vm.serverOptions
    expect(options).toHaveLength(3)
    expect(options[0]).toEqual({ id: 'production', label: 'mqtt://broker.example.com' })
    expect(options[2]).toEqual({ id: 'local', label: 'ws://localhost:3000' })
  })

  it('updates the displayed server when the selection changes', async () => {
    const wrapper = mount(Selector, {
      props: { servers: mockServers, selectedServer: mockServers[0]!, target: 'test-target' },
    })

    expect(wrapper.text()).toContain('broker.example.com')

    await wrapper.setProps({ selectedServer: mockServers[1] })
    await nextTick()

    expect(wrapper.text()).toContain('staging.example.com')
  })

  it('handles a null selectedServer', () => {
    const wrapper = mount(Selector, {
      props: { servers: mockServers, selectedServer: null, target: 'test-target' },
    })

    expect(wrapper.vm.selectedServer).toBeNull()
    expect(wrapper.vm.serverUrlWithoutTrailingSlash).toBe('')
  })
})
