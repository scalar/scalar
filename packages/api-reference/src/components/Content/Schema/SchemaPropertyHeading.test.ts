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

  it('renders const value: false', async () => {
    const wrapper = mount(SchemaPropertyHeading, {
      props: {
        value: {
          const: false,
        },
      },
    })
    const constElement = wrapper.find('.property-const')
    expect(constElement.text()).toContain('const:')
    expect(constElement.text()).toContain('false')
  })

  it('renders const value: 0', async () => {
    const wrapper = mount(SchemaPropertyHeading, {
      props: {
        value: {
          const: 0,
        },
      },
    })
    const constElement = wrapper.find('.property-const')
    expect(constElement.text()).toContain('const:')
    expect(constElement.text()).toContain('0')
  })

  it('renders const value: empty string', async () => {
    const wrapper = mount(SchemaPropertyHeading, {
      props: {
        value: {
          const: '',
        },
      },
    })
    const constElement = wrapper.find('.property-const')
    expect(constElement.text()).toContain('const:')
    expect(constElement.text()).toContain('')
  })

  it('renders const value: null', async () => {
    const wrapper = mount(SchemaPropertyHeading, {
      props: {
        value: {
          const: null,
        },
      },
    })
    const constElement = wrapper.find('.property-const')
    expect(constElement.exists()).toBe(false)
  })

  it('renders const value in array items', async () => {
    const wrapper = mount(SchemaPropertyHeading, {
      props: {
        value: {
          type: 'array',
          items: {
            const: 'foo',
          },
        },
      },
    })

    const typeElement = wrapper.find('.property-detail')
    expect(typeElement.text()).toContain('array')

    const constElement = wrapper.find('.property-const')
    expect(constElement.text()).toContain('const:')
    expect(constElement.text()).toContain('foo')
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

  it('renders schema name', async () => {
    const wrapper = mount(SchemaPropertyHeading, {
      props: {
        value: {
          type: 'array',
          items: { type: 'object', name: 'Model' },
        },
        schemas: {
          Model: { type: 'object', name: 'Model' },
        },
      },
    })

    const detailsElement = wrapper.find('.property-heading')
    expect(detailsElement.text()).toContain('array Model[]')
  })

  it('renders default value: null', async () => {
    const wrapper = mount(SchemaPropertyHeading, {
      props: {
        value: {
          type: 'string',
          default: null,
        },
      },
    })
    const defaultValueElement = wrapper.find('.property-heading')
    expect(defaultValueElement.text()).toContain('default:')
    expect(defaultValueElement.text()).toContain('null')
  })

  it('renders default value: empty string', async () => {
    const wrapper = mount(SchemaPropertyHeading, {
      props: {
        value: {
          type: 'string',
          default: '',
        },
      },
    })
    const defaultValueElement = wrapper.find('.property-heading')
    expect(defaultValueElement.text()).toContain('default:')
    expect(defaultValueElement.text()).toContain('""')
  })
})
