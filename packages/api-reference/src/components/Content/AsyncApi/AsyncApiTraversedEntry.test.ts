import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AsyncApiTraversedEntry from './AsyncApiTraversedEntry.vue'

const document = {
  asyncapi: '3.0.0',
  info: { title: 'Streaming API', version: '1.0.0' },
  'x-scalar-original-document-hash': '',
  channels: {},
} as unknown as AsyncApiDocument

describe('AsyncApiTraversedEntry', () => {
  /**
   * Tag groups are rendered through the flatten branch in modern layout, so they
   * must not count toward the sibling-tag total. If they did, a lone regular tag
   * sitting next to a tag group would get `moreThanOneTag = true` and `ModernLayout`
   * would hide its body behind a "Show more" button while collapsed.
   */
  it('does not count sibling tag groups when computing moreThanOneTag', () => {
    const entries: TraversedEntry[] = [
      {
        id: 'tag',
        type: 'tag',
        title: 'Only Tag',
        name: 'only-tag',
        isGroup: false,
        children: [],
      },
      {
        id: 'group',
        type: 'tag',
        title: 'A Group',
        name: 'a-group',
        isGroup: true,
        children: [],
      },
    ]

    const wrapper = mount(AsyncApiTraversedEntry, {
      props: {
        entries,
        document,
        // `Lazy` only renders its slot when the entry is expanded; mark both
        // so the assertion can see the rendered `<Tag>` for the regular tag.
        expandedItems: { tag: true, group: true },
        options: { layout: 'modern' },
        eventBus: null as never,
      },
    })

    const tagComponents = wrapper.findAllComponents({ name: 'Tag' })
    expect(tagComponents).toHaveLength(1)
    expect(tagComponents[0]?.props('moreThanOneTag')).toBe(false)
  })

  it('renders a channel with its operation and nested message', () => {
    const entries: TraversedEntry[] = [
      {
        id: 'channel',
        type: 'asyncapi-channel',
        title: 'User signup channel',
        channelName: 'userSignedup',
        channelAddress: 'user/signedup',
        children: [
          {
            id: 'operation',
            type: 'asyncapi-operation',
            title: 'Consume user events',
            operationName: 'receiveUserEvents',
            action: 'receive',
            channelName: 'userSignedup',
            channelAddress: 'user/signedup',
            children: [
              {
                id: 'message',
                type: 'asyncapi-message',
                title: 'User signed up',
                messageName: 'userSignedUp',
                channelName: 'userSignedup',
              },
            ],
          },
        ],
      },
    ]

    const channelDocument = {
      asyncapi: '3.0.0',
      info: { title: 'Streaming API', version: '1.0.0' },
      'x-scalar-original-document-hash': '',
      channels: {
        userSignedup: {
          address: 'user/signedup',
          messages: {
            userSignedUp: {
              title: 'User signed up',
              summary: 'Inform about a new user.',
            },
          },
        },
      },
    } as unknown as AsyncApiDocument

    const wrapper = mount(AsyncApiTraversedEntry, {
      props: {
        entries,
        document: channelDocument,
        // `Lazy` only renders its slot when expanded, so mark every level.
        expandedItems: { channel: true, operation: true, message: true },
        options: { layout: 'modern' },
        eventBus: null as never,
      },
    })

    expect(wrapper.findComponent({ name: 'Channel' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'Operation' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'Message' }).exists()).toBe(true)
    expect(wrapper.text()).toContain('Consume user events')
    expect(wrapper.text()).toContain('receive')
    expect(wrapper.text()).toContain('User signed up')
    expect(wrapper.text()).toContain('Inform about a new user.')
  })
})
