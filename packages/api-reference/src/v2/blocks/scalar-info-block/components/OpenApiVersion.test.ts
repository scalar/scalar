import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import OpenApiVersion from './OpenApiVersion.vue'

describe('OpenApiVersion', () => {
  it('renders OAS version badge when oasVersion prop is provided', () => {
    const wrapper = mount(OpenApiVersion, {
      props: {
        oasVersion: '3.1.0',
      },
    })

    expect(wrapper.text()).toBe('OAS 3.1.0')
    expect(wrapper.findComponent({ name: 'Badge' }).exists()).toBe(true)
  })

  it('does not render anything when oasVersion prop is missing', () => {
    const wrapper = mount(OpenApiVersion, {
      props: {},
    })

    expect(wrapper.text()).toBe('')
    expect(wrapper.findComponent({ name: 'Badge' }).exists()).toBe(false)
  })
})
