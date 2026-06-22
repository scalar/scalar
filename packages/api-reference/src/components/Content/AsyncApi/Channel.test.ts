import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import type { TraversedAsyncApiChannel } from '@scalar/workspace-store/schemas/navigation'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Channel from './Channel.vue'

function createChannel(overrides: Partial<TraversedAsyncApiChannel> = {}): TraversedAsyncApiChannel {
  return {
    type: 'asyncapi-channel',
    id: 'doc/channel/userSignedUp',
    title: 'User signups',
    channelName: 'userSignedUp',
    channelAddress: 'user/signedup',
    ...overrides,
  }
}

function createDocument(channelDescription?: string): AsyncApiDocument {
  return {
    asyncapi: '3.0.0',
    info: { title: 'Streaming API', version: '1.0.0' },
    'x-scalar-original-document-hash': '',
    channels: {
      userSignedUp: {
        address: 'user/signedup',
        description: channelDescription,
      },
    },
  } as AsyncApiDocument
}

function createDocumentWithChannel(channel: Record<string, unknown>): AsyncApiDocument {
  return {
    asyncapi: '3.0.0',
    info: { title: 'Streaming API', version: '1.0.0' },
    'x-scalar-original-document-hash': '',
    channels: { userSignedUp: channel },
  } as AsyncApiDocument
}

