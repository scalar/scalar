import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import ApiReference from './ApiReference.vue'

// Exercise the real drawer and chat so lazy mounting cannot conceal a rendering failure.
enableAutoUnmount(afterEach)

const content = {
  openapi: '3.1.0',
  info: { title: 'Agent loading', version: '1.0.0' },
  paths: {},
}
const configuration = (disabled: boolean) => ({ content, agent: { disabled }, telemetry: false })

const setup = async (disabled: boolean) => {
  const wrapper = mount(ApiReference, { props: { configuration: configuration(disabled) }, attachTo: document.body })
  await flushPromises()
  return wrapper
}

describe('ApiReference.agent', () => {
  it('does not mount an enabled agent until opened', async () => {
    const wrapper = await setup(false)
    expect(wrapper.findComponent({ name: 'AgentScalarButton' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'AgentScalarDrawer' }).exists()).toBe(false)
  })

  it('loads on first opening and keeps the same conversation mounted when reopened', async () => {
    const wrapper = await setup(false)
    await wrapper.getComponent({ name: 'AgentScalarButton' }).get('button').trigger('click')
    await vi.waitFor(() => expect(wrapper.findComponent({ name: 'AgentScalarChatInterface' }).exists()).toBe(true), {
      timeout: 5000,
    })
    const chat = wrapper.getComponent({ name: 'AgentScalarChatInterface' }).vm

    await wrapper.getComponent({ name: 'AgentScalarButton' }).get('button').trigger('click')
    await flushPromises()
    expect(wrapper.getComponent({ name: 'AgentScalarChatInterface' }).vm).toBe(chat)
    await wrapper.getComponent({ name: 'AgentScalarButton' }).get('button').trigger('click')
    await flushPromises()
    expect(wrapper.getComponent({ name: 'AgentScalarChatInterface' }).vm).toBe(chat)
  })
})
