import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import ScalarSidebar from './ScalarSidebar.vue'
import ScalarSidebarFooter from './ScalarSidebarFooter.vue'
import ScalarSidebarGroup from './ScalarSidebarGroup.vue'
import ScalarSidebarItem from './ScalarSidebarItem.vue'
import ScalarSidebarItems from './ScalarSidebarItems.vue'
import { ScalarIconFileArchive, ScalarIconFileAudio, ScalarIconFileText } from '@scalar/icons'
import ScalarSidebarSearchButton from './ScalarSidebarSearchButton.vue'
import ScalarSidebarSearchInput from './ScalarSidebarSearchInput.vue'

const meta: Meta = {
  component: ScalarSidebar,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    class: { control: 'text' },
    icon: {
      control: 'select',
      options: ['Text', 'Archive', 'Audio'],
      mapping: {
        Text: ScalarIconFileText,
        Archive: ScalarIconFileArchive,
        Audio: ScalarIconFileAudio,
      },
    },
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
  argTypes: {
    indent: { control: 'number' },
  },
  args: {
    indent: 18,
  },
  render: (args) => ({
    components: {
      ScalarSidebar,
      ScalarSidebarItem,
      ScalarSidebarItems,
      ScalarSidebarGroup,
    },
    setup() {
      const selected = ref('')
      return { args, selected }
    },
    template: `

<div class="flex h-screen" 
  :style="{ 
    '--scalar-sidebar-indent': args.indent + 'px', 
    '--scalar-sidebar-indent-border-hover': 'var(--scalar-color-3)',
    '--scalar-sidebar-indent-border-active': 'var(--scalar-color-accent)'
  }">
  <ScalarSidebar>
    <ScalarSidebarItems class="custom-scroll">
      <ScalarSidebarItem is="button" :icon="args.icon" :selected="selected === 'Item 1'" @click="selected = 'Item 1'">Item 1</ScalarSidebarItem>
      <ScalarSidebarItem is="button" :icon="args.icon" :selected="selected === 'Item 2'" @click="selected = 'Item 2'">Item 2</ScalarSidebarItem>
      <ScalarSidebarGroup>  
        Level 1 Group 
        <template #items>
          <ScalarSidebarItem is="button" :icon="args.icon" :selected="selected === 'Subitem 1'" @click="selected = 'Subitem 1'">Subitem 1</ScalarSidebarItem>
          <ScalarSidebarItem is="button" :icon="args.icon" :selected="selected === 'Subitem 2'" @click="selected = 'Subitem 2'">Subitem 2</ScalarSidebarItem>
            <ScalarSidebarGroup>
              Level 2 Group
              <template #items>
                <ScalarSidebarItem is="button" :icon="args.icon" :selected="selected === 'Subitem 3'" @click="selected = 'Subitem 3'">Subitem 3</ScalarSidebarItem>
                <ScalarSidebarItem is="button" :icon="args.icon" :selected="selected === 'Subitem 4'" @click="selected = 'Subitem 4'">Subitem 4</ScalarSidebarItem>
                  <ScalarSidebarGroup>
                  Level 3 Group
                  <template #items>
                    <ScalarSidebarItem is="button" :icon="args.icon" :selected="selected === 'Subitem 5'" @click="selected = 'Subitem 5'">Subitem 5</ScalarSidebarItem>
                    <ScalarSidebarItem is="button" :icon="args.icon" :selected="selected === 'Subitem 6'" @click="selected = 'Subitem 6'">Subitem 6</ScalarSidebarItem>
                      <ScalarSidebarGroup>
                        Level 4 Group
                        <template #items>
                          <ScalarSidebarItem is="button" :icon="args.icon" :selected="selected === 'Subitem 7'" @click="selected = 'Subitem 7'">Subitem 7</ScalarSidebarItem>
                          <ScalarSidebarItem is="button" :icon="args.icon" :selected="selected === 'Subitem 8'" @click="selected = 'Subitem 8'">Subitem 8</ScalarSidebarItem>
                            <ScalarSidebarGroup>
                              Level 5 Group
                              <template #items>
                                <ScalarSidebarItem is="button" :icon="args.icon" :selected="selected === 'Subitem 9'" @click="selected = 'Subitem 9'">Subitem 9</ScalarSidebarItem>
                                <ScalarSidebarItem is="button" :icon="args.icon" :selected="selected === 'Subitem 10'" @click="selected = 'Subitem 10'">Subitem 10</ScalarSidebarItem>
                                <ScalarSidebarItem is="button" :icon="args.icon" :selected="selected === 'Subitem 11'" @click="selected = 'Subitem 11'">Subitem 11</ScalarSidebarItem>
                              </template>
                            </ScalarSidebarGroup>
                          <ScalarSidebarItem is="button" :icon="args.icon" :selected="selected === 'Subitem 12'" @click="selected = 'Subitem 12'">Subitem 12</ScalarSidebarItem>
                        </template>
                      </ScalarSidebarGroup>
                    <ScalarSidebarItem is="button" :icon="args.icon" :selected="selected === 'Subitem 13'" @click="selected = 'Subitem 13'">Subitem 13</ScalarSidebarItem>
                  </template>
                </ScalarSidebarGroup>
                <ScalarSidebarItem is="button" :icon="args.icon" :selected="selected === 'Subitem 14'" @click="selected = 'Subitem 14'">Subitem 14</ScalarSidebarItem>
              </template>
            </ScalarSidebarGroup>
          <ScalarSidebarItem is="button" :icon="args.icon" :selected="selected === 'Subitem 15'" @click="selected = 'Subitem 15'">Subitem 15</ScalarSidebarItem>
        </template>
      </ScalarSidebarGroup>
      <ScalarSidebarItem is="button" :icon="args.icon" :selected="selected === 'Item 3'" @click="selected = 'Item 3'">Item 3</ScalarSidebarItem>
      <ScalarSidebarItem is="button" :icon="args.icon" :selected="selected === 'Item 4'" @click="selected = 'Item 4'">Item 4</ScalarSidebarItem>
    </ScalarSidebarItems>
  </ScalarSidebar>
  <div class="flex items-center justify-center flex-1 text-c-2">
    <template v-if="selected">
      {{ selected }} Selected
    </template>
    <template v-else>
      Select an item in the sidebar
    </template>
  </div>
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

export const WithSearchInput: Story = {
  render: (args) => ({
    components: { ScalarSidebar, ScalarSidebarSearchInput },
    setup() {
      return { args }
    },
    template: `
<div class="flex h-screen">
  <ScalarSidebar>
    <div class="p-1 pb-0">
      <ScalarSidebarSearchInput v-bind="args" />
    </div>
    <div class="placeholder flex-1">Sidebar content</div>
  </ScalarSidebar>
  <div class="placeholder flex-1">Main content</div>
</div>
`,
  }),
}

export const WithSearchButton: Story = {
  render: (args) => ({
    components: { ScalarSidebar, ScalarSidebarSearchButton },
    setup() {
      return { args }
    },
    template: `
<div class="flex h-screen">
  <ScalarSidebar>
    <div class="flex flex-col p-1 pb-0">
      <ScalarSidebarSearchButton v-bind="args">
        <template #shortcut>
          <span>⌘ K</span>
        </template>
      </ScalarSidebarSearchButton>
    </div>
    <div class="placeholder flex-1">Sidebar content</div>
  </ScalarSidebar>
  <div class="placeholder flex-1">Main content</div>
</div>
`,
  }),
}
