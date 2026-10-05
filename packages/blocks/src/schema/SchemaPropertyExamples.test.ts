import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SchemaPropertyExamples from './SchemaPropertyExamples.vue'

describe('SchemaPropertyExamples', () => {
  it('renders a single example when the value is false', () => {
    const wrapper = mount(SchemaPropertyExamples, {
      props: {
        example: false,
      },
    })

    expect(wrapper.find('.property-example').exists()).toBe(true)
    expect(wrapper.text()).toContain('Example')
    expect(wrapper.text()).toContain('false')
  })

  it('renders a single example when the value is 0', () => {
    const wrapper = mount(SchemaPropertyExamples, {
      props: {
        example: 0,
      },
    })

    expect(wrapper.find('.property-example').exists()).toBe(true)
    expect(wrapper.text()).toContain('Example')
    expect(wrapper.text()).toContain('0')
  })

  it('renders a single example when the value is an empty string', () => {
    const wrapper = mount(SchemaPropertyExamples, {
      props: {
        example: '',
      },
    })

    expect(wrapper.find('.property-example').exists()).toBe(true)
    expect(wrapper.find('.property-example-value span').text()).toBe('')
  })

  it('renders a single example when the value is null', () => {
    const wrapper = mount(SchemaPropertyExamples, {
      props: {
        example: null,
      },
    })

    expect(wrapper.find('.property-example').exists()).toBe(true)
    expect(wrapper.text()).toContain('Example')
    expect(wrapper.text()).toContain('null')
  })

  it('does not render a single example when the value is undefined', () => {
    const wrapper = mount(SchemaPropertyExamples, {
      props: {
        example: undefined,
      },
    })

    expect(wrapper.find('.property-example').exists()).toBe(false)
  })

  it('renders a single example when the value is a whitespace-only string', () => {
    const wrapper = mount(SchemaPropertyExamples, {
      props: {
        example: ' ',
      },
    })

    expect(wrapper.find('.property-example').exists()).toBe(true)
    expect(wrapper.find('.property-example-value span').text()).toBe('')
  })

  it('renders a single example for an object value without unwrapping', () => {
    const wrapper = mount(SchemaPropertyExamples, {
      props: {
        example: { testProperty: 'testValue' },
      },
    })

    expect(wrapper.find('.property-example').exists()).toBe(true)
    expect(wrapper.text()).toContain('{"testProperty":"testValue"}')
  })

  it('unwraps `value` from OpenAPI Example Objects in the `examples` map', () => {
    const wrapper = mount(SchemaPropertyExamples, {
      props: {
        examples: {
          first: { summary: 'A name', value: 'Alice' },
          second: { value: 42 },
        },
      },
    })

    const buttons = wrapper.findAll('.property-example-value span')
    expect(buttons[0]?.text()).toBe('Alice')
    expect(buttons[1]?.text()).toBe('42')
  })

  it('unwraps `externalValue` from OpenAPI Example Objects in the `examples` map', () => {
    const wrapper = mount(SchemaPropertyExamples, {
      props: {
        examples: {
          remote: { externalValue: 'https://example.com/sample.json' },
        },
      },
    })

    expect(wrapper.find('.property-example-value span').text()).toBe('https://example.com/sample.json')
  })
})
