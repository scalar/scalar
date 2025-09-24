import assert from 'node:assert'

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AddressBarHistory from './AddressBarHistory.vue'

const makeHistory = (count = 3) =>
  Array.from({ length: count }).map((_, i) => ({
    id: `id-${i}`,
    method: 'get' as const,
    path: `/path-${i}`,
    duration: 123 + i,
    status: 200,
  }))

describe('AddressBarHistory', () => {
  it('does not render the history button when history is empty', () => {
    const wrapper = mount(AddressBarHistory, {
      props: { target: 'target-id', history: [] },
    })

    // No button rendered when there is no history
    expect(wrapper.find('.address-bar-history-button').exists()).toBe(false)
  })

  it('renders the history button when history is present', () => {
    const history = makeHistory(2)
    const wrapper = mount(AddressBarHistory, {
      props: { target: 'target-id', history },
    })

    expect(wrapper.find('.address-bar-history-button').exists()).toBe(true)
  })

  it('emits selectHistoryItem with correct index when an item is clicked', async () => {
    const history = makeHistory(3)
    const wrapper = mount(AddressBarHistory, {
      props: { target: 'target-id', history },
      // Avoid heavy DOM from external UI libs; do not mock behavior, just render
      global: {
        stubs: {
          // Keep external components shallow; we only test this component behavior
          ScalarFloating: {
            template: '<div><slot /><slot name="floating" :width="400" /></div>',
          },
          ScalarFloatingBackdrop: true,
          ScalarIcon: true,
          // Headless UI minimal stubs to allow slot rendering and clicks
          Menu: {
            // expose `open` as true so floating content is rendered
            template: '<div><slot :open="true" /></div>',
          },
          MenuButton: {
            template: '<button class="address-bar-history-button"><slot /></button>',
          },
          MenuItems: {
            template: '<div class="menu-items"><slot /></div>',
          },
          MenuItem: {
            props: ['value'],
            emits: ['click'],
            template: '<button class="menu-item" @click="$emit(\'click\')"><slot /></button>',
          },
          HttpMethod: true,
        },
      },
    })

    // Ensure menu items are present (open=true via stub)
    const items = wrapper.findAll('.menu-item')
    expect(items.length).toBe(history.length)

    assert(items[1])

    // Click the second item
    await items[1].trigger('click')

    // Expect event emitted with correct index
    const emitted = wrapper.emitted('selectHistoryItem')
    expect(emitted).toBeTruthy()
    assert(emitted)
    assert(emitted[0])
    expect(emitted[0][0]).toEqual({ index: 1 })
  })
})
