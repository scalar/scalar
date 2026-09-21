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
  it('does not mount a disabled agent or an enabled agent that has not been opened', async () => {
    const wrapper = await setup(true)
    expect(wrapper.findComponent({ name: 'AgentScalarDrawer' }).exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'AgentScalarButton' }).exists()).toBe(false)

    await wrapper.setProps({ configuration: configuration(false) })
    await flushPromises()
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

  it('unmounts the conversation on disable and waits for another open after re-enabling', async () => {
    const wrapper = await setup(false)
    await wrapper.getComponent({ name: 'AgentScalarButton' }).get('button').trigger('click')
    await vi.waitFor(() => expect(wrapper.findComponent({ name: 'AgentScalarChatInterface' }).exists()).toBe(true), {
      timeout: 5000,
    })

    await wrapper.setProps({ configuration: configuration(true) })
    await flushPromises()
    expect(wrapper.findComponent({ name: 'AgentScalarDrawer' }).exists()).toBe(false)
    expect(wrapper.get('.references-rendered').attributes('inert')).toBe('false')

    await wrapper.setProps({ configuration: configuration(false) })
    await flushPromises()
    expect(wrapper.findComponent({ name: 'AgentScalarDrawer' }).exists()).toBe(false)
    await wrapper.getComponent({ name: 'AgentScalarButton' }).get('button').trigger('click')
    await vi.waitFor(() => expect(wrapper.findComponent({ name: 'AgentScalarChatInterface' }).exists()).toBe(true), {
      timeout: 5000,
    })
  })
})
