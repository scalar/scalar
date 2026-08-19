import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import ChatSend from './ChatSend.vue'

describe('chat-send', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('emits send on click while idle', async () => {
    const wrapper = mount(ChatSend, { props: { streaming: false } })

    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('send')).toHaveLength(1)
    expect(wrapper.emitted('stop')).toBeUndefined()
  })

  it('morphs between the send and stop controls with the streaming prop', async () => {
    const wrapper = mount(ChatSend, { props: { streaming: false } })

    expect(wrapper.get('button').attributes('aria-label')).toBe('Send')

    await wrapper.setProps({ streaming: true })
    expect(wrapper.get('button').attributes('aria-label')).toBe('Stop')

    await wrapper.setProps({ streaming: false })
    expect(wrapper.get('button').attributes('aria-label')).toBe('Send')
  })

  it('ignores clicks for 150ms after the morph to stop', async () => {
    const wrapper = mount(ChatSend, { props: { streaming: false } })

    await wrapper.setProps({ streaming: true })

    // A click landing right after the morph was aimed at Send.
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('stop')).toBeUndefined()
    expect(wrapper.emitted('send')).toBeUndefined()

    vi.advanceTimersByTime(149)
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('stop')).toBeUndefined()

    vi.advanceTimersByTime(1)
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('stop')).toHaveLength(1)
  })

  it('stops immediately when mounted already streaming — no morph, no guard', async () => {
    const wrapper = mount(ChatSend, { props: { streaming: true } })

    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('stop')).toHaveLength(1)
  })

  it('does not send while disabled', () => {
    const wrapper = mount(ChatSend, {
      props: { streaming: false, disabled: true },
    })

    const button = wrapper.get('button')
    expect(button.attributes('disabled')).toBeDefined()

    // A programmatic click still reaches the handler in jsdom; the handler
    // must swallow it on its own.
    button.element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(wrapper.emitted('send')).toBeUndefined()
  })

  it('keeps stop available while streaming regardless of disabled', async () => {
    const wrapper = mount(ChatSend, {
      props: { streaming: true, disabled: true },
    })

    expect(wrapper.get('button').attributes('disabled')).toBeUndefined()

    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('stop')).toHaveLength(1)
  })

  it('pulses on demand and settles back', async () => {
    const wrapper = mount(ChatSend, { props: { streaming: true } })

    ;(wrapper.vm as unknown as { pulse: () => void }).pulse()
    await nextTick()
    await nextTick()

    expect(wrapper.get('button').classes()).toContain('chat-send-pulse')

    vi.advanceTimersByTime(400)
    await nextTick()

    expect(wrapper.get('button').classes()).not.toContain('chat-send-pulse')
  })
})
