import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import OAuthScopesInput from '@/v2/blocks/scalar-auth-selector-block/components/OAuthScopesInput.vue'

// Minimal polyfill for environments without ResizeObserver (Headless UI can rely on it)
// This avoids errors without mocking application code.
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
window.ResizeObserver =
  window.ResizeObserver ||
  vi.fn().mockImplementation(() => ({
    disconnect: vi.fn(),
    observe: vi.fn(),
    unobserve: vi.fn(),
  }))

describe('OAuthScopesInput', () => {
  const baseFlow = {
    scopes: {
      'read:items': 'Read access to items',
      'write:items': 'Write access to items',
    },
  }

  const mountComponent = (opts?: { selected?: string[]; flow?: any }) => {
    return mount(OAuthScopesInput, {
      attachTo: document.body,
      props: {
        flow: opts?.flow ?? baseFlow,
        selectedScopes: opts?.selected ?? [],
      },
    })
  }

  const openDisclosure = async (wrapper: ReturnType<typeof mountComponent>) => {
    const toggle = wrapper.find('button')
    expect(toggle.exists()).toBe(true)
    await toggle.trigger('click')
    await nextTick()
  }

  it('renders count and expands to show scopes', async () => {
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('Scopes Selected')
    expect(wrapper.text()).toContain('0 / 2')

    await openDisclosure(wrapper)
    const rows = wrapper.findAll('tr')
    expect(rows.length).toBe(2)
    expect(wrapper.text()).toContain('read:items')
    expect(wrapper.text()).toContain('Write access to items')
  })

  it('selects and deselects a scope via row click', async () => {
    const wrapper = mountComponent()
    await openDisclosure(wrapper)

    const rows = wrapper.findAll('tr')
    expect(rows.length).toBe(2)

    // Select first scope
    await rows[0]!.trigger('click')
    const firstEmit = wrapper.emitted('update:selectedScopes')?.at(-1)?.[0] as any
    expect(firstEmit?.scopes).toEqual(['read:items'])

    // Simulate v-model by updating props
    await wrapper.setProps({ selectedScopes: firstEmit.scopes })
    await nextTick()
    expect(wrapper.text()).toContain('1 / 2')

    // Deselect first scope
    await rows[0]!.trigger('click')
    const secondEmit = wrapper.emitted('update:selectedScopes')?.at(-1)?.[0] as any
    expect(secondEmit?.scopes).toEqual([])

    await wrapper.setProps({ selectedScopes: secondEmit.scopes })
    await nextTick()
    expect(wrapper.text()).toContain('0 / 2')
  })

  it('Select All and Deselect All emit correct scopes', async () => {
    const wrapper = mountComponent()

    // Select All
    const selectAllBtn = wrapper.findAll('button').find((b) => b.text() === 'Select All')
    expect(selectAllBtn, 'Select All button should exist').toBeTruthy()
    await selectAllBtn!.trigger('click')

    const selectAllEmit = wrapper.emitted('update:selectedScopes')?.at(-1)?.[0] as any
    expect(selectAllEmit?.scopes.sort()).toEqual(['read:items', 'write:items'])

    await wrapper.setProps({ selectedScopes: selectAllEmit.scopes })
    await nextTick()
    expect(wrapper.text()).toContain('2 / 2')

    // Now Deselect All should be visible
    const deselectAllBtn = wrapper.findAll('button').find((b) => b.text() === 'Deselect All')
    expect(deselectAllBtn, 'Deselect All button should exist').toBeTruthy()
    await deselectAllBtn!.trigger('click')

    const deselectAllEmit = wrapper.emitted('update:selectedScopes')?.at(-1)?.[0] as any
    expect(deselectAllEmit?.scopes).toEqual([])

    await wrapper.setProps({ selectedScopes: deselectAllEmit.scopes })
    await nextTick()
    expect(wrapper.text()).toContain('0 / 2')
  })

  it('updates via checkbox change event', async () => {
    const wrapper = mountComponent()
    await openDisclosure(wrapper)

    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    expect(checkboxes.length).toBe(2)

    // Check first scope
    await checkboxes[0]!.setValue(true)
    const emit1 = wrapper.emitted('update:selectedScopes')?.at(-1)?.[0] as any
    expect(emit1?.scopes).toEqual(['read:items'])
    await wrapper.setProps({ selectedScopes: emit1.scopes })
    await nextTick()
    expect(wrapper.text()).toContain('1 / 2')

    // Uncheck first scope
    await checkboxes[0]!.setValue(false)
    const emit2 = wrapper.emitted('update:selectedScopes')?.at(-1)?.[0] as any
    expect(emit2?.scopes).toEqual([])
  })

  it('handles empty scopes gracefully', async () => {
    const wrapper = mountComponent({ flow: { scopes: {} } })

    expect(wrapper.text()).toContain('0 / 0')
    await openDisclosure(wrapper)
    const rows = wrapper.findAll('tr')
    expect(rows.length).toBe(0)

    // With no scopes, Deselect All is shown (all 0 selected)
    const deselectAllBtn = wrapper.findAll('button').find((b) => b.text() === 'Deselect All')
    expect(deselectAllBtn, 'Deselect All button should exist when there are 0/0 scopes').toBeTruthy()
    await deselectAllBtn!.trigger('click')
    const emit = wrapper.emitted('update:selectedScopes')?.at(-1)?.[0] as any
    expect(emit?.scopes).toEqual([])
  })
})
