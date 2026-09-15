import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarHeaderColumn from './ScalarHeaderColumn.vue'

describe('ScalarHeaderColumn', () => {
  it('renders its contents', () => {
    const wrapper = mount(ScalarHeaderColumn, {
      slots: { default: 'Hello Vitest' },
    })

    expect(wrapper.text()).toContain('Hello Vitest')
  })

  it('lets a consumer class through', () => {
    // Sizing is expressed in Tailwind, so fallthrough is the real contract.
    const wrapper = mount(ScalarHeaderColumn, {
      attrs: { class: 'flex-1' },
    })

    expect(wrapper.classes()).toContain('flex-1')
  })
})
