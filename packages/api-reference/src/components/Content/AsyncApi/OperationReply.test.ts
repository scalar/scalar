import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import { NAVIGATION_HREF } from '@/hooks/use-navigation-href'

import OperationReply from './OperationReply.vue'

enableAutoUnmount(afterEach)

describe('OperationReply', () => {
  it('shows reply metadata and navigates to the existing message schema', async () => {
    const eventBus = createWorkspaceEventBus()
    const selected: string[] = []
    eventBus.on('scroll-to:nav-item', ({ id }) => selected.push(id))
    const wrapper = mount(OperationReply, {
      props: {
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
    expect(wrapper.text()).toContain('Dynamic reply address')
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
    expect(wrapper.text()).toContain('Reply address')
    expect(wrapper.text()).not.toContain('Dynamic reply address')
    expect(wrapper.text()).toContain('replies/topic')
    expect(wrapper.findAll('a').map((link) => link.text())).toStrictEqual([])
  })
})
