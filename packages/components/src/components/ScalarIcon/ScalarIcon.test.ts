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

  it('renders properly', async () => {
    const wrapper = mount(ScalarIcon, { props: { icon: 'Logo' } })

    // Wait for icon to load
    await vi.dynamicImportSettled()

    expect(wrapper.element.nodeName.toLowerCase()).toBe('svg')
  })
})
