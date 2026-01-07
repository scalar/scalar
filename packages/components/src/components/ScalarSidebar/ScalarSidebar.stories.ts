import { ScalarIconFileArchive, ScalarIconFileAudio, ScalarIconFileText } from '@scalar/icons'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'

import ScalarSidebar from './ScalarSidebar.vue'
import ScalarSidebarFooter from './ScalarSidebarFooter.vue'
import ScalarSidebarGroup from './ScalarSidebarGroup.vue'
import ScalarSidebarItem from './ScalarSidebarItem.vue'
import ScalarSidebarItems from './ScalarSidebarItems.vue'
import ScalarSidebarNestedItems from './ScalarSidebarNestedItems.vue'
import ScalarSidebarPlayground from './ScalarSidebarPlayground.vue'
import ScalarSidebarSearchButton from './ScalarSidebarSearchButton.vue'
import ScalarSidebarSection from './ScalarSidebarSection.vue'

/**
 * Helper to generate nested item groups for the stories
 */
const nestedItemGroups = ({
  itemAttrs = (label: string) =>
    `is="button" :icon="args.icon" :selected="selected === '${label}'" @click="selected = '${label}'"`,
  groupAttrs = () => `:controlled="args.controlled"`,
}: {
  itemAttrs?: (label: string) => string
  groupAttrs?: (label: string) => string
} = {}) =>
  `
<ScalarSidebarItem ${itemAttrs('Item 1')}>Item 1</ScalarSidebarItem>
<ScalarSidebarItem ${itemAttrs('Item 2')}>Item 2</ScalarSidebarItem>
<ScalarSidebarGroup ${groupAttrs('Level 1 Group')}>  
  Level 1 Group 
  <template #items>
    <ScalarSidebarItem ${itemAttrs('Subitem 1')}>Subitem 1</ScalarSidebarItem>
    <ScalarSidebarItem ${itemAttrs('Subitem 2')}>Subitem 2</ScalarSidebarItem>
      <ScalarSidebarGroup ${groupAttrs('Level 2 Group')}>
        Level 2 Group
        <template #items>
          <ScalarSidebarItem ${itemAttrs('Subitem 3')}>Subitem 3</ScalarSidebarItem>
          <ScalarSidebarItem ${itemAttrs('Subitem 4')}>Subitem 4</ScalarSidebarItem>
            <ScalarSidebarGroup ${groupAttrs('Level 3 Group')}>
            Level 3 Group
            <template #items>
              <ScalarSidebarItem ${itemAttrs('Subitem 5')}>Subitem 5</ScalarSidebarItem>
              <ScalarSidebarItem ${itemAttrs('Subitem 6')}>Subitem 6</ScalarSidebarItem>
                <ScalarSidebarGroup ${groupAttrs('Level 4 Group')}>
                  Level 4 Group
                  <template #items>
                    <ScalarSidebarItem ${itemAttrs('Subitem 7')}>Subitem 7</ScalarSidebarItem>
                    <ScalarSidebarItem ${itemAttrs('Subitem 8')}>Subitem 8</ScalarSidebarItem>
                      <ScalarSidebarGroup ${groupAttrs('Level 5 Group')}>
                        Level 5 Group
                        <template #items>
                          <ScalarSidebarItem ${itemAttrs('Subitem 9')}>Subitem 9</ScalarSidebarItem>
                          <ScalarSidebarItem ${itemAttrs('Subitem 10')}>Subitem 10</ScalarSidebarItem>
                          <ScalarSidebarItem ${itemAttrs('Subitem 11')}>Subitem 11</ScalarSidebarItem>
                        </template>
                      </ScalarSidebarGroup>
                    <ScalarSidebarItem ${itemAttrs('Subitem 12')}>Subitem 12</ScalarSidebarItem>
                  </template>
                </ScalarSidebarGroup>
              <ScalarSidebarItem ${itemAttrs('Subitem 13')}>Subitem 13</ScalarSidebarItem>
            </template>
          </ScalarSidebarGroup>
          <ScalarSidebarItem ${itemAttrs('Subitem 14')}>Subitem 14</ScalarSidebarItem>
        </template>
      </ScalarSidebarGroup>
    <ScalarSidebarItem ${itemAttrs('Subitem 15')}>Subitem 15</ScalarSidebarItem>
  </template>
</ScalarSidebarGroup>
<ScalarSidebarItem ${itemAttrs('Item 3')}>Item 3</ScalarSidebarItem>
<ScalarSidebarItem ${itemAttrs('Item 4')}>Item 4</ScalarSidebarItem>
` as const

