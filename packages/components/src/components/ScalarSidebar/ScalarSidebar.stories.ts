import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'

import { ICONS } from '..//ScalarIcon/icons'
import ScalarSidebar from './ScalarSidebar.vue'
import ScalarSidebarFooter from './ScalarSidebarFooter.vue'
import ScalarSidebarGroup from './ScalarSidebarGroup.vue'
import ScalarSidebarItem from './ScalarSidebarItem.vue'
import ScalarSidebarItems from './ScalarSidebarItems.vue'

const meta: Meta = {
  component: ScalarSidebar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    class: { control: 'text' },
    icon: { control: 'select', options: ICONS },
  },
  render: (args) => ({
    components: { ScalarSidebar },
    setup() {
      return { args }
    },
    template: `
<div class="flex h-screen">
  <ScalarSidebar v-bind="args">
    <div class="placeholder flex-1">Sidebar content</div>
  </ScalarSidebar>
  <div class="placeholder flex-1">Main content</div>
</div>
`,
  }),
}

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}

export const WithNavItems: Story = {
  args: {
    icon: 'Scribble',
  },
  render: (args) => ({
    components: {
      ScalarSidebar,
      ScalarSidebarItem,
      ScalarSidebarItems,
      ScalarSidebarGroup,
    },
    setup() {
      const open = ref(false)
      return { args, open }
    },
    template: `
<div class="flex h-screen">
  <ScalarSidebar>
    <ScalarSidebarItems>
      <ScalarSidebarItem href="#" :icon="args.icon" selected>Item 1 (Selected)</ScalarSidebarItem>
      <ScalarSidebarItem href="#" :icon="args.icon">Item 2 </ScalarSidebarItem>
      <ScalarSidebarItem href="#" :icon="args.icon">Item 3</ScalarSidebarItem>
      <ScalarSidebarItem :icon="args.icon" disabled>Item 4 (Disabled)</ScalarSidebarItem>
      <ScalarSidebarGroup v-model="open">
        Item Group ({{ open ? 'Open' : 'Closed' }})
        <template #items>
          <ScalarSidebarItem href="#" :icon="args.icon">Subitem 1</ScalarSidebarItem>
          <ScalarSidebarItem href="#" :icon="args.icon">Subitem 2</ScalarSidebarItem>
          <ScalarSidebarItem href="#" :icon="args.icon">Subitem 3</ScalarSidebarItem>
        </template>
      </ScalarSidebarGroup>
    </ScalarSidebarItems>
  </ScalarSidebar>
  <div class="placeholder flex-1">Main content</div>
</div>
`,
  }),
}

export const WithNestedGroups: Story = {
  render: (args) => ({
    components: {
      ScalarSidebar,
      ScalarSidebarItem,
      ScalarSidebarItems,
      ScalarSidebarGroup,
    },
    setup() {
      return { args }
    },
    template: `
<div class="flex h-screen">
  <ScalarSidebar>
    <ScalarSidebarItems class="custom-scroll">
      <ScalarSidebarGroup>
        Item Group
        <template #items>
          <ScalarSidebarItem :icon="args.icon">Subitem</ScalarSidebarItem>
          <ScalarSidebarItem :icon="args.icon">Subitem</ScalarSidebarItem>
            <ScalarSidebarGroup>
              Item Group
              <template #items>
                <ScalarSidebarItem :icon="args.icon">Subitem</ScalarSidebarItem>
                <ScalarSidebarItem :icon="args.icon">Subitem</ScalarSidebarItem>
                  <ScalarSidebarGroup>
                  Item Group
                  <template #items>
                    <ScalarSidebarItem :icon="args.icon">Subitem</ScalarSidebarItem>
                    <ScalarSidebarItem :icon="args.icon">Subitem</ScalarSidebarItem>
                      <ScalarSidebarGroup>
                        Item Group
                        <template #items>
                          <ScalarSidebarItem :icon="args.icon">Subitem</ScalarSidebarItem>
                          <ScalarSidebarItem :icon="args.icon">Subitem</ScalarSidebarItem>
                            <ScalarSidebarGroup>
                              Item Group
                              <template #items>
                                <ScalarSidebarItem :icon="args.icon">Subitem</ScalarSidebarItem>
                                <ScalarSidebarItem :icon="args.icon">Subitem</ScalarSidebarItem>
                                <ScalarSidebarItem :icon="args.icon">Subitem</ScalarSidebarItem>
                              </template>
                            </ScalarSidebarGroup>
                          <ScalarSidebarItem :icon="args.icon">Subitem</ScalarSidebarItem>
                        </template>
                      </ScalarSidebarGroup>
                    <ScalarSidebarItem :icon="args.icon">Subitem</ScalarSidebarItem>
                  </template>
                </ScalarSidebarGroup>
                <ScalarSidebarItem :icon="args.icon">Subitem</ScalarSidebarItem>
              </template>
            </ScalarSidebarGroup>
          <ScalarSidebarItem :icon="args.icon">Subitem</ScalarSidebarItem>
        </template>
      </ScalarSidebarGroup>
    </ScalarSidebarItems>
  </ScalarSidebar>
  <div class="placeholder flex-1">Main content</div>
</div>
`,
  }),
}

export const WithFooter: Story = {
  render: (args) => ({
    components: { ScalarSidebar, ScalarSidebarFooter },
    setup() {
      return { args }
    },
    template: `
<div class="flex h-screen">
  <ScalarSidebar>
    <div class="placeholder flex-1">Sidebar content</div>
    <ScalarSidebarFooter v-bind="args">
      <span class="placeholder">Footer content</span>
    </ScalarSidebarFooter>
  </ScalarSidebar>
  <div class="placeholder flex-1">Main content</div>
</div>
`,
  }),
}
