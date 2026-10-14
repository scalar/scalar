import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { traverseAsyncApiDocument } from '@scalar/workspace-store/navigation'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import { NAVIGATION_HREF } from '@/hooks/use-navigation-href'

import { getOperationReply } from './helpers/get-operation-reply'
import Message from './Message.vue'
import OperationReply from './OperationReply.vue'

enableAutoUnmount(afterEach)

describe('OperationReply', () => {
  it('expands reply schemas independently without duplicating canonical message anchors', async () => {
    const document: AsyncApiDocument = {
      asyncapi: '3.1.0',
      info: { title: 'Orders', version: '1' },
      'x-scalar-original-document-hash': '',
      channels: {
        results: {
          address: 'orders.results',
          messages: {
            accepted: {
              title: 'Order accepted',
              payload: {
                type: 'object',
                properties: { orderId: { type: 'string', description: 'The accepted order identifier.' } },
              },
            },
          },
        },
      },
    }
    document['x-scalar-navigation'] = traverseAsyncApiDocument('test', document)
    const reply = getOperationReply(document, {
      action: 'send',
      channel: { $ref: '#/channels/results' },
      reply: { channel: { $ref: '#/channels/results' }, messages: [{ $ref: '#/channels/results/messages/accepted' }] },
    })!
    const eventBus = createWorkspaceEventBus()
    const toggled: string[] = []
    const copied: string[] = []
    eventBus.on('toggle:nav-item', ({ id }) => toggled.push(id))
    eventBus.on('copy-url:nav-item', ({ id }) => copied.push(id))
    const props = { document, eventBus, level: 4 as const, reply }
    const wrapper = mount({
      components: { OperationReply },
      setup: () => ({ props }),
      template: '<OperationReply v-bind="props" /><OperationReply v-bind="props" />',
    })
    const [first, second] = wrapper.findAllComponents(OperationReply)
    if (!first || !second) throw new Error('Expected two reply sections')
    expect(first.text()).toContain('Replies')
    expect(first.text()).not.toContain('The accepted order identifier.')
    const message = first.getComponent(Message)
    expect(message.attributes('id')).not.toBe(reply.messages[0]!.id)
    expect(message.attributes('id')).not.toBe(second.getComponent(Message).attributes('id'))
    await message.get('button.section-accordion-button').trigger('click')
    expect(first.text()).toContain('The accepted order identifier.')
    expect(second.text()).not.toContain('The accepted order identifier.')
    expect(toggled).toStrictEqual([])
    await message.get('button.anchor-copy-button').trigger('click')
    await message.get('button.copy-link-trailing').trigger('click')
    expect(copied).toStrictEqual([reply.messages[0]!.id, `${reply.messages[0]!.id}.payload.orderId`])
  })

  it('shows reply metadata and navigates to the existing message schema', async () => {
    const eventBus = createWorkspaceEventBus()
    const selected: string[] = []
    eventBus.on('scroll-to:nav-item', ({ id }) => selected.push(id))
    const wrapper = mount(OperationReply, {
      props: {
        document: {
          asyncapi: '3.1.0',
          info: { title: 'Replies', version: '1' },
          'x-scalar-original-document-hash': '',
        },
        level: 4,
        eventBus,
        reply: {
          channel: { title: 'Replies', id: 'doc/channel/replies' },
          address: '$message.header#/replyTo',
          dynamicAddress: true,
          description: 'Sender inbox',
          messages: [{ title: 'Result', id: 'doc/channel/replies/message/result' }],
        },
      },
      global: { provide: { [NAVIGATION_HREF]: (id: string): string => `/reference/${id}` } },
    })
    expect(wrapper.text()).toContain('Dynamic address')
    expect(wrapper.text()).toContain('$message.header#/replyTo')
    expect(wrapper.text()).toContain('Sender inbox')
    const links = wrapper.findAll('a')
    expect(links.map((link) => [link.text(), link.attributes('href')])).toStrictEqual([
      ['Replies', '/reference/doc/channel/replies'],
      ['Result', '/reference/doc/channel/replies/message/result'],
    ])
    await links[0]!.trigger('click')
    await links[1]!.trigger('click')
    expect(selected).toStrictEqual(['doc/channel/replies', 'doc/channel/replies/message/result'])
    await links[1]!.trigger('click', { ctrlKey: true })
    expect(selected).toStrictEqual(['doc/channel/replies', 'doc/channel/replies/message/result'])
  })

  it('shows a static address and leaves unavailable targets as text', () => {
    const wrapper = mount(OperationReply, {
      props: {
        document: {
          asyncapi: '3.1.0',
          info: { title: 'Replies', version: '1' },
          'x-scalar-original-document-hash': '',
        },
        level: 4,
        eventBus: null,
        reply: {
          channel: { title: 'Replies' },
          address: 'replies/topic',
          dynamicAddress: false,
          messages: [{ title: 'Result' }],
        },
      },
    })
    expect(wrapper.text()).toContain('Address')
    expect(wrapper.text()).not.toContain('Dynamic address')
    expect(wrapper.text()).toContain('replies/topic')
    expect(wrapper.findAll('a').map((link) => link.text())).toStrictEqual([])
  })
})
