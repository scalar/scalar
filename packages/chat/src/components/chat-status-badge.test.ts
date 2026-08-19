import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

import type { ToolCardStatus } from '@scalar/chat-protocol'
import { ScalarLoading } from '@scalar/components'
import { ScalarIconCheck, ScalarIconInfo, ScalarIconWarning } from '@scalar/icons'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ChatStatusBadge from './ChatStatusBadge.vue'

const mountBadge = (status: ToolCardStatus, label = 'Called POST /planets · 200 OK') =>
  mount(ChatStatusBadge, { props: { status, label } })

describe('chat-status-badge', () => {
  it('renders the caller-assembled label verbatim', () => {
    const wrapper = mountBadge('complete', 'Called POST /planets · 200 OK')

    expect(wrapper.text()).toContain('Called POST /planets · 200 OK')
  })

  it.each(['pending', 'running', 'applying'] as const)('shows a spinning loader in accent text for %s', (status) => {
    const wrapper = mountBadge(status, 'Calling get_planets…')

    const loading = wrapper.findComponent(ScalarLoading)
    expect(loading.exists()).toBe(true)
    expect(loading.props('loader')?.isLoading).toBe(true)
    expect(wrapper.classes()).toContain('chat-status-badge--accent')
  })

  it('shows the waiting icon in accent text for awaiting-approval', () => {
    const wrapper = mountBadge('awaiting-approval', 'Run POST /planets?')

    expect(wrapper.findComponent(ScalarIconInfo).exists()).toBe(true)
    expect(wrapper.findComponent(ScalarLoading).exists()).toBe(false)
    expect(wrapper.classes()).toContain('chat-status-badge--accent')
  })

  it('shows the check icon in the neutral tone for complete', () => {
    const wrapper = mountBadge('complete')

    expect(wrapper.findComponent(ScalarIconCheck).exists()).toBe(true)
    expect(wrapper.findComponent(ScalarLoading).exists()).toBe(false)
    expect(wrapper.classes()).toContain('chat-status-badge--neutral')
  })

  it.each(['failed', 'rejected'] as const)('shows the warning icon in the danger tone for %s', (status) => {
    const wrapper = mountBadge(status, 'Request failed')

    expect(wrapper.findComponent(ScalarIconWarning).exists()).toBe(true)
    expect(wrapper.findComponent(ScalarLoading).exists()).toBe(false)
    expect(wrapper.classes()).toContain('chat-status-badge--danger')
  })

  it('stops the loader once the status settles and restarts it on re-entry', async () => {
    const wrapper = mountBadge('running', 'Calling get_planets…')
    expect(wrapper.findComponent(ScalarLoading).props('loader')?.isLoading).toBe(true)

    await wrapper.setProps({ status: 'complete' })
    expect(wrapper.findComponent(ScalarLoading).exists()).toBe(false)

    await wrapper.setProps({ status: 'applying' })
    expect(wrapper.findComponent(ScalarLoading).props('loader')?.isLoading).toBe(true)
  })

  it('lets the caller replace the icon through the slot', () => {
    const wrapper = mount(ChatStatusBadge, {
      props: { status: 'complete' as ToolCardStatus, label: 'Called POST /planets' },
      slots: { icon: '<svg data-testid="custom-icon" />' },
    })

    expect(wrapper.find('[data-testid="custom-icon"]').exists()).toBe(true)
    expect(wrapper.findComponent(ScalarIconCheck).exists()).toBe(false)
  })

  it('sizes the row from the chat density variables', () => {
    // jsdom does not compute layout (and scoped styles are not injected), so
    // token compliance is asserted on the stylesheet text: the badge must
    // read the density variables, never fixed pixel geometry.
    const testPath = expect.getState().testPath ?? ''
    const source = readFileSync(join(dirname(testPath), 'ChatStatusBadge.vue'), 'utf-8')

    expect(source).toContain('min-height: var(--chat-row-min-h)')
    expect(source).toContain('font-size: var(--chat-font-row)')
    expect(source).toContain('font-weight: var(--scalar-semibold)')
  })
})
