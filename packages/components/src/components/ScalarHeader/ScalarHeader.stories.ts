import type { Meta, StoryObj } from '@storybook/vue3'

import { ScalarMenu } from '../ScalarMenu'
import ScalarHeader from './ScalarHeader.vue'
import ScalarHeaderButton from './ScalarHeaderButton.vue'

const placeholder = (s: string, w: string = 'w-full') =>
  `<div class="flex items-center justify-center border border-c-1 border-dashed rounded h-8 ${w}">${s}</div>`

const meta = {
  component: ScalarHeader,
  subcomponents: { ScalarHeaderButton },
  tags: ['autodocs'],
  argTypes: {
    class: { control: 'text' },
  },
  parameters: { layout: 'fullscreen' },
  render: (args) => ({
    components: { ScalarHeader },
    setup() {
      return { args }
    },
    template: `
<ScalarHeader v-bind="args">
  <template #start>${placeholder('Start')}</template>
  ${placeholder('Center')}
  <template #end>${placeholder('End')}</template>
</ScalarHeader>`,
  }),
} satisfies Meta<typeof ScalarHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}

export const Responsive: Story = {
  render: (args) => ({
    components: { ScalarHeader },
    setup() {
      return { args }
    },
    template: `
<ScalarHeader v-bind="args">
  <template #start>
    ${placeholder('A', 'w-20')}
    ${placeholder('B', 'w-24')}
  </template>
    ${placeholder('C', 'w-12')}
    ${placeholder('D', 'w-16')}
  <template #end>
    ${placeholder('E', 'w-32')}
    ${placeholder('F', 'w-24')}
  </template>
</ScalarHeader>
`,
  }),
}

export const WithMenu: Story = {
  render: (args) => ({
    components: { ScalarHeader, ScalarHeaderButton, ScalarMenu },
    setup() {
      return { args }
    },
    template: `
<ScalarHeader v-bind="args">
  <template #start>
    <ScalarMenu />
    <ScalarHeaderButton>Login</ScalarHeaderButton>
    <ScalarHeaderButton>Register</ScalarHeaderButton>
  </template>
  <template #end>
   <ScalarHeaderButton active>Active Page</ScalarHeaderButton>
    <ScalarHeaderButton>Settings</ScalarHeaderButton>
  </template>
</ScalarHeader>`,
  }),
}
