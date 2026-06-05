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
})
