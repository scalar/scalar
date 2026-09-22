import type { Meta, StoryObj } from '@storybook/vue3-vite'

import { ScalarMenu } from '../ScalarMenu'
import ScalarHeader from './ScalarHeader.vue'
import ScalarHeaderButton from './ScalarHeaderButton.vue'
import ScalarHeaderColumn from './ScalarHeaderColumn.vue'

const placeholder = (s: string, w: string = 'w-full') =>
  `<div class="flex items-center justify-center border border-c-1 border-dashed rounded h-8 ${w}">${s}</div>`

const meta = {
  component: ScalarHeader,
  subcomponents: { ScalarHeaderColumn, ScalarHeaderButton },
  tags: ['autodocs'],
  argTypes: {
    class: { control: 'text' },
  },
  parameters: { layout: 'fullscreen' },
  render: (args) => ({
    components: { ScalarHeader, ScalarHeaderColumn },
    setup() {
      return { args }
    },
    template: `
<ScalarHeader v-bind="args">
  <ScalarHeaderColumn class="flex-1">${placeholder('Start')}</ScalarHeaderColumn>
  <ScalarHeaderColumn>${placeholder('Center')}</ScalarHeaderColumn>
  <ScalarHeaderColumn class="flex-1 justify-end">${placeholder('End')}</ScalarHeaderColumn>
</ScalarHeader>`,
  }),
} satisfies Meta<typeof ScalarHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}

export const Responsive: Story = {
  render: (args) => ({
    components: { ScalarHeader, ScalarHeaderColumn },
    setup() {
      return { args }
    },
    template: `
<ScalarHeader v-bind="args">
  <ScalarHeaderColumn class="flex-1">
    ${placeholder('A', 'w-20')}
    ${placeholder('B', 'w-24')}
  </ScalarHeaderColumn>
  <ScalarHeaderColumn>
    ${placeholder('C', 'w-12')}
    ${placeholder('D', 'w-16')}
  </ScalarHeaderColumn>
  <ScalarHeaderColumn class="flex-1 justify-end">
    ${placeholder('E', 'w-32')}
    ${placeholder('F', 'w-24')}
  </ScalarHeaderColumn>
</ScalarHeader>`,
  }),
}

export const WithMenu: Story = {
  render: (args) => ({
    components: { ScalarHeader, ScalarHeaderColumn, ScalarHeaderButton, ScalarMenu },
    setup() {
      return { args }
    },
    template: `
<ScalarHeader v-bind="args">
  <ScalarHeaderColumn class="flex-1">
    <ScalarMenu />
  </ScalarHeaderColumn>
  <ScalarHeaderColumn class="justify-end">
    <ScalarHeaderButton>Log in</ScalarHeaderButton>
    <ScalarHeaderButton cta>Register</ScalarHeaderButton>
  </ScalarHeaderColumn>
</ScalarHeader>`,
  }),
}

/** A breadcrumb long enough to overflow a narrow viewport, beside a fixed action cluster */
export const Overflow: Story = {
  render: (args) => ({
    components: { ScalarHeader, ScalarHeaderColumn, ScalarHeaderButton, ScalarMenu },
    setup() {
      return { args }
    },
    template: `
<ScalarHeader v-bind="args">
  <ScalarHeaderColumn class="flex-1">
    <ScalarMenu>
      <template #title>A Rather Long Team Name</template>
    </ScalarMenu>
    <span
      data-testid="overflow-label"
      class="truncate text-sm">
      Workspace / A Very Long Document Title That Cannot Possibly Fit / v1.0.0
    </span>
  </ScalarHeaderColumn>
  <ScalarHeaderColumn class="justify-end">
    <ScalarHeaderButton cta>Save</ScalarHeaderButton>
  </ScalarHeaderColumn>
</ScalarHeader>`,
  }),
}
