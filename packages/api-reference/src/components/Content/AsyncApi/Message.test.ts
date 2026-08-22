import { ScalarCodeBlock } from '@scalar/components/code-block'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import type { TraversedAsyncApiMessage } from '@scalar/workspace-store/schemas/navigation'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick, reactive } from 'vue'

import Message from './Message.vue'

const MESSAGE_ID = 'doc/channel/userSignedUp/operation/onUserSignedUp/message/userSignedUp'

function createMessage(overrides: Partial<TraversedAsyncApiMessage> = {}): TraversedAsyncApiMessage {
  return {
    type: 'asyncapi-message',
    id: MESSAGE_ID,
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

/** Expand this message's accordion so the body (description, schemas) renders. */
const expanded = { [MESSAGE_ID]: true }

describe('Message', () => {
  it('renders the message title in the collapsed header', () => {
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        document: createDocument({ title: 'User signed up', payload: { type: 'object' } }),
        eventBus: null,
      },
    })

    expect(wrapper.text()).toContain('User signed up')
  })

  it('keeps the body collapsed by default and shows it once expanded', () => {
    const props = {
      message: createMessage(),
      document: createDocument({ description: 'Emitted on signup.', payload: { type: 'object' } }),
      eventBus: null,
    }

    const collapsed = mount(Message, { props })
    expect(collapsed.text()).not.toContain('Emitted on signup.')

    const open = mount(Message, { props: { ...props, expandedItems: expanded } })
    expect(open.text()).toContain('Emitted on signup.')
  })

  it('opens the accordion on click even without an event bus', async () => {
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        document: createDocument({ description: 'Emitted on signup.', payload: { type: 'object' } }),
        eventBus: null,
      },
    })

    expect(wrapper.text()).not.toContain('Emitted on signup.')
    await wrapper.find('.section-accordion-button').trigger('click')
    expect(wrapper.text()).toContain('Emitted on signup.')
  })

  it('opens when the shared expandedItems map is updated (sidebar navigation)', async () => {
    const expandedItems = reactive<Record<string, boolean>>({})
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        document: createDocument({ description: 'Emitted on signup.', payload: { type: 'object' } }),
        eventBus: null,
        expandedItems,
      },
    })

    expect(wrapper.text()).not.toContain('Emitted on signup.')

    // Mirror what sidebarState.setExpanded does on navigation: mutate the shared map.
    expandedItems[MESSAGE_ID] = true
    await nextTick()

    expect(wrapper.text()).toContain('Emitted on signup.')
  })

  it('emits toggle:nav-item when the accordion is toggled', async () => {
    const emit = vi.fn()
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        document: createDocument({ payload: { type: 'object' } }),
        eventBus: { emit } as never,
      },
    })

    await wrapper.find('.section-accordion-button').trigger('click')

    expect(emit).toHaveBeenCalledWith('toggle:nav-item', { id: MESSAGE_ID, open: true })
  })

  it('renders the payload schema when expanded', () => {
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        document: createDocument({
          payload: { type: 'object', properties: { id: { type: 'string' } } },
        }),
        eventBus: null,
        expandedItems: expanded,
      },
    })

    expect(wrapper.text()).toContain('Payload')
    expect(wrapper.text()).toContain('id')
  })

  it('unwraps a Multi Format Schema payload when expanded', () => {
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
        expandedItems: expanded,
      },
    })

    expect(wrapper.text()).toContain('Payload')
    expect(wrapper.text()).toContain('email')
  })

  it('renders message headers when present and expanded', () => {
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        document: createDocument({
          headers: { type: 'object', properties: { 'x-token': { type: 'string' } } },
        }),
        eventBus: null,
        expandedItems: expanded,
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
        expandedItems: expanded,
      },
    })

    expect(wrapper.text()).not.toContain('Payload')
  })

  const documentWithServers = (message: Record<string, unknown>): AsyncApiDocument =>
    ({
      asyncapi: '3.0.0',
      info: { title: 'Streaming API', version: '1.0.0' },
      'x-scalar-original-document-hash': '',
      servers: {
        production: { host: 'galaxy.scalar.com', protocol: 'wss' },
        development: { host: 'localhost', protocol: 'ws' },
      },
      channels: {
        userSignedUp: {
          address: 'user/signedup',
          messages: { userSignedUp: message },
        },
      },
    }) as unknown as AsyncApiDocument

  it("exposes every protocol the message's channel servers speak, even without bindings", () => {
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        document: documentWithServers({ title: 'User signed up' }),
        eventBus: null,
      },
    })

    const protocols = wrapper.findAll('.async-api-label--protocol').map((el) => el.text())
    expect(protocols).toContain('wss')
    expect(protocols).toContain('ws')
  })

  it('unions message binding protocols with the channel server protocols', () => {
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        document: documentWithServers({
          title: 'User signed up',
          // Declares a kafka binding that no server speaks; it should still surface.
          bindings: { kafka: { groupId: 'g1' } },
        }),
        eventBus: null,
      },
    })

    const protocols = wrapper.findAll('.async-api-label--protocol').map((el) => el.text())
    expect(protocols).toContain('wss')
    expect(protocols).toContain('ws')
    expect(protocols).toContain('kafka')
  })

  it('falls back to message binding protocols when no servers are defined', () => {
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        document: createDocument({
          title: 'User signed up',
          bindings: { ws: { method: 'GET' }, mqtt: {} },
        }),
        eventBus: null,
      },
    })

    const protocols = wrapper.findAll('.async-api-label--protocol').map((el) => el.text())
    expect(protocols).toContain('ws')
    expect(protocols).toContain('mqtt')
  })

  it('renders the correlationId when expanded', () => {
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        document: createDocument({
          payload: { type: 'object' },
          correlationId: { location: '$message.header#/correlationId', description: 'Tracks the request.' },
        }),
        eventBus: null,
        expandedItems: expanded,
      },
    })

    expect(wrapper.text()).toContain('Correlation ID')
    expect(wrapper.text()).toContain('$message.header#/correlationId')
    expect(wrapper.text()).toContain('Tracks the request.')
  })

  it('renders message examples when expanded', () => {
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        document: createDocument({
          payload: { type: 'object' },
          examples: [{ name: 'signup', summary: 'A signup event', payload: { userId: '42' } }],
        }),
        eventBus: null,
        expandedItems: expanded,
      },
    })

    expect(wrapper.text()).toContain('Examples')
    expect(wrapper.text()).toContain('signup')
    expect(wrapper.text()).toContain('A signup event')
  })

  it('does not render a payload code block for an example with a null payload', () => {
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        document: createDocument({
          payload: { type: 'object' },
          examples: [{ name: 'empty', payload: null }],
        }),
        eventBus: null,
        expandedItems: expanded,
      },
    })

    expect(wrapper.text()).toContain('empty')
    // A null payload must be skipped, not rendered as an empty (or "null") code block.
    expect(wrapper.findAllComponents(ScalarCodeBlock)).toHaveLength(0)
  })

  it('renders message bindings when expanded', () => {
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        document: createDocument({
          payload: { type: 'object' },
          bindings: { kafka: { key: 'user-id' } },
        }),
        eventBus: null,
        expandedItems: expanded,
      },
    })

    expect(wrapper.text()).toContain('Bindings')
    expect(wrapper.text()).toContain('kafka')
  })

  it('renders message tags when expanded', () => {
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        document: createDocument({ payload: { type: 'object' }, tags: [{ name: 'events' }] }),
        eventBus: null,
        expandedItems: expanded,
      },
    })

    expect(wrapper.text()).toContain('events')
  })
})
