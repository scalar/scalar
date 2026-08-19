import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, inject } from 'vue'

import { CHAT_COPY_KEY, type ChatCopy } from '@/copy/copy'
import { CHAT_DENSITY_KEY } from '@/density'

import ChatRoot from './ChatRoot.vue'

const Probe = defineComponent({
  setup() {
    const density = inject(CHAT_DENSITY_KEY)
    const copy = inject(CHAT_COPY_KEY) as ChatCopy

    return () =>
      h('span', {
        'data-density': density?.value,
        'data-placeholder': copy.composer.placeholder,
        'data-untitled': copy.session.untitledChat,
      })
  },
})

describe('chat-root', () => {
  it('provides default density and sets the chat variables', () => {
    const wrapper = mount(ChatRoot, { slots: { default: () => h(Probe) } })

    expect(wrapper.get('span').attributes('data-density')).toBe('default')

    const style = wrapper.get('.chat-root').attributes('style') ?? ''
    expect(style).toContain('--chat-row-min-h: 40px')
    expect(style).toContain('--chat-bubble-max-w: 80%')
  })

  it('switches the variable set with the density axis', () => {
    const wrapper = mount(ChatRoot, {
      props: { density: 'compact' },
      slots: { default: () => h(Probe) },
    })

    expect(wrapper.get('span').attributes('data-density')).toBe('compact')

    const style = wrapper.get('.chat-root').attributes('style') ?? ''
    expect(style).toContain('--chat-row-min-h: 32px')
    expect(style).toContain('--chat-bubble-max-w: 90%')
  })

  it('propagates a density change after mount — no remount required', async () => {
    const wrapper = mount(ChatRoot, {
      props: { density: 'default' },
      slots: { default: () => h(Probe) },
    })

    await wrapper.setProps({ density: 'compact' })

    expect(wrapper.get('span').attributes('data-density')).toBe('compact')
    const style = wrapper.get('.chat-root').attributes('style') ?? ''
    expect(style).toContain('--chat-row-min-h: 32px')
  })

  it('propagates copy changes after mount — locale switches must not require a remount', async () => {
    const wrapper = mount(ChatRoot, {
      props: { copy: { composer: { placeholder: 'Ask about this API' } } },
      slots: { default: () => h(Probe) },
    })

    await wrapper.setProps({ copy: { composer: { placeholder: 'Posez une question sur cette API' } } })

    expect(wrapper.get('span').attributes('data-placeholder')).toBe('Posez une question sur cette API')
  })

  it('deep-merges copy overrides over the English defaults', () => {
    const wrapper = mount(ChatRoot, {
      props: { copy: { composer: { placeholder: 'Ask about this API' } } },
      slots: { default: () => h(Probe) },
    })

    const probe = wrapper.get('span')
    expect(probe.attributes('data-placeholder')).toBe('Ask about this API')
    // Untouched sections keep their defaults.
    expect(probe.attributes('data-untitled')).toBe('Untitled chat')
  })
})
