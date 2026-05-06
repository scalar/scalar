import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AppHeader from './AppHeader.vue'

describe('AppHeader', () => {
  it('forwards the `logo` slot through to the menu button so consumers can replace the Scalar logo with a team avatar', () => {
    const wrapper = mount(AppHeader, {
      slots: {
        logo: '<span data-test="custom-logo">ACME</span>',
      },
    })

    // The slot content should reach the rendered menu button. We assert on
    // the marker rather than on `ScalarMenu` internals so the test survives
    // future restructures of the menu chrome.
    const customLogo = wrapper.find('[data-test="custom-logo"]')
    expect(customLogo.exists()).toBe(true)
    expect(customLogo.text()).toBe('ACME')
  })

  it('falls back to the default Scalar menu logo when no `logo` slot is provided', () => {
    const wrapper = mount(AppHeader)

    // Sanity check that rendering without the slot does not throw and the
    // header still mounts. The actual default logo lives inside
    // `ScalarMenuButton`, so we only verify the absence of the override
    // marker here.
    expect(wrapper.find('[data-test="custom-logo"]').exists()).toBe(false)
  })

  it('renders the `menuTitle` prop inline inside the menu trigger so consumers can label the active scope', () => {
    // The menu trigger doubles as the leading breadcrumb segment by way of
    // the `menuTitle` prop ("Team" / "Local"). A prop (rather than a slot)
    // keeps consumers from having to thread a string through a slot just
    // to communicate which workspace type is active.
    const wrapper = mount(AppHeader, {
      props: {
        menuTitle: 'Team',
      },
    })

    // The button hosts the trigger - find it via the radix-set
    // aria-expanded attribute so the assertion does not couple to the
    // surrounding chrome.
    const trigger = wrapper.find('button[aria-expanded]')
    expect(trigger.text()).toContain('Team')
  })

  it('omits the menu trigger label when no `menuTitle` prop is provided', () => {
    const wrapper = mount(AppHeader)

    // Without a label the trigger should still mount cleanly (only the
    // logo + caret) - the absence of stray text is the contract here.
    const trigger = wrapper.find('button[aria-expanded]')
    expect(trigger.text()).not.toContain('Team')
    expect(trigger.text()).not.toContain('Local')
  })
})
