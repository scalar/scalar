import type { AsyncApiServerEntry } from '@scalar/workspace-store/channel-example'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import AsyncApiServerSelector from './AsyncApiServerSelector.vue'

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

describe('AsyncApiServerSelector', () => {
  const eventBus = createWorkspaceEventBus()

  const mockServers: AsyncApiServerEntry[] = [
    createEntry({ name: 'production', url: 'mqtt://broker.example.com', description: 'Production server' }),
    createEntry({ name: 'staging', url: 'mqtt://staging.example.com', description: 'Staging server' }),
  ]

  const serverWithVariables: AsyncApiServerEntry[] = [
    createEntry({
      name: 'production',
      url: 'mqtt://prod.example.com',
      description: 'Server with variables',
      server: {
        host: '{environment}.example.com',
        protocol: 'mqtt',
        variables: {
          environment: { default: 'prod', description: 'Environment name', enum: ['prod', 'staging', 'dev'] },
        },
      },
    }),
  ]

  it('renders the server label', () => {
    const wrapper = mount(AsyncApiServerSelector, {
      props: { servers: mockServers, selectedServer: mockServers[0]!, eventBus },
    })

    expect(wrapper.text()).toContain('Server')
  })

  it('renders the selector when servers are available', () => {
    const wrapper = mount(AsyncApiServerSelector, {
      props: { servers: mockServers, selectedServer: mockServers[0]!, eventBus },
    })

    expect(wrapper.findComponent({ name: 'Selector' }).exists()).toBe(true)
  })

  it('does not render the selector when no servers are available', () => {
    const wrapper = mount(AsyncApiServerSelector, {
      props: { servers: [], selectedServer: null, eventBus },
    })

    expect(wrapper.findComponent({ name: 'Selector' }).exists()).toBe(false)
  })

  it('renders the selected server description', () => {
    const wrapper = mount(AsyncApiServerSelector, {
      props: { servers: mockServers, selectedServer: mockServers[1]!, eventBus },
    })

    expect(wrapper.text()).toContain('Staging server')
  })

  it('normalizes AsyncAPI variables for the variables form', () => {
    const wrapper = mount(AsyncApiServerSelector, {
      props: { servers: serverWithVariables, selectedServer: serverWithVariables[0]!, eventBus },
    })

    const variablesForm = wrapper.findComponent({ name: 'ServerVariablesForm' })
    expect(variablesForm.exists()).toBe(true)
    expect(variablesForm.props('variables')).toEqual({
      environment: { default: 'prod', description: 'Environment name', enum: ['prod', 'staging', 'dev'] },
    })
    expect(variablesForm.props('layout')).toBe('reference')
  })

  it('emits the selected server name when a server is chosen', async () => {
    const emit = vi.spyOn(eventBus, 'emit')
    const wrapper = mount(AsyncApiServerSelector, {
      props: { servers: mockServers, selectedServer: mockServers[0]!, eventBus },
    })

    const selector = wrapper.findComponent({ name: 'Selector' })
    await selector.vm.$emit('update:modelValue', 'staging')

    expect(emit).toHaveBeenCalledWith('asyncapi-server:update:selected', { name: 'staging' })
    emit.mockRestore()
  })

  it('emits a variable update with the selected server name', async () => {
    const emit = vi.spyOn(eventBus, 'emit')
    const wrapper = mount(AsyncApiServerSelector, {
      props: { servers: serverWithVariables, selectedServer: serverWithVariables[0]!, eventBus },
    })

    const variablesForm = wrapper.findComponent({ name: 'ServerVariablesForm' })
    await variablesForm.vm.$emit('update:variable', 'environment', 'staging')

    expect(emit).toHaveBeenCalledWith('asyncapi-server:update:variables', {
      name: 'production',
      key: 'environment',
      value: 'staging',
    })
    emit.mockRestore()
  })

  it('handles a null selectedServer gracefully', () => {
    const wrapper = mount(AsyncApiServerSelector, {
      props: { servers: mockServers, selectedServer: null, eventBus },
    })

    expect(wrapper.text()).toContain('Server')
  })
})