describe('Channel', () => {
  it('renders the channel address as the heading and the description below', () => {
    const wrapper = mount(Channel, {
      props: {
        channel: createChannel(),
        document: createDocument('Fired whenever a user signs up.'),
        layout: 'modern',
        isCollapsed: false,
        eventBus: null,
      },
    })

    const heading = wrapper.find('h2')
    expect(heading.text()).toContain('user/signedup')
    expect(wrapper.text()).toContain('Fired whenever a user signs up.')
  })

  it('renders without a description when the channel has none', () => {
    const wrapper = mount(Channel, {
      props: {
        channel: createChannel(),
        document: createDocument(),
        layout: 'modern',
        isCollapsed: false,
        eventBus: null,
      },
    })

    const heading = wrapper.find('h2')
    expect(heading.text()).toContain('user/signedup')
  })

  it('prefers channel.title over the address when present', () => {
    const wrapper = mount(Channel, {
      props: {
        channel: createChannel(),
        document: createDocumentWithChannel({
          address: 'user/signedup',
          title: 'User signups',
        }),
        layout: 'modern',
        isCollapsed: false,
        eventBus: null,
      },
    })

    expect(wrapper.find('h2').text()).toContain('User signups')
    expect(wrapper.find('h2').text()).not.toContain('user/signedup')
  })

  it('falls back to the channel key when neither title nor address is set', () => {
    const wrapper = mount(Channel, {
      props: {
        // Simulate the traversal fallback: address-less channels get `channelName` as `channelAddress`.
        channel: createChannel({ channelAddress: 'userSignedUp' }),
        document: createDocumentWithChannel({}),
        layout: 'modern',
        isCollapsed: false,
        eventBus: null,
      },
    })

    expect(wrapper.find('h2').text()).toContain('userSignedUp')
  })

  it('renders an accordion wrapper for the classic layout', () => {
    const wrapper = mount(Channel, {
      props: {
        channel: createChannel(),
        document: createDocument('Classic layout description.'),
        layout: 'classic',
        isCollapsed: false,
        eventBus: null,
      },
    })

    expect(wrapper.findComponent({ name: 'SectionContainerAccordion' }).exists()).toBe(true)
    expect(wrapper.text()).toContain('user/signedup')
    expect(wrapper.text()).toContain('Classic layout description.')
  })

  it('renders channel address parameters', () => {
    const wrapper = mount(Channel, {
      props: {
        channel: createChannel({ channelAddress: 'user/{userId}/signedup' }),
        document: createDocumentWithChannel({
          address: 'user/{userId}/signedup',
          parameters: {
            userId: { description: 'The unique user identifier' },
          },
        }),
        layout: 'modern',
        isCollapsed: false,
        eventBus: null,
      },
    })

    expect(wrapper.text()).toContain('Parameters')
    expect(wrapper.text()).toContain('userId')
    expect(wrapper.text()).toContain('The unique user identifier')
  })

  it('does not render a parameters section when the channel has none', () => {
    const wrapper = mount(Channel, {
      props: {
        channel: createChannel(),
        document: createDocument(),
        layout: 'modern',
        isCollapsed: false,
        eventBus: null,
      },
    })

    expect(wrapper.text()).not.toContain('Parameters')
  })

  const documentWithOperation = (): AsyncApiDocument =>
    ({
      asyncapi: '3.0.0',
      info: { title: 'Streaming API', version: '1.0.0' },
      'x-scalar-original-document-hash': '',
      channels: { userSignedUp: { address: 'user/signedup' } },
      operations: {
        onUserSignedUp: { action: 'receive', channel: { $ref: '#/channels/userSignedUp' } },
      },
    }) as unknown as AsyncApiDocument

  const channelWithOperation = (): TraversedAsyncApiChannel =>
    createChannel({
      children: [
        {
          type: 'asyncapi-operation',
          id: 'doc/channel/userSignedUp/operation/onUserSignedUp',
          title: 'On user signed up',
          operationName: 'onUserSignedUp',
          action: 'receive',
          channelName: 'userSignedUp',
          channelAddress: 'user/signedup',
        },
      ],
    })

  it('renders operation children nested under the channel in the modern layout', () => {
    const wrapper = mount(Channel, {
      props: {
        channel: channelWithOperation(),
        document: documentWithOperation(),
        layout: 'modern',
        isCollapsed: false,
        eventBus: null,
      },
    })

    expect(wrapper.findComponent({ name: 'Operation' }).exists()).toBe(true)
    expect(wrapper.text()).toContain('On user signed up')
  })

  it('renders operation children nested under the channel in the classic layout', () => {
    const wrapper = mount(Channel, {
      props: {
        channel: channelWithOperation(),
        document: documentWithOperation(),
        layout: 'classic',
        isCollapsed: false,
        eventBus: null,
      },
    })

    expect(wrapper.findComponent({ name: 'Operation' }).exists()).toBe(true)
    expect(wrapper.text()).toContain('On user signed up')
  })

  const documentWithServers = (channel: Record<string, unknown> = { address: 'user/signedup' }): AsyncApiDocument =>
    ({
      asyncapi: '3.0.0',
      info: { title: 'Streaming API', version: '1.0.0' },
      'x-scalar-original-document-hash': '',
      servers: {
        production: { host: 'galaxy.scalar.com', protocol: 'wss' },
        development: { host: 'localhost', protocol: 'ws' },
      },
      channels: { userSignedUp: channel },
    }) as unknown as AsyncApiDocument

  it.each(['modern', 'classic'] as const)(
    'renders server and protocol labels for every document server in the %s layout',
    (layout) => {
      const wrapper = mount(Channel, {
        props: {
          channel: createChannel(),
          document: documentWithServers(),
          layout,
          isCollapsed: false,
          eventBus: null,
        },
      })

      const text = wrapper.text()
      expect(text).toContain('production')
      expect(text).toContain('development')
      expect(text).toContain('wss')
      expect(text).toContain('ws')
    },
  )

  it('restricts labels to the servers the channel declares', () => {
    const wrapper = mount(Channel, {
      props: {
        channel: createChannel(),
        document: documentWithServers({
          address: 'user/signedup',
          servers: [{ $ref: '#/servers/production' }],
        }),
        layout: 'modern',
        isCollapsed: false,
        eventBus: null,
      },
    })

    const text = wrapper.text()
    expect(text).toContain('production')
    expect(text).toContain('wss')
    expect(text).not.toContain('development')
  })

  it('de-duplicates protocols shared across servers', () => {
    const wrapper = mount(Channel, {
      props: {
        channel: createChannel(),
        document: {
          asyncapi: '3.0.0',
          info: { title: 'Streaming API', version: '1.0.0' },
          'x-scalar-original-document-hash': '',
          servers: {
            primary: { host: 'a.example.com', protocol: 'wss' },
            secondary: { host: 'b.example.com', protocol: 'wss' },
          },
          channels: { userSignedUp: { address: 'user/signedup' } },
        } as unknown as AsyncApiDocument,
        layout: 'modern',
        isCollapsed: false,
        eventBus: null,
      },
    })

    // Both server names show, but the shared protocol only renders once.
    expect(wrapper.findAll('.async-api-label--protocol')).toHaveLength(1)
  })

  // Regression: both layouts must forward `expandedItems` to Operation so sidebar
  // navigation can expand the nested message accordions.
  it.each(['modern', 'classic'] as const)('forwards expandedItems to the operation in the %s layout', (layout) => {
    const expandedItems = { 'doc/channel/userSignedUp/operation/onUserSignedUp': true }
    const wrapper = mount(Channel, {
      props: {
        channel: channelWithOperation(),
        document: documentWithOperation(),
        layout,
        isCollapsed: false,
        eventBus: null,
        expandedItems,
      },
    })

    const operation = wrapper.findComponent({ name: 'Operation' })
    expect(operation.exists()).toBe(true)
    // The original bug passed a disconnected empty object here; assert the map is forwarded.
    expect(operation.props('expandedItems')).toEqual(expandedItems)
  })
})
