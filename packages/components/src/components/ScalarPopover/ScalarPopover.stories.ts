import { placements } from '@floating-ui/utils'
import type { Meta, StoryObj } from '@storybook/vue3'

import { ScalarButton } from '../../'
import { ScalarFloatingBackdrop } from '../ScalarFloating'
import ScalarPopover from './ScalarPopover.vue'

const meta = {
  component: ScalarPopover,
  tags: ['autodocs'],
  argTypes: {
    resize: {
      control: 'boolean',
    },
    placement: {
      control: 'select',
      options: placements,
    },
    class: {
      control: 'text',
    },
  },
  render: (args) => ({
    components: {
      ScalarPopover,
      ScalarButton,
    },
    setup() {
      return { args }
    },
    template: `
<div class="flex justify-center w-full min-h-96">
  <ScalarPopover v-bind="args">
    <ScalarButton>Click Me</ScalarButton>
    <template #popover>
      <div class="h-full flex items-center justify-center p-1">
        Pop pop
      </div>
    </template>
  </ScalarPopover>
</div>
`,
  }),
} satisfies Meta<typeof ScalarPopover>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}

export const CustomClasses: Story = {
  args: { class: 'border border-red' },
}

export const CustomBackdrop: Story = {
  render: (args) => ({
    components: {
      ScalarPopover,
      ScalarFloatingBackdrop,
      ScalarButton,
    },
    setup() {
      return { args }
    },
    template: `
<div class="flex justify-center w-full min-h-96">
  <ScalarPopover v-bind="args">
    <ScalarButton>Click Me</ScalarButton>
    <template #popover>
      <div class="h-full flex items-center justify-center p-1">
        Pop pop
      </div>
    </template>
    <template #backdrop>
      <ScalarFloatingBackdrop class="bg-red" />
    </template>
  </ScalarPopover>
</div>
`,
  }),
}
