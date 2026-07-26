import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import CompactSection from './CompactSection.vue'

describe('CompactSection', () => {
  const mountSection = (props: { id: string; label?: string; modelValue: boolean }) =>
    mount(CompactSection, {
      props,
      slots: {
        heading: '<span>User</span>',
        default: '<p>Schema body</p>',
      },
    })

  it('gives the collapse trigger an accessible name', () => {
    const wrapper = mountSection({ id: 'model/User', label: 'User', modelValue: false })

    expect(wrapper.get('button').attributes('aria-label')).toBe('User')
  })

  it('points aria-controls at the collapsible region, not at the trigger itself', () => {
    const wrapper = mountSection({ id: 'model/User', label: 'User', modelValue: true })

    const trigger = wrapper.get('button')
    const controls = trigger.attributes('aria-controls')

    expect(controls).toBeDefined()
    expect(controls).not.toBe(trigger.attributes('id'))
    expect(wrapper.get('.collapsible-section-content').attributes('id')).toBe(controls)
  })

  it('drops aria-controls while collapsed so it never dangles', () => {
    const wrapper = mountSection({ id: 'model/User', label: 'User', modelValue: false })

    expect(wrapper.get('button').attributes('aria-controls')).toBeUndefined()
  })
})
