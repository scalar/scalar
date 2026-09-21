import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import ApiReference from './ApiReference.vue'

// Use the real toolbar so the async boundary must forward configuration and overrides.
enableAutoUnmount(afterEach)

const content = { openapi: '3.1.0', info: { title: 'Developer tools', version: '1.0.0' }, paths: {} }
const configuration = (showDeveloperTools?: 'always' | 'never') => ({
  content,
  showDeveloperTools,
  agent: { disabled: true },
  telemetry: false,
})

const setup = async (showDeveloperTools?: 'always' | 'never') => {
  const wrapper = mount(ApiReference, {
    props: { configuration: configuration(showDeveloperTools) },
    attachTo: document.body,
  })
  await flushPromises()
  return wrapper
}

describe('ApiReference.developer-tools', () => {
  it('does not mount the toolbar when developer tools are disabled', async () => {
    const wrapper = await setup('never')
    expect(wrapper.findComponent({ name: 'DeveloperToolsToolbar' }).exists()).toBe(false)
    expect(wrapper.find('.references-developer-tools').exists()).toBe(false)
  })

  it.each(['always', undefined] as const)('loads visible tools with setting %s on localhost', async (setting) => {
    const wrapper = await setup(setting)
    await vi.waitFor(() => expect(wrapper.findComponent({ name: 'DeveloperToolsToolbar' }).exists()).toBe(true), {
      timeout: 5000,
    })
    expect(wrapper.get('.references-developer-tools').text()).toContain('Configure')
  })

  it('responds to runtime visibility changes and forwards configuration overrides', async () => {
    const wrapper = await setup('never')
    await wrapper.setProps({ configuration: configuration('always') })
    await vi.waitFor(() => expect(wrapper.findComponent({ name: 'DeveloperToolsToolbar' }).exists()).toBe(true), {
      timeout: 5000,
    })
    const toolbar = wrapper.getComponent({ name: 'DeveloperToolsToolbar' })
    expect(toolbar.props('configuration')?.layout).toBe('modern')
    toolbar.vm.$emit('update:overrides', { layout: 'classic' })
    await flushPromises()
    expect(wrapper.getComponent({ name: 'DeveloperToolsToolbar' }).props('configuration')?.layout).toBe('classic')

    await wrapper.setProps({ configuration: configuration('never') })
    await flushPromises()
    expect(wrapper.findComponent({ name: 'DeveloperToolsToolbar' }).exists()).toBe(false)
  })
})
