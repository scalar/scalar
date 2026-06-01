import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import type { TraversedAsyncApiMessage } from '@scalar/workspace-store/schemas/navigation'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Message from './Message.vue'

function createMessage(overrides: Partial<TraversedAsyncApiMessage> = {}): TraversedAsyncApiMessage {
  return {
    type: 'asyncapi-message',
    id: 'doc/channel/userSignedUp/message/userSignedUp',
    title: 'User signed up',
    messageName: 'userSignedUp',
    channelName: 'userSignedUp',
    ...overrides,
  }
}

function createDocument(message: Record<string, unknown>): AsyncApiDocument {
  return {
    asyncapi: '3.0.0',
    info: { title: 'Streaming API', version: '1.0.0' },
    'x-scalar-original-document-hash': '',
    channels: {
      userSignedUp: {
        address: 'user/signedup',
        messages: { userSignedUp: message },
      },
    },
  } as AsyncApiDocument
}

describe('Message', () => {
  it('renders the title on the accordion with the summary inside', () => {
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        document: createDocument({
          title: 'User signed up',
          summary: 'Notifies when a user signs up.',
        }),
        eventBus: null,
        isCollapsed: false,
      },
    })

    expect(wrapper.find('h3').text()).toContain('User signed up')
    expect(wrapper.text()).toContain('Notifies when a user signs up.')
  })

  it('falls back to the message name when no title is set', () => {
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        document: createDocument({ name: 'UserSignedUp' }),
        eventBus: null,
        isCollapsed: false,
      },
    })

    expect(wrapper.find('h3').text()).toContain('UserSignedUp')
  })

  it('falls back to the message map key when neither title nor name is set', () => {
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        document: createDocument({}),
        eventBus: null,
        isCollapsed: false,
      },
    })

    expect(wrapper.find('h3').text()).toContain('userSignedUp')
  })

  it('renders the payload schema with the Schema component', () => {
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        document: createDocument({
          title: 'User signed up',
          payload: {
            type: 'object',
            properties: { userId: { type: 'string' } },
          },
        }),
        eventBus: null,
        isCollapsed: false,
      },
    })

    expect(wrapper.findComponent({ name: 'Schema' }).exists()).toBe(true)
    expect(wrapper.text()).toContain('userId')
  })

  it('unwraps a multi-format payload before rendering the schema', () => {
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        document: createDocument({
          title: 'User signed up',
          payload: {
            schemaFormat: 'application/vnd.aai.asyncapi;version=3.0.0',
            schema: {
              type: 'object',
              properties: { email: { type: 'string' } },
            },
          },
        }),
        eventBus: null,
        isCollapsed: false,
      },
    })

    expect(wrapper.text()).toContain('email')
  })

  it('keeps the payload collapsed when isCollapsed is true', () => {
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        document: createDocument({
          title: 'User signed up',
          payload: {
            type: 'object',
            properties: { userId: { type: 'string' } },
          },
        }),
        eventBus: null,
        isCollapsed: true,
      },
    })

    // The heading is always visible, but the body (payload) stays hidden.
    expect(wrapper.find('h3').text()).toContain('User signed up')
    expect(wrapper.findComponent({ name: 'Schema' }).exists()).toBe(false)
  })
})
