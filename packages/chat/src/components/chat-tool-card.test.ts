import type { ToolCardStatus } from '@scalar/chat-protocol'
import { ScalarLoading } from '@scalar/components/loading'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'

import ChatToolCard from './ChatToolCard.vue'

const mountCard = (
  props: Partial<InstanceType<typeof ChatToolCard>['$props']> & { status: ToolCardStatus },
  slots: Record<string, () => unknown> = {},
) => mount(ChatToolCard, { props: { verb: 'write', ...props }, slots })

describe('chat-tool-card', () => {
  it.each<ToolCardStatus>(['pending', 'running', 'applying'])('spins while %s', (status) => {
    const wrapper = mountCard({ status })

    expect(wrapper.findComponent(ScalarLoading).exists()).toBe(true)
    expect(wrapper.find('.chat-tool-card-icon--issue').exists()).toBe(false)
  })

  it('does not spin while awaiting approval — the card waits on the user, not on work', () => {
    const wrapper = mountCard({ status: 'awaiting-approval' })

    expect(wrapper.findComponent(ScalarLoading).exists()).toBe(false)
    expect(wrapper.find('.chat-tool-card-icon--issue').exists()).toBe(false)
    expect(wrapper.classes()).toContain('chat-tool-card--awaiting-approval')
  })

  it.each<ToolCardStatus>(['failed', 'rejected'])('shows the issue icon for %s', (status) => {
    const wrapper = mountCard({ status })

    expect(wrapper.find('.chat-tool-card-icon--issue').exists()).toBe(true)
    expect(wrapper.findComponent(ScalarLoading).exists()).toBe(false)
  })

  it('rests at complete and shows the provided icon', () => {
    const Glyph = () => h('svg', { class: 'glyph' })
    const wrapper = mountCard({ status: 'complete', icon: Glyph })

    expect(wrapper.findComponent(ScalarLoading).exists()).toBe(false)
    expect(wrapper.find('.chat-tool-card-icon--issue').exists()).toBe(false)
    expect(wrapper.find('.glyph').exists()).toBe(true)
  })

  it('forces the issue icon through hasIssue even when the status is complete', () => {
    const wrapper = mountCard({ status: 'complete', hasIssue: true })

    expect(wrapper.find('.chat-tool-card-icon--issue').exists()).toBe(true)
  })

  it('shortens long paths and keeps the full path on the title attribute', () => {
    const path = '/very/long/path/that/keeps/going/on/forever/file.vue'
    const wrapper = mountCard({ status: 'complete', path })

    const pathElement = wrapper.get('.chat-tool-card-path')
    expect(pathElement.text()).toBe('…/file.vue')
    expect(pathElement.attributes('title')).toBe(path)
  })

  it('shows short paths unshortened', () => {
    const wrapper = mountCard({ status: 'complete', path: 'src/file.vue' })

    expect(wrapper.get('.chat-tool-card-path').text()).toBe('src/file.vue')
  })

  it('renders the verb and the notice, body, stats and actions slots', () => {
    const wrapper = mountCard(
      { status: 'complete' },
      {
        default: () => h('p', { id: 'body' }, 'body content'),
        notice: () => h('p', { class: 'chat-tool-card-notice' }, 'one warning'),
        stats: () => h('span', { id: 'stats' }, '+3 −1'),
        actions: () => h('button', { id: 'copy' }, 'Copy'),
      },
    )

    expect(wrapper.get('.chat-tool-card-verb').text()).toBe('write')
    expect(wrapper.get('.chat-tool-card-notices').text()).toContain('one warning')
    expect(wrapper.get('.chat-tool-card-body').text()).toContain('body content')
    expect(wrapper.get('.chat-tool-card-trail').text()).toContain('+3 −1')
    expect(wrapper.get('.chat-tool-card-actions').find('#copy').exists()).toBe(true)
    expect(wrapper.classes()).toContain('chat-tool-card--has-notice')
    expect(wrapper.classes()).toContain('chat-tool-card--has-body')
  })

  it('suppresses the body when hasBody is false despite a default slot', () => {
    const wrapper = mountCard({ status: 'complete', hasBody: false }, { default: () => h('p', 'hidden body') })

    expect(wrapper.find('.chat-tool-card-body').exists()).toBe(false)
    expect(wrapper.classes()).not.toContain('chat-tool-card--has-body')
  })
})
