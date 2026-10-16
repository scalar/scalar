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
  it.each([
    { title: 'Event title', summary: 'Event summary', description: 'Event description', heading: 'Event title' },
    { title: 'Event title', summary: 'Event summary', description: undefined, heading: 'Event title' },
    { title: 'Event title', summary: undefined, description: 'Event description', heading: 'Event title' },
    { title: 'Event title', summary: undefined, description: undefined, heading: 'Event title' },
    { title: undefined, summary: 'Event summary', description: 'Event description', heading: 'Event summary' },
    { title: undefined, summary: 'Event summary', description: undefined, heading: 'Event summary' },
    { title: undefined, summary: undefined, description: 'Event description', heading: 'userSignedUp' },
    { title: undefined, summary: undefined, description: undefined, heading: 'userSignedUp' },
    { title: '  ', summary: '  Event summary  ', description: 'Event description', heading: 'Event summary' },
    { title: 'Event title', summary: '  ', description: 'Event description', heading: 'Event title' },
  ])('renders metadata once with $title, $summary, and $description', ({ title, summary, description, heading }) => {
    const wrapper = mount(Message, {
      props: {
        message: createMessage({ title: 'userSignedUp' }),
        document: createDocument({ title, summary, description }),
        eventBus: null,
        expandedItems: expanded,
      },
    })

    expect(wrapper.get('h1, h2, h3, h4, h5, h6').text()).toBe(heading)
    for (const value of [title, summary, description]) {
      if (value?.trim()) {
        expect(wrapper.text().split(value.trim()).length - 1).toBe(1)
      }
    }
  })

  it.each([false, true])('renders trait metadata with local overrides: %s', (override) => {
    const wrapper = mount(Message, {
      props: {
        message: createMessage({ title: 'userSignedUp' }),
        document: createDocument({
          traits: [
            { title: 'Initial title', summary: 'Initial summary', description: 'Initial description' },
            {
              $ref: '#/components/messageTraits/prose',
              '$ref-value': { title: 'Trait title', summary: 'Trait summary', description: 'Trait description' },
            },
          ],
          ...(override ? { title: 'Local title', summary: 'Local summary', description: 'Local description' } : {}),
        }),
        eventBus: null,
        expandedItems: expanded,
      },
    })

    const source = override ? 'Local' : 'Trait'
    expect(wrapper.get('h1, h2, h3, h4, h5, h6').text()).toBe(`${source} title`)
    for (const field of ['title', 'summary', 'description']) {
      expect(wrapper.text().split(`${source} ${field}`).length - 1).toBe(1)
      expect(wrapper.text().includes(`Initial ${field}`)).toBe(false)
      if (override) {
        expect(wrapper.text().includes(`Trait ${field}`)).toBe(false)
      }
    }
  })

  it('uses an inherited summary as the heading without repeating it', () => {
    const wrapper = mount(Message, {
      props: {
        message: createMessage({ title: 'userSignedUp' }),
        document: createDocument({ traits: [{ summary: 'Inherited summary', description: 'Inherited description' }] }),
        eventBus: null,
        expandedItems: expanded,
      },
    })
    expect(wrapper.get('h1, h2, h3, h4, h5, h6').text()).toBe('Inherited summary')
    expect(wrapper.text().split('Inherited summary').length - 1).toBe(1)
    expect(wrapper.text().includes('Inherited description')).toBe(true)
  })

  it('omits message tags for canonical messages and inline replies', () => {
    for (const inline of [false, true]) {
      const wrapper = mount(Message, {
        props: {
          message: createMessage(),
          document: createDocument({ tags: [{ name: 'Redundant tag' }] }),
          eventBus: null,
          inline,
        },
      })
      expect(wrapper.text()).not.toContain('Redundant tag')
    }
  })

  it.each(['payload', 'headers'])('renders referenced non-JSON %s as copyable source', (field) => {
    const schema = 'message User { string id = 1; }'
    const format = 'application/vnd.google.protobuf;version=3'
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        eventBus: null,
        expandedItems: expanded,
        document: createDocument({
          [field]: { $ref: '#/components/schemas/User', '$ref-value': { schemaFormat: format, schema } },
        }),
      },
    })
    expect(wrapper.text()).toContain(format)
    expect(wrapper.getComponent(ScalarCopy).props('content')).toBe(schema)
    expect(wrapper.getComponent(MessageExamples).props('generatedPayload')).toBeUndefined()
    expect(wrapper.find(`[id="${MESSAGE_ID}.${field}"]`).exists()).toBe(true)
  })

  it('switches a payload from source rendering back to JSON Schema', async () => {
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        eventBus: null,
        expandedItems: expanded,
        document: createDocument({ payload: { schemaFormat: 'application/x-custom', schema: 'source text' } }),
      },
    })
    expect(wrapper.text()).toContain('source text')
    await wrapper.setProps({
      document: createDocument({ payload: { type: 'object', properties: { userId: { type: 'string' } } } }),
    })
    expect(wrapper.text()).toContain('userId')
    expect(wrapper.text()).not.toContain('source text')
  })

  it('renders bindings on a message with no prose or schemas, including trait fields', () => {
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        eventBus: null,
        expandedItems: expanded,
        document: createDocument({
          traits: [{ bindings: { kafka: { bindingVersion: '0.5.0', schemaIdLocation: 'payload' } } }],
          bindings: { kafka: { bindingVersion: '0.4.0' } },
        }),
      },
    })
    expect(wrapper.text()).toContain('Bindings')
    expect(wrapper.text()).toContain('0.4.0')
    expect(wrapper.text()).toContain('schemaIdLocation')
    expect(wrapper.text()).not.toContain('0.5.0')
  })

  it.each([
    [{ contentType: 'application/xml' }, 'application/xml'],
    [{ traits: [{ contentType: 'text/plain' }] }, 'text/plain'],
    [{}, 'application/json'],
  ])('displays the effective content type without examples: %j', (message, expected) => {
    const document = { ...createDocument(message), defaultContentType: 'application/json' }
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        eventBus: null,
        expandedItems: expanded,
        document,
      },
    })
    expect(wrapper.text()).toContain(expected)
    expect(wrapper.getComponent(MessageExamples).props('contentType')).toBe(expected)
  })

  it('reactively passes document defaults and message overrides to examples', async () => {
    const document = createDocument({ examples: [{ payload: '<event />' }] })
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        eventBus: null,
        expandedItems: expanded,
        document,
      },
    })
    expect(wrapper.text()).not.toContain('Content type')
    expect(wrapper.getComponent(MessageExamples).props('contentType')).toBeUndefined()
    await wrapper.setProps({ document: { ...document, defaultContentType: 'application/xml' } })
    expect(wrapper.getComponent(MessageExamples).props('contentType')).toBe('application/xml')
    await wrapper.setProps({
      document: {
        ...createDocument({ contentType: 'text/plain', examples: [{ payload: '<event />' }] }),
        defaultContentType: 'application/xml',
      },
    })
    expect(wrapper.getComponent(MessageExamples).props('contentType')).toBe('text/plain')
  })

  it.each([true, false])('explains boolean allOf payload members: %j', (value) => {
    const document = createDocument({ payload: { allOf: [value] } })
    const wrapper = mount(Message, {
      props: { message: createMessage(), eventBus: null, expandedItems: expanded, document },
    })
    expect(wrapper.text()).toContain(value ? 'Accepts any value.' : 'Accepts no value.')
    if (!value) {
      expect(wrapper.getComponent(MessageExamples).props('generatedPayload')).toBeUndefined()
    }
  })

  it.each([true, false])('renders a boolean payload with its validation meaning: %j', (payload) => {
    const document = createDocument({ payload })
    const wrapper = mount(Message, {
      props: { message: createMessage(), eventBus: null, expandedItems: expanded, document },
    })
    expect(wrapper.text()).toContain('Payload')
    expect(wrapper.text()).toContain(payload ? 'Accepts any value.' : 'Accepts no value.')
    expect(wrapper.getComponent(MessageExamples).props('generatedPayload')).toBeUndefined()
    expect(document).toStrictEqual(createDocument({ payload }))
  })

  it.each(['payload', 'headers'])('renders boolean properties in %s without dropping false', (field) => {
    const schema = { type: 'object', properties: { anything: true, forbidden: false }, required: ['anything'] }
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        eventBus: null,
        expandedItems: expanded,
        document: createDocument({ [field]: schema }),
      },
    })
    expect(wrapper.text()).toContain('anything')
    expect(wrapper.text()).toContain('forbidden')
    expect(wrapper.text()).toContain('Accepts any value.')
    expect(wrapper.text()).toContain('Accepts no value.')
    expect(schema.properties).toStrictEqual({ anything: true, forbidden: false })
  })

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
    await wrapper.get('button.collapsible-section-toggle').trigger('click')
    expect(wrapper.getComponent(MessageExamples).text()).toContain('Example')
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
    expect(examples.text()).not.toContain('Example')
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
    expect(wrapper.findComponent(MessageExamples).exists()).toBe(true)
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
    await wrapper.find('.collapsible-section-toggle').trigger('click')
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

    await wrapper.find('.collapsible-section-toggle').trigger('click')

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

  it('omits inherited protocol badges while retaining message binding details', () => {
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        document: documentWithServers({ title: 'User signed up', bindings: { kafka: { bindingVersion: '0.5.0' } } }),
        eventBus: null,
        expandedItems: expanded,
      },
    })
    expect(wrapper.text()).not.toContain('wss')
    expect(wrapper.text()).not.toContain('ws')
    expect(wrapper.text()).toContain('kafka')
    expect(wrapper.text()).toContain('0.5.0')
  })

  it('opens from navigation state and allows keyboard-accessible toggling', async () => {
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        document: createDocument({ description: 'Message details' }),
        eventBus: null,
        expandedItems: expanded,
      },
    })
    const toggle = wrapper.get('button.collapsible-section-toggle')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(wrapper.text()).toContain('Message details')
    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(wrapper.text()).not.toContain('Message details')
    await toggle.trigger('click')
    expect(wrapper.text()).toContain('Message details')
  })

  it('starts collapsed without navigation state', () => {
    const wrapper = mount(Message, {
      props: {
        message: createMessage(),
        document: createDocument({ description: 'Message details' }),
        eventBus: null,
      },
    })
    expect(wrapper.get('button.collapsible-section-toggle').attributes('aria-expanded')).toBe('false')
    expect(wrapper.text()).not.toContain('Message details')
  })
})
