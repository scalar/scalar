import { disableConsoleError, disableConsoleWarn } from '@scalar/helpers/testing/console-spies'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import type { RequiredSecurity } from '@/features/Operation/helpers/get-required-security'

import SecurityRequirementBadge from './SecurityRequirementBadge.vue'

/** Single group, two AND-combined schemes */
const requiredAndGroup: RequiredSecurity = {
  state: 'required',
  requirements: [
    {
      schemes: [
        { name: 'oauth2', scheme: { type: 'oauth2', flows: {} }, scopes: ['read:items', 'write:items'] },
        { name: 'apiKey', scheme: { type: 'apiKey', name: 'X-API-Key', in: 'header' }, scopes: [] },
      ],
    },
  ],
}

/** Two OR alternatives, each with a single scheme */
const requiredOrAlternatives: RequiredSecurity = {
  state: 'required',
  requirements: [
    { schemes: [{ name: 'bearerAuth', scheme: { type: 'http', scheme: 'bearer' }, scopes: [] }] },
    { schemes: [{ name: 'apiKey', scheme: { type: 'apiKey', name: 'X-API-Key', in: 'header' }, scopes: [] }] },
  ],
}

/** Single group, single scheme */
const optional: RequiredSecurity = {
  state: 'optional',
  requirements: [{ schemes: [{ name: 'bearerAuth', scheme: { type: 'http', scheme: 'bearer' }, scopes: [] }] }],
}

const none: RequiredSecurity = { state: 'none', requirements: [] }

/** Mount and open the popover by clicking the badge button. Returns wrapper and cleanup fn. */
const mountAndOpen = async (requiredSecurity: RequiredSecurity) => {
  disableConsoleError()
  disableConsoleWarn()

  const wrapper = mount(SecurityRequirementBadge, {
    props: { requiredSecurity },
    attachTo: document.body,
  })

  await wrapper.find('.security-requirement-badge').trigger('click')
  await nextTick()

  return wrapper
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('SecurityRequirementBadge', () => {
  it('renders nothing when state is none', () => {
    const wrapper = mount(SecurityRequirementBadge, { props: { requiredSecurity: none } })
    expect(wrapper.find('.security-requirement-badge').exists()).toBe(false)
    wrapper.unmount()
  })

  it('renders "Auth Required" badge for required state', () => {
    const wrapper = mount(SecurityRequirementBadge, {
      props: { requiredSecurity: requiredAndGroup },
      attachTo: document.body,
    })
    expect(wrapper.find('.security-requirement-badge').text()).toContain('Auth Required')
    wrapper.unmount()
  })

  it('renders "Auth Optional" badge for optional state', () => {
    const wrapper = mount(SecurityRequirementBadge, {
      props: { requiredSecurity: optional },
      attachTo: document.body,
    })
    expect(wrapper.find('.security-requirement-badge').text()).toContain('Auth Optional')
    wrapper.unmount()
  })

  it('shows "all of:" header when a single group requires multiple AND schemes', async () => {
    const wrapper = await mountAndOpen(requiredAndGroup)
    const text = document.body.textContent ?? ''
    expect(text).toContain('all of:')
    expect(text).toContain('oauth2')
    expect(text).toContain('apiKey')
    wrapper.unmount()
  })

  it('shows "one of:" header when there are multiple OR alternatives', async () => {
    const wrapper = await mountAndOpen(requiredOrAlternatives)
    const text = document.body.textContent ?? ''
    expect(text).toContain('one of:')
    expect(text).toContain('bearerAuth')
    expect(text).toContain('apiKey')
    wrapper.unmount()
  })

  it('shows the scheme inline in the header for a single scheme, no list qualifier', async () => {
    const wrapper = await mountAndOpen(optional)
    const text = document.body.textContent ?? ''
    expect(text).toContain('Accepts')
    expect(text).toContain('bearerAuth')
    expect(text).not.toContain('one of:')
    expect(text).not.toContain('all of:')
    wrapper.unmount()
  })

  it('does not bubble clicks to an enclosing click handler (e.g. DisclosureButton)', async () => {
    disableConsoleError()
    disableConsoleWarn()

    // Create an enclosing element with a click listener to simulate the accordion's DisclosureButton.
    const enclosing = document.createElement('div')
    const enclosingClick = vi.fn()
    enclosing.addEventListener('click', enclosingClick)
    document.body.appendChild(enclosing)

    const wrapper = mount(SecurityRequirementBadge, {
      props: { requiredSecurity: requiredAndGroup },
      attachTo: enclosing,
    })

    const button = wrapper.find<HTMLButtonElement>('.security-requirement-badge')
    expect(button.exists()).toBe(true)
    // Sanity: the button is inside the enclosing element in the DOM tree.
    expect(enclosing.contains(button.element)).toBe(true)

    await button.trigger('click')
    await nextTick()

    expect(enclosingClick).not.toHaveBeenCalled()

    // Popover content still renders — confirms stopPropagation did not swallow Headless UI's handler.
    expect(document.body.textContent).toContain('Requires')

    wrapper.unmount()
    enclosing.remove()
  })
})
