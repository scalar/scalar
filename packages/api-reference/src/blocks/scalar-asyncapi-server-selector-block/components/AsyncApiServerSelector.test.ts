import { type AsyncApiServerEntry, getAsyncApiServers } from '@scalar/workspace-store/channel-example'
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

  it('updates documentation when the selected server changes', async () => {
    const servers = ['production', 'staging'].map((name) =>
      createEntry({
        name,
        url: `mqtt://${name}.example.com`,
        server: {
          host: `${name}.example.com`,
          protocol: 'mqtt',
          protocolVersion: '5.0',
          summary: `${name} event stream`,
          externalDocs: { url: `https://example.com/${name}`, description: `**${name}** guide` },
          tags: [{ name: 'Broker', externalDocs: { url: `https://example.com/${name}-tag` } }],
        },
      }),
    )
    const wrapper = mount(AsyncApiServerSelector, { props: { servers, selectedServer: servers[0]!, eventBus } })
    expect(wrapper.findAll('a').map((link) => link.attributes('href'))).toStrictEqual([
      'https://example.com/production',
      'https://example.com/production-tag',
    ])
    await wrapper.setProps({ selectedServer: servers[1]! })
    expect(wrapper.findAll('a').map((link) => link.attributes('href'))).toStrictEqual([
      'https://example.com/staging',
      'https://example.com/staging-tag',
    ])
    expect(wrapper.get('a').text()).toBe('**staging** guide')
    expect(wrapper.text()).toContain('staging event stream')
    expect(wrapper.text()).toContain('MQTT 5.0')
  })

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

  it('renders metadata from a referenced server and updates it with the selection', async () => {
    const servers = getAsyncApiServers(
      {
        asyncapi: '3.1.0',
        'x-scalar-original-document-hash': '',
        info: { title: 'Events', version: '1.0.0' },
        servers: {
          production: {
            $ref: '#/components/servers/broker',
            '$ref-value': {
              host: 'broker.example.com',
              protocol: 'mqtt',
              protocolVersion: '5.0',
              title: 'Production broker',
              summary: 'Public event stream',
              description: 'Connect with **TLS**.',
            },
          },
          staging: {
            host: 'staging.example.com',
            protocol: 'amqp',
            protocolVersion: '0-9-1',
            title: 'Staging broker',
            summary: 'Preview event stream',
          },
        },
      },
      { webSocketOnly: false },
    )
    const wrapper = mount(AsyncApiServerSelector, {
      props: { servers, selectedServer: servers[0]!, eventBus },
    })

    expect(wrapper.text()).toContain('Production broker · mqtt://broker.example.com')
    expect(wrapper.text()).toContain('MQTT 5.0')
    expect(wrapper.text()).toContain('Public event stream')
    expect(wrapper.find('strong').text()).toBe('TLS')

    await wrapper.setProps({ selectedServer: servers[1] })

    expect(wrapper.text()).toContain('Staging broker · amqp://staging.example.com')
    expect(wrapper.text()).toContain('AMQP 0-9-1')
    expect(wrapper.text()).toContain('Preview event stream')
    expect(wrapper.text()).not.toContain('Public event stream')
    expect(wrapper.text()).not.toContain('MQTT 5.0')
    expect(wrapper.text()).not.toContain('Connect with')
  })

  it('omits empty metadata and treats summaries as plain text', async () => {
    const server = createEntry({
      name: 'production',
      url: 'mqtt://broker.example.com',
      server: { host: 'broker.example.com', protocol: 'mqtt', summary: '**Plain summary**', protocolVersion: ' ' },
    })
    const wrapper = mount(AsyncApiServerSelector, {
      props: { servers: [server], selectedServer: server, eventBus },
    })

    expect(wrapper.text()).toContain('**Plain summary**')
    expect(wrapper.find('strong').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('MQTT')

    await wrapper.setProps({ selectedServer: { ...server, server: { ...server.server, summary: '  ' } } })
    expect(wrapper.text()).toBe('ServerServer:production · mqtt://broker.example.com')
  })

  it('handles a null selectedServer gracefully', () => {
    const wrapper = mount(AsyncApiServerSelector, {
      props: { servers: mockServers, selectedServer: null, eventBus },
    })

    expect(wrapper.text()).toContain('Server')
  })
})
