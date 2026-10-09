import { ExamplePicker } from '@scalar/blocks/code-example'
import { ScalarCopy } from '@scalar/components/copy'
import { ScalarVirtualCodeBlock } from '@scalar/components/virtual-code-block'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import MessageExamples from './MessageExamples.vue'

describe('MessageExamples', () => {
  it('keeps header-only examples selectable alongside the generated payload', async () => {
    const wrapper = mount(MessageExamples, {
      props: {
        examples: [{ name: 'Headers', headers: { trace: 'abc' } }],
        generatedPayload: { id: 42 },
      },
    })
    const picker = wrapper.getComponent(ExamplePicker)
    expect(picker.props('examples')).toStrictEqual({
      '0': { summary: 'Headers' },
      '1': { summary: 'Generated example' },
    })
    picker.vm.$emit('update:modelValue', '1')
    await nextTick()
    expect(wrapper.get('pre').text()).toBe(JSON.stringify({ id: 42 }, null, 2))
    expect(wrapper.getComponent(ScalarCopy).props('content')).toBe(JSON.stringify({ id: 42 }, null, 2))
    await wrapper.setProps({ generatedPayload: undefined })
    expect(wrapper.get('pre').text()).toBe(JSON.stringify({ trace: 'abc' }, null, 2))
  })

  it.each([null, false, 0, ''])('renders and copies a generated %j payload', (generatedPayload) => {
    const wrapper = mount(MessageExamples, { props: { generatedPayload } })
    expect(wrapper.get('pre').text()).toBe(String(generatedPayload))
    expect(wrapper.getComponent(ScalarCopy).props('content')).toBe(String(generatedPayload))
  })

  it('shows a named example and its summary', () => {
    const wrapper = mount(MessageExamples, {
      props: { examples: [{ name: 'Created', summary: 'A new event', payload: { id: 1 } }] },
    })
    expect(wrapper.text()).toContain('Created')
    expect(wrapper.text()).toContain('A new event')
    expect(wrapper.get('pre').text()).toBe('{\n  "id": 1\n}')
    expect(wrapper.getComponent(ScalarCopy).props('content')).toBe('{\n  "id": 1\n}')
    expect(wrapper.findComponent(ExamplePicker).exists()).toBe(false)
  })

  it('keeps duplicate names and unnamed examples selectable with matching copy content', async () => {
    const wrapper = mount(MessageExamples, {
      props: {
        examples: [
          { name: 'Example 3', payload: 'first' },
          { name: 'Example 3', payload: 'second' },
          { payload: 'third' },
        ],
      },
    })
    const picker = wrapper.getComponent(ExamplePicker)
    expect(picker.props('examples')).toStrictEqual({
      '0': { summary: 'Example 3' },
      '1': { summary: 'Example 3' },
      '2': { summary: 'Example 3 #2' },
    })
    for (const [key, expected] of [
      ['0', 'first'],
      ['1', 'second'],
      ['2', 'third'],
    ]) {
      picker.vm.$emit('update:modelValue', key)
      await nextTick()
      expect(wrapper.get('pre').text()).toBe(expected)
      expect(wrapper.getComponent(ScalarCopy).props('content')).toBe(expected)
    }
  })

  it('reserves later authored names and suffixes when generating unique labels', () => {
    const wrapper = mount(MessageExamples, {
      props: {
        examples: [
          { payload: 'unnamed' },
          { name: 'Example 1', payload: 'named' },
          { name: 'Example 1 #2', payload: 'suffixed' },
          { payload: 'another unnamed' },
        ],
      },
    })
    expect(wrapper.getComponent(ExamplePicker).props('examples')).toStrictEqual({
      '0': { summary: 'Example 1 #3' },
      '1': { summary: 'Example 1' },
      '2': { summary: 'Example 1 #2' },
      '3': { summary: 'Example 4' },
    })
  })

  it('selects the first remaining example when the selected entry disappears', async () => {
    const wrapper = mount(MessageExamples, { props: { examples: [{ payload: 'first' }, { payload: 'second' }] } })
    wrapper.getComponent(ExamplePicker).vm.$emit('update:modelValue', '1')
    await nextTick()
    await wrapper.setProps({ examples: [{ payload: 'replacement' }] })
    expect(wrapper.get('pre').text()).toBe('replacement')
    expect(wrapper.getComponent(ScalarCopy).props('content')).toBe('replacement')
    await wrapper.setProps({ examples: [] })
    expect(wrapper.text()).toBe('')
  })

  it('resolves example references and skips unresolved entries', () => {
    const wrapper = mount(MessageExamples, {
      props: { examples: [{ $ref: '#/missing' }, { $ref: '#/example', '$ref-value': { payload: false } }] },
    })
    expect(wrapper.get('pre').text()).toBe('false')
    expect(wrapper.getComponent(ScalarCopy).props('content')).toBe('false')
  })

  it.each([null, false, 0, ''])('renders and copies a %j payload', (payload) => {
    const wrapper = mount(MessageExamples, { props: { examples: [{ payload }] } })
    const expected = String(payload)
    expect(wrapper.get('pre').text()).toBe(expected)
    expect(wrapper.getComponent(ScalarCopy).props('content')).toBe(expected)
  })

  it('does not render an empty examples panel', () => {
    const wrapper = mount(MessageExamples, { props: { examples: [{ name: 'No content' }] } })
    expect(wrapper.text()).toBe('')
    expect(wrapper.findComponent(ScalarCopy).exists()).toBe(false)
  })

  it('virtualizes large examples without changing the copied content', () => {
    const payload = 'x'.repeat(20_001)
    const wrapper = mount(MessageExamples, { props: { examples: [{ payload }] } })
    expect(wrapper.getComponent(ScalarVirtualCodeBlock).props('content')).toBe(payload)
    expect(wrapper.getComponent(ScalarCopy).props('content')).toBe(payload)
  })
})