const meta: Meta = {
  component: ScalarSidebar,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    indent: 20,
    backgroundOne: 'var(--scalar-background-1)',
    colorOne: 'var(--scalar-color-1)',
    colorTwo: 'var(--scalar-color-2)',
    borderColor: 'var(--scalar-border-color)',
    itemHoverBackground: 'var(--scalar-background-2)',
    itemHoverColor: 'var(--scalar-sidebar-color-2)',
    itemActiveBackground: 'var(--scalar-background-2)',
    itemActiveColor: 'var(--scalar-sidebar-color-1)',
    indentBorder: 'var(--scalar-border-color)',
    indentBorderHover: 'var(--scalar-border-color)',
    indentBorderActive: 'var(--scalar-color-accent)',
    searchBackground: 'transparent',
    searchColor: 'var(--scalar-color-3)',
    searchBorderColor: 'var(--scalar-border-color)',
  },
  argTypes: {
    class: { control: 'text' },
    controlled: { control: 'boolean' },
    icon: {
      control: 'select',
      options: ['Text', 'Archive', 'Audio'],
      mapping: {
        Text: ScalarIconFileText,
        Archive: ScalarIconFileArchive,
        Audio: ScalarIconFileAudio,
      },
    },
    indent: { control: 'number' },
    backgroundOne: { control: 'color' },
    colorOne: { control: 'color' },
    colorTwo: { control: 'color' },
    borderColor: { control: 'color' },
    itemHoverBackground: { control: 'color' },
    itemHoverColor: { control: 'color' },
    itemActiveBackground: { control: 'color' },
    itemActiveColor: { control: 'color' },
    indentBorder: { control: 'color' },
    indentBorderHover: { control: 'color' },
    indentBorderActive: { control: 'color' },
    searchBackground: { control: 'color' },
    searchColor: { control: 'color' },
    searchBorderColor: { control: 'color' },
  },
  render: (args) => ({
    components: {
      ScalarSidebar,
      ScalarSidebarItem,
      ScalarSidebarItems,
      ScalarSidebarGroup,
      ScalarSidebarNestedItems,
      ScalarSidebarSection,
      ScalarSidebarPlayground,
    },
    setup() {
      const selected = ref('')
      return { args, selected }
    },
    template: `
<ScalarSidebarPlayground v-model:selected="selected" v-bind="args">
  <ScalarSidebarItems>
    <ScalarSidebarSection>
      Navigation
      <template #items>
        <ScalarSidebarNestedItems :controlled="args.controlled">
          Nested Items Level 1
          <template #back-label>
            Top Level Sidebar
          </template>
          <template #items>
            <ScalarSidebarNestedItems :controlled="args.controlled">
              Nested Items Level 2
              <template #items>
                <ScalarSidebarNestedItems :controlled="args.controlled">
                  Nested Items Level 3
                  <template #items>
                    ${nestedItemGroups()}
                  </template>
                </ScalarSidebarNestedItems>
                ${nestedItemGroups()}
              </template>
            </ScalarSidebarNestedItems>
            ${nestedItemGroups()}
          </template>
        </ScalarSidebarNestedItems>
        <ScalarSidebarGroup>
          Group with Nested Sidebar
          <template #items>
            <ScalarSidebarItem is="button" :icon="args.icon" :selected="selected === 'Subitem 1'" @click="selected = 'Subitem 1'">Subitem 1</ScalarSidebarItem>
            <ScalarSidebarNestedItems :controlled="args.controlled">
              Nested Items in a Group
              <template #items>
                ${nestedItemGroups()}
              </template>
            </ScalarSidebarNestedItems>
            <ScalarSidebarItem is="button" :icon="args.icon" :selected="selected === 'Subitem 2'" @click="selected = 'Subitem 2'">Subitem 2</ScalarSidebarItem>
          </template>
        </ScalarSidebarGroup>
        ${nestedItemGroups()}
      </template>
    </ScalarSidebarSection>
    <ScalarSidebarSection>
      Additional Items
      <template #items>
        <ScalarSidebarNestedItems>
          More nested items
          <template #items>
            ${nestedItemGroups()}
          </template>
        </ScalarSidebarNestedItems>
        <ScalarSidebarItem is="button" :icon="args.icon" :selected="selected === 'Standalone Item'" @click="selected = 'Standalone Item'">Standalone Item</ScalarSidebarItem>
      </template>
    </ScalarSidebarSection>
  </ScalarSidebarItems>
</ScalarSidebarPlayground>
`,
  }),
}

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}

export const Themed: Story = {
  args: {
    indent: 32,
    backgroundOne: '#27212e',
    colorOne: '#fff',
    colorTwo: '#b8b6ba',
    borderColor: '#3d3843',
    itemHoverBackground: '#322c39',
    itemHoverColor: '#fff',
    itemActiveBackground: '#322c39',
    itemActiveColor: '#fff',
    indentBorder: '#3d3843',
    indentBorderHover: '#fff',
    indentBorderActive: '#ed78c2',
    searchBackground: '#322c39',
    searchColor: '#706c74',
    searchBorderColor: '#3d3843',
  },
}

export const DiscreteGroups: Story = {
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
<ScalarSidebarPlayground v-model:selected="selected" v-bind="args">
  <ScalarSidebarItems>
    ${nestedItemGroups({ groupAttrs: (label: string) => `:icon="args.icon" :controlled="args.controlled" discrete :selected="selected === '${label}'" @click="selected = '${label}'"` })}
  </ScalarSidebarItems>
</ScalarSidebarPlayground>
`,
  }),
}

export const Footer: Story = {
  render: (args) => ({
    components: { ScalarSidebarPlayground, ScalarSidebarFooter },
    setup() {
      return { args }
    },
    template: `
<ScalarSidebarPlayground v-bind="args">
  <template #footer>
    <ScalarSidebarFooter>
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
<ScalarSidebarPlayground v-model:selected="selected" v-bind="args">
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
<ScalarSidebarPlayground v-bind="args">
    <template #search>
      <div class="flex flex-col px-3 pt-3 sticky top-0 bg-sidebar-b-1">
      <ScalarSidebarSearchButton>
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
