import { ScalarCopy } from '@scalar/components/copy'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import type { TraversedAsyncApiMessage } from '@scalar/workspace-store/schemas/navigation'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick, reactive } from 'vue'

import Message from './Message.vue'
import MessageExamples from './MessageExamples.vue'

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
  it('renders correlation metadata even without a description or schema', () => {
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        document: createDocument({
          correlationId: {
            description: 'Trace **related messages**.',
            location: '$message.header#/id',
          },
        }),
        eventBus: null,
        expandedItems: expanded,
      },
    })
    expect(wrapper.text()).toContain('Correlation ID')
    expect(wrapper.get('strong').text()).toBe('related messages')
    expect(wrapper.get('code').text()).toBe('$message.header#/id')
    expect(wrapper.find('a[href]').exists()).toBe(false)
  })

  it('inherits referenced correlation metadata and keeps message overrides', async () => {
    const trait = {
      correlationId: {
        $ref: '#/components/correlationIds/common',
        '$ref-value': { description: 'Shared tracing ID', location: '$message.header#/id' },
      },
    }
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        document: createDocument({ traits: [trait] }),
        eventBus: null,
        expandedItems: expanded,
      },
    })
    expect(wrapper.text()).toContain('Shared tracing ID')
    expect(wrapper.get('code').text()).toBe('$message.header#/id')
    await wrapper.setProps({
      document: createDocument({
        traits: [trait],
        correlationId: {
          description: 'Local tracing ID',
          location: '$message.payload#/id',
        },
      }),
    })
    expect(wrapper.text()).not.toContain('Shared tracing ID')
    expect(wrapper.text()).toContain('Local tracing ID')
    expect(wrapper.get('code').text()).toBe('$message.payload#/id')
  })

  it('links a deeply nested payload field and opens its ancestors on navigation', async () => {
    const bus = createWorkspaceEventBus()
    const scroll = vi.fn()
    bus.on('scroll-to:nav-item', scroll)
    const targetId = `${MESSAGE_ID}.payload.metadata.trace.id`
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        eventBus: bus,
        expandedItems: expanded,
        document: createDocument({
          correlationId: { location: '$message.payload#/metadata/trace/id' },
          payload: {
            type: 'object',
            properties: {
              metadata: {
                type: 'object',
                properties: {
                  trace: { type: 'object', properties: { id: { type: 'string' } } },
                },
              },
            },
          },
        }),
      },
    })
    expect(wrapper.find(`[id="${targetId}"]`).exists()).toBe(false)
    const link = wrapper.get('a[href]')
    expect(link.text()).toBe('$message.payload#/metadata/trace/id')
    expect(link.attributes('href')).toBe(`#${encodeURIComponent(targetId)}`)
    await link.trigger('click')
    expect(scroll).toHaveBeenCalledExactlyOnceWith({ id: targetId })
    await wrapper.setProps({ scrollTargetId: targetId })
    expect(wrapper.get(`[id="${targetId}"]`).text()).toBe('id')
    expect(wrapper.get(`[id="${targetId}"]`).attributes('tabindex')).toBe('-1')
  })

  it('links referenced header fields and whole payload locations to their own message', () => {
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        eventBus: null,
        expandedItems: expanded,
        document: createDocument({
          correlationId: {
            $ref: '#/components/correlationIds/common',
            '$ref-value': { location: '$message.header#/correlationId' },
          },
          headers: { type: 'object', properties: { correlationId: { type: 'string' } } },
        }),
      },
    })
    expect(wrapper.get('a[href]').attributes('href')).toBe(
      `#${encodeURIComponent(`${MESSAGE_ID}.headers.correlationId`)}`,
    )
    expect(wrapper.get(`[id="${MESSAGE_ID}.headers.correlationId"]`).text()).toBe('correlationId')
  })

  it.each(['allOf', 'oneOf', 'anyOf'])('links fields rendered from a single %s branch', async (composition) => {
    const targetId = `${MESSAGE_ID}.payload.id`
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        eventBus: null,
        expandedItems: expanded,
        document: createDocument({
          correlationId: { location: '$message.payload#/id' },
          payload: { [composition]: [{ type: 'object', properties: { id: { type: 'string' } } }] },
        }),
      },
    })
    expect(wrapper.get('a[href]').attributes('href')).toBe(`#${encodeURIComponent(targetId)}`)
    await wrapper.setProps({ scrollTargetId: targetId })
    expect(wrapper.get(`[id="${targetId}"]`).text()).toBe('id')
  })

  it('omits correlation metadata when absent or unresolved', () => {
    for (const correlationId of [undefined, { $ref: '#/components/correlationIds/missing' }]) {
      const wrapper = mount(Message, {
        props: {
          message: createMessage(),
          document: createDocument({ correlationId }),
          eventBus: null,
          expandedItems: expanded,
        },
      })
      expect(wrapper.text()).not.toContain('Correlation ID')
    }
  })

  it('regenerates displayed and copied payloads after nested schema edits', async () => {
    const payload = reactive({ type: 'object', properties: { id: { type: 'string', const: 'first' } } })
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        eventBus: null,
        expandedItems: expanded,
        document: createDocument({ payload }),
      },
    })
    const examples = wrapper.getComponent(MessageExamples)
    expect(examples.get('pre').text()).toBe(JSON.stringify({ id: 'first' }, null, 2))
    payload.properties.id.const = 'second'
    await nextTick()
    expect(examples.get('pre').text()).toBe(JSON.stringify({ id: 'second' }, null, 2))
    expect(examples.getComponent(ScalarCopy).props('content')).toBe(JSON.stringify({ id: 'second' }, null, 2))
    payload.properties.id.const = 'third'
    await nextTick()
    expect(examples.get('pre').text()).toBe(JSON.stringify({ id: 'third' }, null, 2))
  })

  it('generates only after expanding and updates when the payload schema changes', async () => {
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        document: createDocument({ payload: { type: 'string', const: 'first' } }),
        eventBus: null,
      },
    })
    expect(wrapper.findComponent(MessageExamples).exists()).toBe(false)
    await wrapper.get('button.section-accordion-button').trigger('click')
    expect(wrapper.getComponent(MessageExamples).text()).toContain('Generated example')
    expect(wrapper.getComponent(MessageExamples).get('pre').text()).toBe('first')
    await wrapper.setProps({ document: createDocument({ payload: { type: 'string', const: 'second' } }) })
    expect(wrapper.getComponent(MessageExamples).get('pre').text()).toBe('second')
  })

  it('uses inherited payload examples instead of generating', () => {
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        eventBus: null,
        expandedItems: expanded,
        document: createDocument({
          payload: { type: 'string', const: 'generated' },
          traits: [{ examples: [{ name: 'Inherited', payload: 'authored' }] }],
        }),
      },
    })
    const examples = wrapper.getComponent(MessageExamples)
    expect(examples.get('pre').text()).toBe('authored')
    expect(examples.text()).not.toContain('Generated example')
  })

  it('renders inherited headers alongside message headers and uses the message title', () => {
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        document: createDocument({
          title: 'Local title',
          traits: [
            {
              $ref: '#/components/messageTraits/common',
              '$ref-value': {
                title: 'Trait title',
                description: 'Shared message description',
                headers: { type: 'object', properties: { correlationId: { type: 'string' } } },
              },
            },
          ],
          headers: { type: 'object', properties: { tenantId: { type: 'string' } } },
        }),
        expandedItems: expanded,
        eventBus: null,
      },
    })

    expect(wrapper.text()).toContain('Local title')
    expect(wrapper.text()).not.toContain('Trait title')
    expect(wrapper.text()).toContain('Shared message description')
    expect(wrapper.text()).toContain('correlationId')
    expect(wrapper.text()).toContain('tenantId')
  })

  it('shows message-level examples when expanded', () => {
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        document: createDocument({ examples: [{ payload: { id: 'event-123' } }] }),
        eventBus: null,
        expandedItems: expanded,
      },
    })
    expect(wrapper.text()).toContain('Examples')
    expect(wrapper.get('pre').text()).toBe('{\n  "id": "event-123"\n}')
  })

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
})
