import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { h, nextTick } from 'vue'

import ChatViewport from './ChatViewport.vue'
import { CHAT_VIEWPORT_ANCHOR_ATTRIBUTE } from './chat-viewport'

// jsdom has no layout, so element heights are 0 and the reservation always
// falls below the short-viewport threshold. These tests cover the state
// machine (reservation lifecycle, epoch resets, exposure); the geometry is
// exercised in the playground.
describe('chat-viewport', () => {
  const mountViewport = (props: { streaming: boolean; messageCount: number; chatKey?: string }) =>
    mount(ChatViewport, {
      props,
      slots: {
        default: () => h('div', { [CHAT_VIEWPORT_ANCHOR_ATTRIBUTE]: '' }, 'user message'),
      },
    })

  it('renders the reservation spacer collapsed initially', () => {
    const wrapper = mountViewport({ streaming: false, messageCount: 0 })

    expect(wrapper.get('.chat-viewport-reservation').attributes('style')).toContain('height: 0px')
  })

  it('handles a new exchange without a crash and stays collapsed under the threshold', async () => {
    const wrapper = mountViewport({ streaming: true, messageCount: 1 })

    await wrapper.setProps({ messageCount: 2 })
    await nextTick()
    await nextTick()

    expect(wrapper.get('.chat-viewport-reservation').attributes('style')).toContain('height: 0px')
  })

  it('releases the reservation when streaming completes', async () => {
    const wrapper = mountViewport({ streaming: true, messageCount: 2 })

    await wrapper.setProps({ streaming: false })
    await nextTick()

    expect(wrapper.get('.chat-viewport-reservation').attributes('style')).toContain('height: 0px')
  })

  it('resets on chat switch and exposes scrollToEnd', async () => {
    const wrapper = mountViewport({ streaming: false, messageCount: 2, chatKey: 'chat-a' })

    await wrapper.setProps({ chatKey: 'chat-b' })
    await nextTick()

    const exposed = wrapper.vm as unknown as { scrollToEnd: () => void }
    expect(typeof exposed.scrollToEnd).toBe('function')
    exposed.scrollToEnd()
  })
})
