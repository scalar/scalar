import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import ScalarIcon from './ScalarIcon.vue'

describe('ScalarIcon', () => {
  it('loads the Elixir language icon', async () => {
    const wrapper = mount(ScalarIcon, { props: { icon: 'programming-language-elixir', label: 'Elixir' } })
    await vi.dynamicImportSettled()
    expect(wrapper.attributes('aria-label')).toBe('Elixir')
    expect(wrapper.element.nodeName.toLowerCase()).toBe('svg')
  })

  it('updates thickness while preserving caller styles', async () => {
    const wrapper = mount(ScalarIcon, {
      props: { icon: 'Add', thickness: '1', label: 'Add item' },
      attrs: { style: { color: 'red' } },
    })

    expect(wrapper.element.style.color).toBe('red')
    expect(wrapper.element.style.getPropertyValue('--scalar-icon-stroke-width')).toBe('1')
    expect(wrapper.attributes('aria-label')).toBe('Add item')

    await wrapper.setProps({ thickness: '3' })

    expect(wrapper.element.style.color).toBe('red')
    expect(wrapper.element.style.getPropertyValue('--scalar-icon-stroke-width')).toBe('3')
  })

  it('renders properly', async () => {
    const wrapper = mount(ScalarIcon, { props: { icon: 'Logo' } })

    // Wait for icon to load
    await vi.dynamicImportSettled()

    expect(wrapper.element.nodeName.toLowerCase()).toBe('svg')
  })
})
