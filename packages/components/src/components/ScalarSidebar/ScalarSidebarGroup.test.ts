import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, ref } from 'vue'

import ScalarSidebarButton from './ScalarSidebarButton.vue'
import ScalarSidebarGroup from './ScalarSidebarGroup.vue'
import ScalarSidebarItem from './ScalarSidebarItem.vue'

describe('ScalarSidebarGroup', () => {
  it('renders a single group with correct base level', async () => {
    const TestComponent = defineComponent({
      components: { ScalarSidebarGroup, ScalarSidebarItem },
      template: `
        <ScalarSidebarGroup>
          Group 1
          <template #items>
            <ScalarSidebarItem>Items</ScalarSidebarItem>
          </template>
        </ScalarSidebarGroup>
      `,
    })

    const wrapper = mount(TestComponent)
    const groupComponent = wrapper.findComponent(ScalarSidebarGroup)

    // The group button should have indent level 0 (base level)
    const groupButton = groupComponent.findComponent(ScalarSidebarButton)
    expect(groupButton.props('indent')).toBe(0)

    // Group should be closed initially
    expect(groupButton.attributes('aria-expanded')).toBe('false')

    // Open the group to reveal the items
    await groupButton.trigger('click')

    // Group should now be open
    expect(groupButton.attributes('aria-expanded')).toBe('true')

    // Verify the item component is rendered
    const itemComponents = wrapper.findAllComponents(ScalarSidebarItem)
    expect(itemComponents).toHaveLength(1)

    // The ScalarSidebarItem does not receive an explicit indent prop - it uses the level from context
    expect(itemComponents[0]?.props('indent')).toBeUndefined()

    // After opening, we should have the group button + item button
    const allButtons = wrapper.findAllComponents(ScalarSidebarButton)
    expect(allButtons).toHaveLength(2)
    expect(allButtons[0]?.props('indent')).toBe(0) // Group button
    expect(allButtons[1]?.props('indent')).toBe(1) // Item button (one level deeper)
  })

  it('allows a group to be controlled externally', async () => {
    const TestComponent = defineComponent({
      components: { ScalarSidebarGroup, ScalarSidebarItem },
      props: { open: { type: Boolean, default: false } },
      template: `
        <ScalarSidebarGroup :open>
          Group 1
          <template #items>
            <ScalarSidebarItem>Items</ScalarSidebarItem>
          </template>
        </ScalarSidebarGroup>
      `,
    })

    const wrapper = mount(TestComponent, {
      props: { controlled: true, open: false },
    })
    const groupComponent = wrapper.findComponent(ScalarSidebarGroup)

    // The group button should have indent level 0 (base level)
    const groupButton = groupComponent.findComponent(ScalarSidebarButton)

    // Group should be closed initially
    expect(groupButton.attributes('aria-expanded')).toBe('false')

    // Click the group button
    await groupButton.trigger('click')

    // The group should still be closed since it's controlled externally
    expect(groupButton.attributes('aria-expanded')).toBe('false')

    // Now update the prop to open the group
    await wrapper.setProps({ open: true })

    // Group should now be open
    expect(groupButton.attributes('aria-expanded')).toBe('true')
  })

  it('supports nested groups with correct levels', async () => {
    const TestComponent = defineComponent({
      components: { ScalarSidebarGroup, ScalarSidebarItem },
      setup() {
        const parentOpen = ref(false)
        const nestedOpen = ref(false)
        return { parentOpen, nestedOpen }
      },
      template: `
        <ScalarSidebarGroup v-model="parentOpen">
          Parent Group
          <template #items>
            <ScalarSidebarItem>Level 1 Item</ScalarSidebarItem>
            <ScalarSidebarGroup v-model="nestedOpen">
              Level 2 Group
              <template #items>
                <ScalarSidebarItem>Level 2 Item</ScalarSidebarItem>
              </template>
            </ScalarSidebarGroup>
          </template>
        </ScalarSidebarGroup>
      `,
    })

    const wrapper = mount(TestComponent)

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
    const TestComponent = defineComponent({
      components: { ScalarSidebarGroup, ScalarSidebarItem },
      template: `
        <ScalarSidebarGroup>
          Level 1
          <template #items>
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
          </template>
        </ScalarSidebarGroup>
      `,
    })

    const wrapper = mount(TestComponent)

    /**
     * Open all groups iteratively.
     * Nested groups only become visible after their parent is expanded,
     * so we need to keep finding and clicking until all are open.
     */
    let unexpandedButtons = wrapper.findAll('button[aria-expanded="false"]')
    while (unexpandedButtons.length > 0) {
      await unexpandedButtons[0]?.trigger('click')
      unexpandedButtons = wrapper.findAll('button[aria-expanded="false"]')
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
