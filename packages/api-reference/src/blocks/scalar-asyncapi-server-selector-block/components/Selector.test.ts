import type { AsyncApiServerEntry } from '@scalar/workspace-store/channel-example'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
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
    expect(wrapper.text()).toBe('Server:')
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

  it('keys options by name and labels them by name and URL', () => {
    const wrapper = mount(Selector, {
      props: { servers: mockServers, selectedServer: null, target: 'test-target' },
    })

    const options = wrapper.vm.serverOptions
    expect(options).toHaveLength(3)
    expect(options[0]).toEqual({ id: 'production', label: 'production · mqtt://broker.example.com' })
    expect(options[2]).toEqual({ id: 'local', label: 'local · ws://localhost:3000' })
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

  it('uses a human-friendly title for a single server', () => {
    const server = createEntry({ name: 'production', title: 'Production broker', url: 'mqtt://broker.example.com' })
    const wrapper = mount(Selector, {
      props: { servers: [server], selectedServer: server, target: 'test-target' },
    })

    expect(wrapper.text()).toBe('Server:Production broker · mqtt://broker.example.com')
  })

  it('falls back to the map key for an empty title', () => {
    const server = createEntry({ name: 'production', title: '  ', url: 'mqtt://broker.example.com' })
    const wrapper = mount(Selector, {
      props: { servers: [server], selectedServer: server, target: 'test-target' },
    })

    expect(wrapper.text()).toBe('Server:production · mqtt://broker.example.com')
  })

  it('preserves map keys when titles and URLs are identical', async () => {
    const servers = ['production', 'staging'].map((name) =>
      createEntry({ name, title: 'Shared broker', url: 'mqtt://broker.example.com' }),
    )
    const onUpdate = vi.fn()
    const target = document.createElement('div')
    target.id = 'test-target'
    document.body.append(target)
    const wrapper = mount(Selector, {
      attachTo: target,
      props: { servers, selectedServer: servers[0]!, target: 'test-target', 'onUpdate:modelValue': onUpdate },
    })
    const listbox = wrapper.findComponent({ name: 'ScalarListbox' })
    const options = listbox.props('options')

    expect(options).toStrictEqual([
      { id: 'production', label: 'Shared broker · mqtt://broker.example.com' },
      { id: 'staging', label: 'Shared broker · mqtt://broker.example.com' },
    ])
    await wrapper.find('button').trigger('click')
    const stagingOption = document.querySelectorAll('[role="option"]')[1]
    expect(stagingOption?.textContent).toContain('Shared broker')
    stagingOption?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    expect(onUpdate.mock.calls).toStrictEqual([['staging']])
    await wrapper.setProps({ selectedServer: servers[1] })
    expect(listbox.props('modelValue')).toStrictEqual(options[1])
    wrapper.unmount()
    target.remove()
  })

  it('handles a null selectedServer', () => {
    const wrapper = mount(Selector, {
      props: { servers: mockServers, selectedServer: null, target: 'test-target' },
    })

    expect(wrapper.text()).toContain('Select a server')
  })
})
