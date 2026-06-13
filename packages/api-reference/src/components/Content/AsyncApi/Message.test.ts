import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import type { TraversedAsyncApiMessage } from '@scalar/workspace-store/schemas/navigation'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Message from './Message.vue'

function createMessage(overrides: Partial<TraversedAsyncApiMessage> = {}): TraversedAsyncApiMessage {
  return {
    type: 'asyncapi-message',
    id: 'doc/channel/userSignedUp/operation/onUserSignedUp/message/userSignedUp',
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
  it('renders the message title and description', () => {
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        document: createDocument({ title: 'User signed up', description: 'Emitted on signup.' }),
        eventBus: null,
      },
    })

    expect(wrapper.text()).toContain('User signed up')
    expect(wrapper.text()).toContain('Emitted on signup.')
  })

  it('renders the payload schema', () => {
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        document: createDocument({
          payload: { type: 'object', properties: { id: { type: 'string' } } },
        }),
        eventBus: null,
      },
    })

    expect(wrapper.text()).toContain('Payload')
    expect(wrapper.text()).toContain('id')
  })

  it('unwraps a Multi Format Schema payload', () => {
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        document: createDocument({
          payload: {
            schemaFormat: 'application/vnd.aai.asyncapi+json;version=3.0.0',
            schema: { type: 'object', properties: { email: { type: 'string' } } },
          },
        }),
        eventBus: null,
      },
    })

    expect(wrapper.text()).toContain('Payload')
    expect(wrapper.text()).toContain('email')
  })

  it('renders message headers when present', () => {
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        document: createDocument({
          headers: { type: 'object', properties: { 'x-token': { type: 'string' } } },
        }),
        eventBus: null,
      },
    })

    expect(wrapper.text()).toContain('Headers')
    expect(wrapper.text()).toContain('x-token')
  })

  it('does not render a payload section when the message has no payload', () => {
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        document: createDocument({ title: 'User signed up' }),
        eventBus: null,
      },
    })

    expect(wrapper.text()).not.toContain('Payload')
  })
})
