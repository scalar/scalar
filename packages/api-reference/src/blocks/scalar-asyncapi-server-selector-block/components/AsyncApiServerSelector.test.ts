import type { AsyncApiServerEntry } from '@scalar/workspace-store/channel-example'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

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
  const mockServers: AsyncApiServerEntry[] = [
    createEntry({ name: 'production', url: 'mqtt://broker.example.com', description: 'Production server' }),
    createEntry({ name: 'staging', url: 'mqtt://staging.example.com', description: 'Staging server' }),
  ]

  const serverWithVariables: AsyncApiServerEntry[] = [
    createEntry({
      name: 'production',
      url: 'mqtt://{environment}.example.com',
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
      props: { servers: mockServers, selectedServer: mockServers[0]! },
    })

    expect(wrapper.text()).toContain('Server')
  })

  it('renders the selector when servers are available', () => {
    const wrapper = mount(AsyncApiServerSelector, {
      props: { servers: mockServers, selectedServer: mockServers[0]! },
    })

    expect(wrapper.findComponent({ name: 'Selector' }).exists()).toBe(true)
  })

  it('does not render the selector when no servers are available', () => {
    const wrapper = mount(AsyncApiServerSelector, {
      props: { servers: [], selectedServer: null },
    })

    expect(wrapper.findComponent({ name: 'Selector' }).exists()).toBe(false)
  })

  it('renders the selected server description', () => {
    const wrapper = mount(AsyncApiServerSelector, {
      props: { servers: mockServers, selectedServer: mockServers[1]! },
    })

    expect(wrapper.text()).toContain('Staging server')
  })

  it('normalizes AsyncAPI variables for the variables form', () => {
    const wrapper = mount(AsyncApiServerSelector, {
      props: { servers: serverWithVariables, selectedServer: serverWithVariables[0]! },
    })

    const variablesForm = wrapper.findComponent({ name: 'ServerVariablesForm' })
    expect(variablesForm.exists()).toBe(true)
    expect(variablesForm.props('variables')).toEqual({
      environment: { default: 'prod', description: 'Environment name', enum: ['prod', 'staging', 'dev'] },
    })
    expect(variablesForm.props('layout')).toBe('reference')
  })

  it('toggles the selection off when the active server is selected again', async () => {
    const wrapper = mount(AsyncApiServerSelector, {
      props: { servers: mockServers, selectedServer: mockServers[0]! },
    })

    expect(wrapper.text()).toContain('Production server')

    const selector = wrapper.findComponent({ name: 'Selector' })
    await selector.vm.$emit('update:modelValue', 'production')
    await nextTick()

    expect(wrapper.text()).not.toContain('Production server')
  })

  it('switches the active server when a different one is selected', async () => {
    const wrapper = mount(AsyncApiServerSelector, {
      props: { servers: mockServers, selectedServer: mockServers[0]! },
    })

    const selector = wrapper.findComponent({ name: 'Selector' })
    await selector.vm.$emit('update:modelValue', 'staging')
    await nextTick()

    expect(wrapper.text()).toContain('Staging server')
  })

  it('handles a null selectedServer gracefully', () => {
    const wrapper = mount(AsyncApiServerSelector, {
      props: { servers: mockServers, selectedServer: null },
    })

    expect(wrapper.text()).toContain('Server')
  })
})
