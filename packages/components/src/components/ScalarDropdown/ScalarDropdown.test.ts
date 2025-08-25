import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { h, nextTick } from 'vue'

import ScalarDropdown from './ScalarDropdown.vue'
import ScalarDropdownItem from './ScalarDropdownItem.vue'
import ScalarDropdownDivider from './ScalarDropdownDivider.vue'
import ScalarDropdownMenu from './ScalarDropdownMenu.vue'
import ScalarDropdownButton from './ScalarDropdownButton.vue'

describe('ScalarDropdown', () => {
  it('renders closed, toggles open/closed with aria-expanded and exposes a menu role', async () => {
    const wrapper = mount(ScalarDropdown, {
      attachTo: document.body,
      slots: {
        default: () => h('button', 'Open'),
        items: () => h('div', 'Items'),
      },
    })

    const trigger = wrapper.get('button[aria-haspopup="menu"][aria-expanded=false]')

    // Closed by default (attribute may be absent or set to "false")
    const before = trigger.attributes('aria-expanded')
    expect(before === undefined || before === 'false').toBe(true)

    // Open
    await trigger.trigger('click')
    await nextTick()
    expect(trigger.attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('[role="menu"]').exists()).toBe(true)

    // Close (toggle)
    await trigger.trigger('click')
    await nextTick()
    const after = trigger.attributes('aria-expanded')
    expect(after === undefined || after === 'false').toBe(true)
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })

  it('renders items with correct roles and respects disabled state aria', async () => {
    const onFirst = vi.fn()
    const wrapper = mount(ScalarDropdown, {
      attachTo: document.body,
      slots: {
        default: () => h('button', { id: 'trigger' }, 'Open'),
        items: () => [
          h(ScalarDropdownItem, { onClick: onFirst }, { default: () => 'First' }),
          h(ScalarDropdownItem, { disabled: true }, { default: () => 'Disabled' }),
          h(ScalarDropdownDivider),
          h(ScalarDropdownItem, null, { default: () => 'Third' }),
        ],
      },
      shallow: false,
    })

    await wrapper.get('button[aria-haspopup="menu"]').trigger('click')
    await nextTick()

    const menu = wrapper.get('[role="menu"]')
    expect(menu.attributes('tabindex')).toBe('0')

    const items = wrapper.findAll('[role="menuitem"]')
    expect(items.length).toBeGreaterThan(0)

    // Verify disabled item exposes aria-disabled
    const disabled = items.find((el) => el.text() === 'Disabled')
    expect(disabled).toBeTruthy()
    expect(
      disabled!.attributes('aria-disabled') === 'true' ||
        disabled!.attributes('data-headlessui-state')?.includes('disabled'),
    ).toBe(true)

    // Click enabled first item triggers the provided handler and closes menu
    await items[0]?.trigger('click')
    expect(onFirst).toHaveBeenCalledTimes(1)

    await nextTick()
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })
})

describe('ScalarDropdownItem', () => {
  it('emits click when used inside ScalarDropdown', async () => {
    const onClick = vi.fn()
    const wrapper = mount(ScalarDropdown, {
      attachTo: document.body,
      slots: {
        default: () => h('button', { id: 'trigger' }, 'Open'),
        items: () => [h(ScalarDropdownItem, { onClick }, { default: () => 'Item' })],
      },
    })

    await wrapper.get('button[aria-haspopup="menu"]').trigger('click')
    await nextTick()

    await wrapper.get('[role="menuitem"]').trigger('click')
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

describe('ScalarDropdownMenu', () => {
  it('applies role="menu", tabindex and renders slot content', () => {
    const wrapper = mount(ScalarDropdownMenu, {
      slots: { default: '<div id="inner">Hello</div>' },
    })

    const root = wrapper.get('[role="menu"]')
    expect(root.attributes('tabindex')).toBe('0')
    expect(wrapper.get('#inner').text()).toBe('Hello')
  })
})

describe('ScalarDropdownButton', () => {
  it('defaults to a button element with type="button"', () => {
    const wrapper = mount(ScalarDropdownButton, {
      slots: { default: 'Label' },
    })

    const el = wrapper.get('button')
    expect(el.attributes('type')).toBe('button')
    expect(el.text()).toBe('Label')
  })

  it('does not set type attribute when rendered as a link', () => {
    const wrapper = mount(ScalarDropdownButton, {
      props: { is: 'a' },
      slots: { default: 'Link' },
    })

    expect(wrapper.find('a').exists()).toBe(true)
    expect(wrapper.find('a').attributes('type')).toBeUndefined()
  })
})

describe('ScalarDropdownDivider', () => {
  it('renders a non-interactive divider', () => {
    const wrapper = mount(ScalarDropdownDivider)
    const el = wrapper.get('div')
    expect(el.attributes('role')).toBeUndefined()
    expect(el.attributes('tabindex')).toBeUndefined()
  })
})
