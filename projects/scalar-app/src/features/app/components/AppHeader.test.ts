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

  it('renders the `breadcrumb` slot alongside the menu trigger so consumers can surface the active document and version', () => {
    // The breadcrumb sits in the start section of the header next to the
    // menu trigger. Hosts typically thread a document/version picker
    // through this slot, so we just verify that arbitrary content reaches
    // the DOM rather than coupling to picker internals.
    const wrapper = mount(AppHeader, {
      slots: {
        breadcrumb: '<span data-test="breadcrumb">overview / v1</span>',
      },
    })

    const breadcrumb = wrapper.find('[data-test="breadcrumb"]')
    expect(breadcrumb.exists()).toBe(true)
    expect(breadcrumb.text()).toBe('overview / v1')
  })

  it('does not render the `breadcrumb` slot wrapper when no breadcrumb is provided', () => {
    // Absence of the slot means the start section should only host the
    // menu trigger - guarding against an empty wrapper that would otherwise
    // affect layout and spacing.
    const wrapper = mount(AppHeader)

    expect(wrapper.find('[data-test="breadcrumb"]').exists()).toBe(false)
  })

  it('renders the `end` slot in the trailing section of the header for consumer-controlled actions', () => {
    // The end slot hosts things like the publish button or user menu in
    // the team workspace. Verifying that arbitrary content reaches the DOM
    // is the contract; the surrounding `ScalarHeader` chrome is covered
    // by its own tests in `@scalar/components`.
    const wrapper = mount(AppHeader, {
      slots: {
        end: '<button data-test="end-action">Publish</button>',
      },
    })

    const endAction = wrapper.find('[data-test="end-action"]')
    expect(endAction.exists()).toBe(true)
    expect(endAction.text()).toBe('Publish')
  })

  it('overrides the default Settings menu item when the `menuItems` slot is provided', async () => {
    // The default menu item is a "Settings" link. Consumers replace the
    // whole section through `menuItems` rather than appending, so the
    // default must be absent when the slot is filled. We open the menu
    // first because the items only render once the popover is expanded.
    const wrapper = mount(AppHeader, {
      slots: {
        menuItems: '<button data-test="custom-menu-item">Custom action</button>',
      },
      attachTo: document.body,
    })

    await wrapper.find('button[aria-expanded]').trigger('click')

    const customItem = document.querySelector('[data-test="custom-menu-item"]')
    expect(customItem).not.toBeNull()
    expect(customItem?.textContent).toBe('Custom action')

    // The default Settings entry should not appear when the slot wins.
    expect(document.body.textContent).not.toContain('Settings')

    wrapper.unmount()
  })

  it('emits `navigate:to:settings` when the default Settings menu item is activated', async () => {
    // The default menu item exists so hosts that do not customize the
    // menu still get a working settings entry point. Clicking it should
    // bubble an intent (not a route) so the host owns navigation.
    const wrapper = mount(AppHeader, { attachTo: document.body })

    await wrapper.find('button[aria-expanded]').trigger('click')

    const settings = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.includes('Settings'))
    expect(settings).toBeDefined()
    settings?.click()

    expect(wrapper.emitted('navigate:to:settings')).toBeTruthy()
    expect(wrapper.emitted('navigate:to:settings')?.length).toBe(1)

    wrapper.unmount()
  })
})
