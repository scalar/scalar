import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import EnvironmentColors from './EnvironmentColors.vue'

describe('EnvironmentColors', () => {
  it('renders the component', () => {
    const wrapper = mount(EnvironmentColors, {
      props: {
        activeColor: '#FFFFFF',
      },
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('shows checkmark on the active color', () => {
    const wrapper = mount(EnvironmentColors, {
      props: {
        activeColor: '#EF0006',
      },
    })

    const icons = wrapper.findAllComponents({ name: 'ScalarIcon' })
    const checkmarks = icons.filter((icon) => icon.props('icon') === 'Checkmark')

    expect(checkmarks.length).toBeGreaterThan(0)
  })

  it('toggles from collapsed to expanded selector view', async () => {
    const wrapper = mount(EnvironmentColors, {
      props: {
        activeColor: '#EF0006',
      },
    })

    /** Initially shows collapsed view (single dot) */
    const collapsedView = wrapper.find('.flex.h-4.w-4.cursor-pointer')
    expect(collapsedView.exists()).toBe(true)

    /** Click to expand */
    await collapsedView.trigger('click')
    await wrapper.vm.$nextTick()

    /** Expanded view should now show color selector */
    const expandedView = wrapper.find('.color-selector')
    expect(expandedView.exists()).toBe(true)

    /** Should have 8 color options + divider + custom button */
    const children = wrapper.findAll('.color-selector > *')
    expect(children.length).toBeGreaterThan(8)
  })

  it('closes selector when selecting a preset color', async () => {
    const wrapper = mount(EnvironmentColors, {
      props: {
        activeColor: '#FFFFFF',
      },
    })

    /** Open selector */
    const collapsedView = wrapper.find('.flex.h-4.w-4.cursor-pointer')
    await collapsedView.trigger('click')
    await wrapper.vm.$nextTick()

    /** Verify selector is open */
    let expandedView = wrapper.find('.color-selector')
    expect(expandedView.exists()).toBe(true)

    /** Select the second color option */
    const colorOptions = wrapper.findAll('.color-selector > div')
    await colorOptions[1]?.trigger('click')
    await wrapper.vm.$nextTick()

    /** Should emit select event */
    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')?.[0]).toEqual(['#EF0006'])

    /** Selector should close after selection */
    expandedView = wrapper.find('.color-selector')
    expect(expandedView.exists()).toBe(false)
  })

  it('hides selector when opening custom color input', async () => {
    const wrapper = mount(EnvironmentColors, {
      props: {
        activeColor: '#FFFFFF',
      },
    })

    /** Open selector first */
    const collapsedView = wrapper.find('.flex.h-4.w-4.cursor-pointer')
    await collapsedView.trigger('click')
    await wrapper.vm.$nextTick()

    /** Verify selector is visible */
    const expandedView = wrapper.find('.color-selector')
    expect(expandedView.exists()).toBe(true)

    /** Click custom color button (last button in selector) */
    const buttons = wrapper.findAll('.color-selector button')
    const customColorButton = buttons[buttons.length - 1]
    await customColorButton?.trigger('click')
    await wrapper.vm.$nextTick()

    /** Custom input should be visible */
    const input = wrapper.find('input[type="text"]')
    expect(input.exists()).toBe(true)

    /** Selector with color options should be hidden */
    const colorDivs = wrapper.findAll('.color-selector > div')
    expect(colorDivs.length).toBe(0)
  })

  it('does not emit select event when custom color input is empty', async () => {
    const wrapper = mount(EnvironmentColors, {
      props: {
        activeColor: '#FFFFFF',
      },
    })

    /** Open selector then custom color input */
    const collapsedView = wrapper.find('.flex.h-4.w-4.cursor-pointer')
    await collapsedView.trigger('click')
    await wrapper.vm.$nextTick()

    const buttons = wrapper.findAll('.color-selector button')
    const customColorButton = buttons[buttons.length - 1]
    await customColorButton?.trigger('click')
    await wrapper.vm.$nextTick()

    /** Clear any previous emissions */
    const selectEvents = wrapper.emitted('select')
    if (selectEvents) {
      selectEvents.splice(0, selectEvents.length)
    }

    /** Try to input empty value */
    const input = wrapper.find('input[type="text"]')
    await input.setValue('')
    await wrapper.vm.$nextTick()

    /** Should not emit select event for empty input */
    expect(wrapper.emitted('select')).toBeFalsy()
  })

  it('focuses custom color input when opened', async () => {
    const wrapper = mount(EnvironmentColors, {
      props: {
        activeColor: '#FFFFFF',
      },
      attachTo: document.body,
    })

    /** Open selector then custom input */
    const collapsedView = wrapper.find('.flex.h-4.w-4.cursor-pointer')
    await collapsedView.trigger('click')
    await wrapper.vm.$nextTick()

    const buttons = wrapper.findAll('.color-selector button')
    const customColorButton = buttons[buttons.length - 1]
    await customColorButton?.trigger('click')
    await wrapper.vm.$nextTick()

    /** Input should exist and be focused */
    const input = wrapper.find('input[type="text"]')
    expect(input.exists()).toBe(true)
    expect(input.element).toBe(document.activeElement)

    wrapper.unmount()
  })
})
