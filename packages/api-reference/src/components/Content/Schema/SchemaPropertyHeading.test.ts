import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SchemaPropertyHeading from './SchemaPropertyHeading.vue'

describe('SchemaPropertyHeading', () => {
  it('renders falsy default values', async () => {
    const wrapper = mount(SchemaPropertyHeading, {
      props: {
        value: {
          type: 'boolean',
          default: false,
        },
      },
    })

    const defaultValueElement = wrapper.find('.property-heading')
    expect(defaultValueElement.text()).toContain('default:')
    expect(defaultValueElement.text()).toContain('false')
  })

  it('renders required property', async () => {
    const wrapper = mount(SchemaPropertyHeading, {
      props: {
        required: true,
      },
    })

    const requiredElement = wrapper.find('.property-required')
    expect(requiredElement.exists()).toBe(true)
    expect(requiredElement.text()).toBe('required')
  })

  it('renders property type and format', async () => {
    const wrapper = mount(SchemaPropertyHeading, {
      props: {
        value: {
          type: 'string',
          format: 'date-time',
        },
      },
    })

    const detailsElement = wrapper.find('.property-heading')
    expect(detailsElement.text()).toContain('string')
    expect(detailsElement.text()).toContain('date-time')
  })

  it('renders const value', async () => {
    const wrapper = mount(SchemaPropertyHeading, {
      props: {
        value: {
          const: 'example',
        },
      },
    })

    const constElement = wrapper.find('.property-const')
    expect(constElement.text()).toContain('const:')
    expect(constElement.text()).toContain('example')
  })

  it('renders pattern badge', async () => {
    const wrapper = mount(SchemaPropertyHeading, {
      props: {
        pattern: true,
      },
    })

    const constElement = wrapper.find('.property-pattern')
    expect(constElement.text()).toContain('pattern')
  })
})
