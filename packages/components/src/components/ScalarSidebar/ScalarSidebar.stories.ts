import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'

import ScalarSidebar from './ScalarSidebar.vue'
import ScalarSidebarFooter from './ScalarSidebarFooter.vue'
import ScalarSidebarGroup from './ScalarSidebarGroup.vue'
import ScalarSidebarItem from './ScalarSidebarItem.vue'
import ScalarSidebarItems from './ScalarSidebarItems.vue'

const meta: Meta<typeof ScalarSidebar> = {
  component: ScalarSidebar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: { class: { control: 'text' } },
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
      <ScalarSidebarItem href="#" icon="Scribble" selected>Item 1 (Selected)</ScalarSidebarItem>
      <ScalarSidebarItem href="#" icon="Scribble">Item 2 </ScalarSidebarItem>
      <ScalarSidebarItem href="#" icon="Scribble">Item 3</ScalarSidebarItem>
      <ScalarSidebarItem icon="Scribble" disabled>Item 4 (Disabled)</ScalarSidebarItem>
      <ScalarSidebarGroup v-model="open">
        Item Group ({{ open ? 'Open' : 'Closed' }})
        <template #items>
          <ScalarSidebarItem href="#" icon="Scribble">Subitem 1</ScalarSidebarItem>
          <ScalarSidebarItem href="#" icon="Scribble">Subitem 2</ScalarSidebarItem>
          <ScalarSidebarItem href="#" icon="Scribble">Subitem 3</ScalarSidebarItem>
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
