import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import ScalarMarkdownSummary from './ScalarMarkdownSummary.vue'

describe('ScalarMarkdownSummary (aria attributes)', () => {
  it('sets aria-expanded=true when open and toggles on click', async () => {
    const wrapper = mount(ScalarMarkdownSummary, {
      props: {
        // Start open so the toggle button is always visible without relying on truncation
        modelValue: true,
        value: '# Title\n\nContent',
      },
    })

    // Button exists and reflects expanded state
    const btn = wrapper.get('button')
    expect(btn.attributes('aria-expanded')).toBe('true')

    // Click to collapse
    await btn.trigger('click')
    await nextTick()

    // After collapsing: either button is removed (not truncated) or aria-expanded becomes false
    const maybeBtn = wrapper.find('button')
    if (maybeBtn.exists()) {
      expect(maybeBtn.attributes('aria-expanded')).toBe('false')
    } else {
      expect(maybeBtn.exists()).toBe(false)
    }
  })

  it('sets aria-controls to a stable id string', () => {
    const wrapper = mount(ScalarMarkdownSummary, {
      props: {
        modelValue: true,
        value: '# Title',
      },
    })

    const btn = wrapper.get('button')
    const controls = btn.attributes('aria-controls')
    expect(typeof controls).toBe('string')
    expect(controls?.length).toBeGreaterThan(0)
  })
})
