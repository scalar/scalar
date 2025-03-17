import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarSidebarGroup from './ScalarSidebarGroup.vue'
import ScalarSidebarItem from './ScalarSidebarItem.vue'

describe('ScalarSidebarGroup', () => {
  it('renders a single group with correct base level', async () => {
    const wrapper = mount(ScalarSidebarGroup, {
      slots: {
        default: 'Group 1',
        items: '<ScalarSidebarItem>Items</ScalarSidebarItem>',
      },
      global: {
        components: {
          ScalarSidebarItem,
        },
      },
    })

    const button = wrapper.find('button')
    expect(button.attributes('aria-level')).toBe('0')

    await button.trigger('click')

    const item = wrapper.find('a')
    expect(item.attributes('aria-level')).toBe('1')
  })

  it('supports nested groups with correct aria levels', async () => {
    const wrapper = mount(ScalarSidebarGroup, {
      slots: {
        default: 'Parent Group',
        items: {
          template: `
            <ScalarSidebarItem>Level 1 Item</ScalarSidebarItem>
            <ScalarSidebarGroup>
              Level 2 Group
              <template #items>
                <ScalarSidebarItem>Level 2 Item</ScalarSidebarItem>
              </template>
            </ScalarSidebarGroup>
          `,
        },
      },
      global: {
        components: {
          ScalarSidebarGroup,
          ScalarSidebarItem,
        },
      },
    })

    // Open the parent group
    await wrapper.find('button').trigger('click')

    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(2) // Parent + 1 nested groups

    // Verify aria-level for each group
    expect(buttons[0].attributes('aria-level')).toBe('0') // Parent
    expect(buttons[1].attributes('aria-level')).toBe('1') // First nested
  })

  it('handles deeply nested groups', async () => {
    const wrapper = mount(ScalarSidebarGroup, {
      slots: {
        default: 'Level 1',
        items: {
          template: `
            <ScalarSidebarItem>Level 1 Item</ScalarSidebarItem>
            <ScalarSidebarGroup>
              Level 2
              <template #items>
                <ScalarSidebarItem>Level 2 Item</ScalarSidebarItem>
                <ScalarSidebarGroup>
                  Level 3
                  <template #items>
                    <ScalarSidebarItem>Level 3 Item</ScalarSidebarItem>
                    <ScalarSidebarGroup>
                      Level 4
                      <template #items>
                        <ScalarSidebarItem>Level 4 Item</ScalarSidebarItem>
                        <ScalarSidebarGroup>
                          Level 5
                          <template #items>
                            <ScalarSidebarItem>Level 5 Item</ScalarSidebarItem>
                          </template>
                        </ScalarSidebarGroup>
                      </template>
                    </ScalarSidebarGroup>
                  </template>
                </ScalarSidebarGroup>
              </template>
            </ScalarSidebarGroup>
          `,
        },
      },
      global: {
        components: {
          ScalarSidebarGroup,
          ScalarSidebarItem,
        },
      },
    })

    // Open all groups
    while (wrapper.find('button[aria-expanded="false"]').exists()) {
      await wrapper.find('button[aria-expanded="false"]').trigger('click')
    }

    const items = wrapper.findAll('a')

    // Verify aria-level for each nested level
    items.forEach((item, index) => {
      expect(item.attributes('aria-level')).toBe((index + 1).toString())
    })

    expect(items).toHaveLength(5) // Should have 5 levels of nesting
  })
})
