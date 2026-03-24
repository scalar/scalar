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

  it('does not render a single example when the value is null', () => {
    const wrapper = mount(SchemaPropertyExamples, {
      props: {
        example: null,
      },
    })

    expect(wrapper.find('.property-example').exists()).toBe(false)
  })
})
