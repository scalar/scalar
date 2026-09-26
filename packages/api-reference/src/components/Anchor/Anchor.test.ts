import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Anchor from './Anchor.vue'

describe('Anchor', () => {
  const mountAnchor = (attrs: Record<string, unknown> = {}) =>
    mount(Anchor, {
      slots: { default: 'Get authenticated user' },
      attrs,
    })

  it('renders a copy-link button described by the heading text', () => {
    const wrapper = mountAnchor()

    const button = wrapper.get('button')
    const heading = wrapper.get(`#${button.attributes('aria-describedby')}`)

    expect(button.text()).toBe('Copy link')
    expect(heading.text()).toBe('Get authenticated user')
  })

  /*
   * Emits are asserted through a listener rather than `wrapper.emitted()`:
   * this package compiles with `process.env.NODE_ENV` defined as production,
   * which strips the devtools hook test-utils records emits from.
   */
  it('emits copyAnchorUrl when the button is clicked', async () => {
    let copied = 0
    const wrapper = mountAnchor({
      onCopyAnchorUrl: () => {
        copied += 1
      },
    })

    await wrapper.get('button').trigger('click')

    expect(copied).toBe(1)
  })

  it('carries the hook class that trims the box in the narrow layout', () => {
    // The scoped rule that drops the trailing padding at narrow widths (so a
    // heading ending near the edge cannot widen the page) keys on this class.
    const wrapper = mountAnchor()

    expect(wrapper.get('button').classes()).toContain('anchor-copy-button')
  })
})
