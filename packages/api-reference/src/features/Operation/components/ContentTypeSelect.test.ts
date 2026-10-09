import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ContentTypeSelect from './ContentTypeSelect.vue'

describe('ContentTypeSelect', () => {
  it('renders with multiple content types as a dropdown', () => {
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

  it('renders with a single content type as plain text', () => {
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

  it('keeps the single content type readout out of the tab order', () => {
    const wrapper = mount(ContentTypeSelect, {
      props: {
        content: {
          'application/json': {},
        },
        modelValue: 'application/json',
      },
    })

    // Nothing to choose, so the readout is static text a keyboard user would
    // otherwise land on with no way to act on it.
    expect(wrapper.find('[role="group"]').attributes('tabindex')).toBeUndefined()
  })
})
