import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { captureCustomEvent } from '../../../test/utils/custom-event'
import TestRequestButton from './TestRequestButton.vue'

describe('TestRequestButton', () => {
  it('renders button with correct text and icon when operation is provided', () => {
    const wrapper = mount(TestRequestButton, {
      props: {
        method: 'get',
        path: '/test',
      },
    })

    expect(wrapper.find('button').exists()).toBe(true)
    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.text()).toContain('Test Request')
    expect(wrapper.text()).toContain('(get /test)')
  })

  it('has correct button attributes', () => {
    const wrapper = mount(TestRequestButton, {
      props: {
        method: 'post',
        path: '/users',
      },
    })

    const button = wrapper.find('button')
    expect(button.attributes('type')).toBe('button')
    // Some use this to style the button (e.g. nuxt-theme.css)
    expect(button.classes()).toContain('show-api-client-button')
  })

  it('calls client.open with correct params when clicked', async () => {
    const wrapper = mount(TestRequestButton, {
      props: {
        method: 'delete',
        path: '/users/1',
      },
    })

    const customEvent = captureCustomEvent(wrapper.find('button').element, 'scalar-open-client')
    await wrapper.find('button').trigger('click')

    await customEvent({})
  })
})
