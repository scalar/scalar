import { type VueWrapper, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Anchor from './Anchor.vue'

describe('Anchor', () => {
  const mountAnchor = (attrs: Record<string, unknown> = {}): VueWrapper =>
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
})
