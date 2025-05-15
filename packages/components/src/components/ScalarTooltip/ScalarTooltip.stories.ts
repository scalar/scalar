import type { Meta, StoryObj } from '@storybook/vue3'

import { ScalarButton } from '../../'
import ScalarTooltip from './ScalarTooltip.vue'
import { placements } from '@floating-ui/utils'

const meta = {
  component: ScalarTooltip,
  tags: ['autodocs'],
  args: {
    content: 'Tooltip Content',
  },
  argTypes: {
    content: {
      control: 'text',
    },
    delay: {
      control: 'number',
    },
    placement: {
      control: 'select',
      options: placements,
    },
    offset: {
      control: 'number',
    },
    class: {
      control: 'text',
    },
  },
  render: (args) => ({
    components: {
      ScalarTooltip,
      ScalarButton,
    },
    setup() {
      return { args }
    },
    template: `
<div class="flex items-center justify-center w-full h-screen">
  <ScalarTooltip v-bind="args">
      <ScalarButton>Hover Me</ScalarButton>
  </ScalarTooltip>
</div>
`,
  }),
} satisfies Meta<typeof ScalarTooltip>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}
