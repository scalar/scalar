import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import CompactSection from './CompactSection.vue'

describe('CompactSection', () => {
  const mountSection = (props: { id: string; label?: string; modelValue: boolean }) =>
    mount(CompactSection, {
      props,
      global: { config: { idPrefix: 'scalar-refs' } },
      slots: {
        heading: '<span>User</span>',
        default: '<p>Schema body</p>',
      },
    })

  it('names the collapse trigger after its heading via aria-labelledby', () => {
    const wrapper = mountSection({ id: 'model/User', label: 'User', modelValue: false })

    const trigger = wrapper.get('button')
    const labelledby = trigger.attributes('aria-labelledby')

    // The name is referenced from the visible heading rather than copied into an
    // aria-label, so it can never drift out of sync and break WCAG 2.5.3.
    expect(trigger.attributes('aria-label')).toBeUndefined()
    expect(labelledby).toBeTruthy()
    expect(wrapper.get(`[id="${labelledby}"]`).text()).toContain('User')
  })

  it('points aria-controls at the collapsible region, not at the trigger itself', () => {
    const wrapper = mountSection({ id: 'model/User', label: 'User', modelValue: true })

    const trigger = wrapper.get('button')
    const controls = trigger.attributes('aria-controls')

    expect(controls).toBeDefined()
    expect(controls).not.toBe(trigger.attributes('id'))
    expect(wrapper.get('.collapsible-section-content').attributes('id')).toBe(controls)
  })

  it('separates panel and heading IDs across embeds that share a Vue ID prefix', () => {
    const first = mountSection({ id: 'first/~components/messages/Event', modelValue: true })
    const second = mountSection({ id: 'second/~components/messages/Event', modelValue: true })
    try {
      const firstTrigger = first.get('button')
      const secondTrigger = second.get('button')
      const firstPanelId = firstTrigger.attributes('aria-controls')
      const secondPanelId = secondTrigger.attributes('aria-controls')
      expect(firstPanelId).not.toBe(secondPanelId)
      expect(firstTrigger.attributes('aria-labelledby')).not.toBe(secondTrigger.attributes('aria-labelledby'))
      expect(first.get(`[id="${firstPanelId}"]`).text()).toBe('Schema body')
      expect(second.get(`[id="${secondPanelId}"]`).text()).toBe('Schema body')
    } finally {
      first.unmount()
      second.unmount()
    }
  })

  it('drops aria-controls while collapsed so it never dangles', () => {
    const wrapper = mountSection({ id: 'model/User', label: 'User', modelValue: false })

    expect(wrapper.get('button').attributes('aria-controls')).toBeUndefined()
  })
})
