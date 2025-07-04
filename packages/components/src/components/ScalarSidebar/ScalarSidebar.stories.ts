import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import ScalarSidebar from './ScalarSidebar.vue'
import ScalarSidebarFooter from './ScalarSidebarFooter.vue'
import ScalarSidebarGroup from './ScalarSidebarGroup.vue'
import ScalarSidebarItem from './ScalarSidebarItem.vue'
import ScalarSidebarItems from './ScalarSidebarItems.vue'
import { ScalarIconFileArchive, ScalarIconFileAudio, ScalarIconFileText } from '@scalar/icons'
import ScalarSidebarSearchButton from './ScalarSidebarSearchButton.vue'
import ScalarSidebarSection from './ScalarSidebarSection.vue'
import ScalarSidebarPlayground from './ScalarSidebarPlayground.vue'
import ScalarSidebarNestedItems from './ScalarSidebarNestedItems.vue'

const nestedItemGroups = `
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
` as const

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
    components: { ScalarSidebarPlayground },
    setup() {
      return { args }
    },
    template: `
<ScalarSidebarPlayground>
</ScalarSidebarPlayground>
`,
  }),
}

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}

export const WithNestedGroups: Story = {
  argTypes: { indent: { control: 'number' } },
  args: { indent: 20 },
  render: (args) => ({
    components: {
      ScalarSidebar,
      ScalarSidebarItem,
      ScalarSidebarItems,
      ScalarSidebarGroup,
      ScalarSidebarPlayground,
    },
    setup() {
      const selected = ref('')
      return { args, selected }
    },
    template: `
<ScalarSidebarPlayground v-model:selected="selected" :indent="args.indent">
  <ScalarSidebarItems>
    ${nestedItemGroups}
  </ScalarSidebarItems>
</ScalarSidebarPlayground>
`,
  }),
}

export const WithNestedSidebars: Story = {
  argTypes: { indent: { control: 'number' } },
  args: { indent: 20 },
  render: (args) => ({
    components: {
      ScalarSidebar,
      ScalarSidebarItem,
      ScalarSidebarItems,
      ScalarSidebarGroup,
      ScalarSidebarNestedItems,
      ScalarSidebarPlayground,
    },
    setup() {
      const selected = ref('')
      return { args, selected }
    },
    template: `
<ScalarSidebarPlayground v-model:selected="selected" :indent="args.indent">
  <ScalarSidebarItems>
    <ScalarSidebarNestedItems>
      Nested Items Level 1
      <template #back-label>
        Top Level Sidebar
      </template>
      <template #items>
        <ScalarSidebarNestedItems>
          Nested Items Level 2
          <template #items>
            <ScalarSidebarNestedItems>
              Nested Items Level 3
              <template #items>
                ${nestedItemGroups}
              </template>
            </ScalarSidebarNestedItems>
            ${nestedItemGroups}
          </template>
        </ScalarSidebarNestedItems>
        ${nestedItemGroups}
      </template>
    </ScalarSidebarNestedItems>
    <ScalarSidebarGroup>
      Group with Nested Items
      <template #items>
        <ScalarSidebarItem is="button" :icon="args.icon" :selected="selected === 'Subitem 1'" @click="selected = 'Subitem 1'">Subitem 1</ScalarSidebarItem>
        <ScalarSidebarNestedItems>
          Nested Items in a Group
          <template #items>
            ${nestedItemGroups}
          </template>
        </ScalarSidebarNestedItems>
        <ScalarSidebarItem is="button" :icon="args.icon" :selected="selected === 'Subitem 2'" @click="selected = 'Subitem 2'">Subitem 2</ScalarSidebarItem>
      </template>
    </ScalarSidebarGroup>
    ${nestedItemGroups}
    <ScalarSidebarNestedItems>
      More nested items
      <template #items>
        ${nestedItemGroups}
      </template>
    </ScalarSidebarNestedItems>
  </ScalarSidebarItems>
</ScalarSidebarPlayground>
`,
  }),
}

