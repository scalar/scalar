import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarSidebarButton from './ScalarSidebarButton.vue'

describe('ScalarSidebarButton', () => {
  it('renders a link when an href is provided', () => {
    const wrapper = mount(ScalarSidebarButton, {
      props: { href: '/guides/getting-started' },
      slots: { default: 'Label' },
    })

    expect(wrapper.element.tagName).toBe('A')
    expect(wrapper.attributes('href')).toBe('/guides/getting-started')
  })

  it('drops the href when the rendered element is not an anchor', () => {
    const wrapper = mount(ScalarSidebarButton, {
      props: { is: 'button', href: '/guides/getting-started' },
      slots: { default: 'Label' },
    })

    // href is not a valid attribute on a button
    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.attributes('href')).toBeUndefined()
  })

  it('drops the href while the item is disabled', () => {
    const wrapper = mount(ScalarSidebarButton, {
      props: { href: '/guides/getting-started', disabled: true },
      slots: { default: 'Label' },
    })

    // An anchor cannot be disabled the way a button can, so it must not
    // stay navigable
    expect(wrapper.attributes('href')).toBeUndefined()
  })

  it('drops an empty href instead of rendering it', () => {
    const wrapper = mount(ScalarSidebarButton, {
      props: { href: '' },
      slots: { default: 'Label' },
    })

    expect(wrapper.attributes('href')).toBeUndefined()
  })

  it('marks the selected item as the current page', () => {
    const wrapper = mount(ScalarSidebarButton, {
      props: { href: '/guides/getting-started', selected: true },
      slots: { default: 'Label' },
    })

    expect(wrapper.attributes('aria-current')).toBe('page')
  })
})
