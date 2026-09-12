import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SettingsOption from './SettingsOption.vue'

describe('SettingsOption', () => {
  it('renders the label and the trailing slot', () => {
    const wrapper = mount(SettingsOption, {
      slots: { default: 'Skip the proxy', trailing: '<span>Trailing</span>' },
    })

    expect(wrapper.text()).toContain('Skip the proxy')
    expect(wrapper.text()).toContain('Trailing')
  })

  it('exposes the selected state to assistive technology', async () => {
    const wrapper = mount(SettingsOption, {
      props: { selected: false },
      slots: { default: 'Skip the proxy' },
    })

    expect(wrapper.get('button').attributes('aria-pressed')).toBe('false')

    await wrapper.setProps({ selected: true })

    expect(wrapper.get('button').attributes('aria-pressed')).toBe('true')
  })

  it('only renders the checkmark when selected', async () => {
    const wrapper = mount(SettingsOption, {
      props: { selected: false },
      slots: { default: 'Skip the proxy' },
    })

    expect(wrapper.find('svg').exists()).toBe(false)

    await wrapper.setProps({ selected: true })

    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('forwards clicks to the parent', async () => {
    const wrapper = mount(SettingsOption, { slots: { default: 'Skip the proxy' } })

    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  /**
   * The solid button variant paints a dark background while the button is pressed, which
   * used to make the option label unreadable mid click. Guard against it coming back.
   */
  it.each([true, false])('never paints the dark button background when selected is %s', (selected) => {
    const wrapper = mount(SettingsOption, {
      props: { selected },
      slots: { default: 'Skip the proxy' },
    })

    const classes = wrapper.get('button').classes()

    expect(classes).not.toContain('bg-b-btn')
    expect(classes).not.toContain('active:bg-b-btn')
    expect(classes).not.toContain('hover:bg-h-btn')
  })
})
