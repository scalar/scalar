import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarComboboxOption from './ScalarComboboxOption.vue'

describe('ScalarComboboxOption', () => {
  it('renders option with correct styles', () => {
    const wrapper = mount(ScalarComboboxOption, {
      props: {
        active: true,
        selected: true,
        style: 'checkbox',
      },
      slots: {
        default: 'Option Text',
      },
    })

    expect(wrapper.text()).toContain('Option Text')
    expect(wrapper.classes()).toContain('bg-b-2')
  })

  it('applies active and selected styles correctly', () => {
    const activeWrapper = mount(ScalarComboboxOption, {
      props: { active: true },
      slots: { default: 'Active Option' },
    })

    const selectedWrapper = mount(ScalarComboboxOption, {
      props: { selected: true },
      slots: { default: 'Selected Option' },
    })

    const inactiveWrapper = mount(ScalarComboboxOption, {
      props: { active: false, selected: false },
      slots: { default: 'Inactive Option' },
    })

    expect(activeWrapper.classes()).toContain('bg-b-2')
    expect(selectedWrapper.attributes('aria-selected')).toBe('true')
    expect(inactiveWrapper.classes()).not.toContain('bg-b-2')
  })

  it('passes slot props correctly', () => {
    const wrapper = mount(ScalarComboboxOption, {
      props: { active: true, selected: false },
      slots: {
        default: `
          <template #default="{ active, selected }">
            <div data-test="slot-content">
              <span data-test="active-state">{{ active }}</span>
              <span data-test="selected-state">{{ selected }}</span>
            </div>
          </template>
        `,
      },
    })

    expect(wrapper.find('[data-test="slot-content"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="active-state"]').text()).toBe('true')
    expect(wrapper.find('[data-test="selected-state"]').text()).toBe('false')
  })

  it('has proper accessibility attributes', () => {
    const wrapper = mount(ScalarComboboxOption, {
      props: { selected: true },
      slots: { default: 'Accessible Option' },
    })

    const element = wrapper.find('li')
    expect(element.attributes('role')).toBe('option')
    expect(element.attributes('tabindex')).toBe('-1')
    expect(element.attributes('aria-selected')).toBe('true')
  })
})