export const WithFooterContent: Story = {
  render: (args) => ({
    components: { ScalarSidebarPlayground, ScalarSidebarFooter },
    setup() {
      return { args }
    },
    template: `
<ScalarSidebarPlayground>
  <template #footer>
    <ScalarSidebarFooter v-bind="args">
      <span class="placeholder">Extra footer content</span>
    </ScalarSidebarFooter>
  </template>
</ScalarSidebarPlayground>
`,
  }),
}

export const WithSections: Story = {
  render: (args) => ({
    components: {
      ScalarSidebar,
      ScalarSidebarItem,
      ScalarSidebarItems,
      ScalarSidebarGroup,
      ScalarSidebarSection,
      ScalarSidebarPlayground,
    },
    setup() {
      const selected = ref('')
      return { args, selected }
    },
    template: `
<ScalarSidebarPlayground v-model:selected="selected">
  <ScalarSidebarItems>
    <ScalarSidebarSection>
      Section 1
      <template #items>
        <ScalarSidebarItem is="button" :icon="args.icon" :selected="selected === 'Item 1'" @click="selected = 'Item 1'">Item 1</ScalarSidebarItem>
        <ScalarSidebarItem is="button" :icon="args.icon" :selected="selected === 'Item 2'" @click="selected = 'Item 2'">Item 2</ScalarSidebarItem>
        <ScalarSidebarGroup>
          Group
          <template #items>
            <ScalarSidebarItem is="button" :icon="args.icon" :selected="selected === 'Subitem 1'" @click="selected = 'Subitem 1'">Subitem 1</ScalarSidebarItem>
              <ScalarSidebarSection>
              Nested Section
              <template #items>
                <ScalarSidebarItem is="button" :icon="args.icon" :selected="selected === 'Subitem 4'" @click="selected = 'Subitem 4'">Subitem 4</ScalarSidebarItem>
                <ScalarSidebarItem is="button" :icon="args.icon" :selected="selected === 'Subitem 5'" @click="selected = 'Subitem 5'">Subitem 5</ScalarSidebarItem>
                <ScalarSidebarItem is="button" :icon="args.icon" :selected="selected === 'Subitem 6'" @click="selected = 'Subitem 6'">Subitem 6</ScalarSidebarItem>
              </template>
            </ScalarSidebarSection>
            <ScalarSidebarItem is="button" :icon="args.icon" :selected="selected === 'Subitem 2'" @click="selected = 'Subitem 2'">Subitem 2</ScalarSidebarItem>
            <ScalarSidebarItem is="button" :icon="args.icon" :selected="selected === 'Subitem 3'" @click="selected = 'Subitem 3'">Subitem 3</ScalarSidebarItem>
          </template>
        </ScalarSidebarGroup>
        <ScalarSidebarItem is="button" :icon="args.icon" :selected="selected === 'Item 3'" @click="selected = 'Item 3'">Item 3</ScalarSidebarItem>
      </template>
    </ScalarSidebarSection>
    <ScalarSidebarSection>
      Section 2
      <template #items>
        <ScalarSidebarItem is="button" :icon="args.icon" :selected="selected === 'Item 4'" @click="selected = 'Item 4'">Item 4</ScalarSidebarItem>
        <ScalarSidebarItem is="button" :icon="args.icon" :selected="selected === 'Item 5'" @click="selected = 'Item 5'">Item 5</ScalarSidebarItem>
        <ScalarSidebarItem is="button" :icon="args.icon" :selected="selected === 'Item 6'" @click="selected = 'Item 6'">Item 6</ScalarSidebarItem>
      </template>
    </ScalarSidebarSection>
  </ScalarSidebarItems>
</ScalarSidebarPlayground>
`,
  }),
}

export const WithSearchButton: Story = {
  render: (args) => ({
    components: { ScalarSidebarPlayground, ScalarSidebarSearchButton },
    setup() {
      return { args }
    },
    template: `
<ScalarSidebarPlayground>
    <template #search>
      <div class="flex flex-col px-3 pt-3 sticky top-0 bg-sidebar-b-1">
      <ScalarSidebarSearchButton v-bind="args">
        <template #shortcut>
          <span>⌘ K</span>
        </template>
      </ScalarSidebarSearchButton>
    </div>
  </template>
</ScalarSidebarPlayground>
`,
  }),
}
