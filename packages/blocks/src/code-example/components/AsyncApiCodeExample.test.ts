import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { isAsyncApiDocument } from '@scalar/workspace-store/schemas/type-guards'
import { type VueWrapper, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import AsyncApiCodeExample from './AsyncApiCodeExample.vue'
import ExamplePicker from './ExamplePicker.vue'

describe('AsyncApiCodeExample', () => {
  it('updates generated code when selecting a message or example and preserves authored samples', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'events',
      document: {
        asyncapi: '3.1.0',
        info: { title: 'Events', version: '1' },
        servers: { local: { host: 'localhost:8080', protocol: 'ws' } },
        channels: {
          events: {
            address: '/events',
            messages: {
              first: {
                name: 'First',
                examples: [
                  { name: 'One', payload: { id: 1 } },
                  { name: 'Two', payload: { id: 2 } },
                ],
              },
              second: { name: 'Second', examples: [{ name: 'Other', payload: false }] },
            },
          },
        },
        operations: {
          send: {
            action: 'send',
            channel: { $ref: '#/channels/events' },
            'x-codeSamples': [{ lang: 'python', source: 'client.send_event()' }],
          },
        },
      },
    })
    const document = store.workspace.activeDocument
    if (!isAsyncApiDocument(document)) throw new Error('Expected AsyncAPI')
    const wrapper = mount(AsyncApiCodeExample, { props: { document, operationName: 'send' } })
    expect(wrapper.text()).toContain('client.send_event()')
    wrapper.findComponent({ name: 'ScalarCombobox' }).vm.$emit('update:modelValue', { id: 'js/websocket' })
    await nextTick()
    expect(wrapper.text()).toContain('"id": 1')
    const picker = (label: string): VueWrapper | undefined =>
      wrapper
        .findAllComponents(ExamplePicker)
        .find((item) => String(item.vm.$attrs['aria-label']).startsWith(`${label}:`))
    expect(wrapper.get('button[aria-label="Message example: One"]').text()).toBe('One')
    picker('Message example')?.vm.$emit('update:modelValue', '1')
    await nextTick()
    expect(wrapper.text()).toContain('"id": 2')
    picker('Message')?.vm.$emit('update:modelValue', 'second')
    await nextTick()
    expect(wrapper.text()).toContain('const payload = false')
    expect(wrapper.text()).toContain('Other')
    expect(wrapper.find('button[aria-label="Message example: Other"]').exists()).toBe(false)
    expect(wrapper.get('button[aria-label="Message: Second"]').text()).toBe('Second')
    wrapper.findComponent({ name: 'ScalarCombobox' }).vm.$emit('update:modelValue', { id: 'custom/0' })
    await nextTick()
    expect(wrapper.text()).toContain('client.send_event()')
    wrapper.unmount()
  })
})
