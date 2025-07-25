import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarSidebarGroup from './ScalarSidebarGroup.vue'
import ScalarSidebarButton from './ScalarSidebarButton.vue'
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

    // The group button should have indent level 0 (base level)
    const groupButton = wrapper.findComponent(ScalarSidebarButton)
    expect(groupButton.props('indent')).toBe(0)

    // Open the group to reveal the items
    await groupButton.trigger('click')

    // Verify the item component is rendered
    const itemComponents = wrapper.findAllComponents(ScalarSidebarItem)
    expect(itemComponents).toHaveLength(1)

    // The ScalarSidebarItem doesn't receive an explicit indent prop - it uses the level from context
    expect(itemComponents[0]?.props('indent')).toBeUndefined()

    // After opening, we should have the group button + item button
    const allButtons = wrapper.findAllComponents(ScalarSidebarButton)
    expect(allButtons).toHaveLength(2)
    expect(allButtons[0]?.props('indent')).toBe(0) // Group button
    expect(allButtons[1]?.props('indent')).toBe(1) // Item button (one level deeper)
  })

  it('supports nested groups with correct levels', async () => {
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

    // Open the parent group to reveal nested content
    const parentButton = wrapper.findComponent(ScalarSidebarButton)
    await parentButton.trigger('click')

    // After opening, we should have: parent group button + level 1 item button + level 2 group button
    const buttonComponents = wrapper.findAllComponents(ScalarSidebarButton)
    expect(buttonComponents).toHaveLength(3)

    // Verify indent levels are correct
    expect(buttonComponents[0]?.props('indent')).toBe(0) // Parent group (base level)
    expect(buttonComponents[1]?.props('indent')).toBe(1) // Level 1 item (one level deeper)
    expect(buttonComponents[2]?.props('indent')).toBe(1) // Level 2 group (same level as level 1 item)
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

    // Open all groups by clicking any unexpanded buttons
    while (wrapper.find('button[aria-expanded="false"]').exists()) {
      await wrapper.find('button[aria-expanded="false"]').trigger('click')
    }

    // Find all button components
    const buttonComponents = wrapper.findAllComponents(ScalarSidebarButton)

    // Should have: 5 group buttons + 5 item buttons = 10 total
    expect(buttonComponents).toHaveLength(10)

    // Filter to get only the item buttons (they contain "Item" in their text)
    const itemButtons = buttonComponents.filter((button) => button.element.textContent?.includes('Item'))
    expect(itemButtons).toHaveLength(5)

    // Verify that item buttons have correct indent levels (1, 2, 3, 4, 5)
    itemButtons.forEach((button, index) => {
      expect(button.props('indent')).toBe(index + 1)
    })
  })
})
