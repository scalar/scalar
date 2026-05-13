import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SpecificationVersion from './SpecificationVersion.vue'

describe('SpecificationVersion', () => {
  it('renders an OpenAPI badge by default when version is provided', () => {
    const wrapper = mount(SpecificationVersion, {
      props: {
        version: '3.1.0',
      },
    })

    expect(wrapper.text()).toBe('OpenAPI 3.1.0')
    expect(wrapper.findComponent({ name: 'Badge' }).exists()).toBe(true)
  })

  it('renders an AsyncAPI badge when documentType is asyncapi', () => {
    const wrapper = mount(SpecificationVersion, {
      props: {
        documentType: 'asyncapi',
        version: '3.0.0',
      },
    })

    expect(wrapper.text()).toBe('AsyncAPI 3.0.0')
    expect(wrapper.findComponent({ name: 'Badge' }).exists()).toBe(true)
  })

  it('renders an OpenAPI badge when documentType is openapi', () => {
    const wrapper = mount(SpecificationVersion, {
      props: {
        documentType: 'openapi',
        version: '3.0.4',
      },
    })

    expect(wrapper.text()).toBe('OpenAPI 3.0.4')
  })

  it('does not render anything when version is missing', () => {
    const wrapper = mount(SpecificationVersion, {
      props: {},
    })

    expect(wrapper.text()).toBe('')
    expect(wrapper.findComponent({ name: 'Badge' }).exists()).toBe(false)
  })
})
