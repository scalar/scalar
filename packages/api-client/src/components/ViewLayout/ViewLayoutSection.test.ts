import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ViewLayoutSection from './ViewLayoutSection.vue'

describe('ViewLayoutSection', () => {
  it('has .request-response-header class (when title slot is used)', () => {
    const wrapper = mount(ViewLayoutSection, {
      slots: {
        title: 'Hello World',
      },
    })

    expect(wrapper.text()).toBe('Hello World')
    expect(wrapper.find('.request-response-header').exists()).toBe(true)
  })
})
