import { ExamplePicker } from '@scalar/blocks/code-example'
import { ScalarCodeBlock } from '@scalar/components/code-block'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import type { TraversedAsyncApiMessage } from '@scalar/workspace-store/schemas/navigation'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import OperationMessageExamples from './OperationMessageExamples.vue'

const messages: TraversedAsyncApiMessage[] = ['created', 'updated', 'empty'].map((name) => ({
  type: 'asyncapi-message',
  id: `navigation/${name}`,
  title: name,
  messageName: name,
  channelName: 'events',
}))
const document = {
  asyncapi: '3.1.0',
  info: { title: 'Events', version: '1' },
  'x-scalar-original-document-hash': '',
  channels: {
    events: {
      messages: {
        created: { title: 'Created', examples: [{ payload: { id: 1 } }, { payload: { id: 2 } }] },
        updated: { title: 'Updated', contentType: 'text/plain', examples: [{ payload: 'updated' }] },
        empty: { title: 'Empty' },
      },
    },
  },
} satisfies AsyncApiDocument

describe('OperationMessageExamples', () => {
  it('renders one payload and switches messages independently of the payload example', async () => {
    const wrapper = mount(OperationMessageExamples, { props: { document, messages } })
    expect(wrapper.findAllComponents(ScalarCodeBlock)).toHaveLength(1)
    expect(wrapper.get('pre').text()).toContain('"id": 1')
    wrapper.findAllComponents(ExamplePicker)[1]!.vm.$emit('update:modelValue', '1')
    await nextTick()
    expect(wrapper.get('pre').text()).toContain('"id": 2')
    wrapper.findAllComponents(ExamplePicker)[0]!.vm.$emit('update:modelValue', 'updated')
    await nextTick()
    expect(wrapper.findAllComponents(ScalarCodeBlock)).toHaveLength(1)
    expect(wrapper.get('pre').text()).toBe('updated')
    expect(wrapper.getComponent(ScalarCodeBlock).props('lang')).toBe('plaintext')
    expect(wrapper.findAllComponents(ExamplePicker)).toHaveLength(1)
  })

  it('keeps the picker available for a message without a payload and recovers when messages change', async () => {
    const wrapper = mount(OperationMessageExamples, { props: { document, messages } })
    wrapper.findAllComponents(ExamplePicker)[0]!.vm.$emit('update:modelValue', 'empty')
    await nextTick()
    expect(wrapper.text()).toContain('No payload example available.')
    expect(wrapper.findComponent(ExamplePicker).exists()).toBe(true)
    await wrapper.setProps({ messages: [messages[1]!] })
    expect(wrapper.get('pre').text()).toBe('updated')
    expect(wrapper.findComponent(ExamplePicker).exists()).toBe(false)
    await wrapper.setProps({ messages: [] })
    expect(wrapper.findComponent(ScalarCodeBlock).exists()).toBe(false)
  })

  it('generates a payload from the selected message schema', () => {
    const wrapper = mount(OperationMessageExamples, {
      props: {
        messages: [messages[0]!],
        document: {
          ...document,
          channels: {
            events: {
              messages: {
                created: {
                  payload: {
                    type: 'object',
                    properties: { id: { type: 'integer', examples: [42] } },
                  },
                },
              },
            },
          },
        },
      },
    })
    expect(wrapper.get('pre').text()).toContain('42')
    expect(wrapper.findComponent(ExamplePicker).exists()).toBe(false)
  })
})
