import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ServerDropdown from './ServerDropdown.vue'

describe('ServerDropdown', () => {
  const makeWrapper = (options?: { server?: any; servers?: any[]; layout?: 'modal' | 'web' | 'desktop' }) => {
    const servers = options?.servers ?? [
      { url: 'https://api-1.example.com', variables: {}, description: 'one' },
      { url: 'https://api-2.example.com/', variables: {} },
    ]

    const server = options?.server ?? servers[0]

    return mount(ServerDropdown, {
      props: {
        servers,
        server,
        target: 'test-target',
        layout: options?.layout ?? 'desktop',
      },
      global: {
        stubs: {
          // Render default and named slots so popover content is present in DOM
          ScalarPopover: {
            name: 'ScalarPopover',
            template:
              '<div data-test="popover"><slot /><slot name="popover" :close="() => {}" /><slot name="backdrop" /></div>',
          },
          // Keep button semantics for click handling
          ScalarButton: {
            name: 'ScalarButton',
            template: '<button><slot /></button>',
          },
          ScalarIcon: true,
          ScalarFloatingBackdrop: true,
          // Stub child item to count instances and emit events
          ServerDropdownItem: {
            name: 'ServerDropdownItem',
            template: '<div class="server-dropdown-item"></div>',
          },
        },
      },
    })
  }

  it('renders selected server label without trailing slash', () => {
    const wrapper = makeWrapper({ server: { url: 'https://api-2.example.com/' } })
    const text = wrapper.text()
    expect(text).toContain('https://api-2.example.com')
    expect(text).not.toContain('https://api-2.example.com/')
  })

  it('renders Add Server affordance when no server is selected', () => {
    const wrapper = makeWrapper({ server: undefined })
    // Accessible label rendered in DOM
    expect(wrapper.text()).toContain('Add Server')
  })

  it('renders a dropdown item for each server option', () => {
    const servers = [
      { url: 'https://a.example.com', variables: {} },
      { url: 'https://b.example.com', variables: {} },
      { url: 'https://c.example.com', variables: {} },
    ]
    const wrapper = makeWrapper({ servers, server: servers[0] })
    const items = wrapper.findAllComponents({ name: 'ServerDropdownItem' })
    expect(items.length).toBe(servers.length)
  })

  it('re-emits update:variable with normalized payload when a child emits update:variable', async () => {
    const wrapper = makeWrapper()
    const firstItem = wrapper.findComponent({ name: 'ServerDropdownItem' })
    // Simulate child emission (key, value)
    await firstItem.vm.$emit('update:variable', 'version', 'v2')
    const emitted = wrapper.emitted('update:variable')
    expect(emitted).toBeTruthy()
    expect(emitted?.[0]).toEqual([{ key: 'version', value: 'v2' }])
  })

  it('emits addServer when the Add Server button is clicked', async () => {
    const wrapper = makeWrapper()
    const addBtn = wrapper.findAll('button').find((b) => b.text().includes('Add Server'))
    expect(addBtn).toBeTruthy()
    await addBtn!.trigger('click')
    expect(wrapper.emitted('addServer')).toBeTruthy()
  })

  it('does not render Add Server button when layout is modal', () => {
    const wrapper = makeWrapper({ layout: 'modal' })
    const addBtn = wrapper.findAll('button').find((b) => b.text().includes('Add Server'))
    expect(addBtn).toBeUndefined()
  })
})
