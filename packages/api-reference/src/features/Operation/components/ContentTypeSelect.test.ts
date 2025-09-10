import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ContentTypeSelect from './ContentTypeSelect.vue'

describe('ContentTypeSelect', () => {
  it('renders with multiple content types as a dropdown', async () => {
    const wrapper = mount(ContentTypeSelect, {
      props: {
        content: {
          'application/json': {},
          'application/xml': {},
        },
        modelValue: 'application/json',
      },
    })

    expect(wrapper.findComponent({ name: 'ScalarListbox' }).exists()).toBe(true)
    expect(wrapper.text()).toContain('application/json')
  })

  it('renders with a single content type as plain text', async () => {
    const wrapper = mount(ContentTypeSelect, {
      props: {
        content: {
          'application/json': {},
        },
        modelValue: 'application/json',
      },
    })

    expect(wrapper.findComponent({ name: 'ScalarListbox' }).exists()).toBe(false)
    expect(wrapper.text()).toContain('application/json')
  })
})
