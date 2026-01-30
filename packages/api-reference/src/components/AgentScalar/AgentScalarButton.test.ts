import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AgentScalarButton from './AgentScalarButton.vue'

describe('AgentScalarButton', () => {
  it('renders button with correct text and icon', () => {
    const wrapper = mount(AgentScalarButton)

    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)
    expect(button.attributes('type')).toBe('button')
    expect(wrapper.text()).toContain('Ask AI')
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})
