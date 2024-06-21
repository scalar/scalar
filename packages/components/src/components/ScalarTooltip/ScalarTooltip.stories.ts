import type { Meta, StoryObj } from '@storybook/vue3'

import { ScalarButton } from '../../'
import ScalarTooltip from './ScalarTooltip.vue'

const meta = {
  component: ScalarTooltip,
  tags: ['autodocs'],
  argTypes: {
    delay: {
      control: 'number',
    },
    skipDelay: {
      control: 'number',
    },
    side: {
      control: 'select',
      options: ['top', 'right', 'bottom', 'left'],
    },
    sideOffset: {
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
    <template #trigger>
      <ScalarButton>Hover Me</ScalarButton>
    </template>
    <template #content>
      <div class="p-2">Tooltip Content</div>
    </template>
  </ScalarTooltip>
</div>
`,
  }),
} satisfies Meta<typeof ScalarTooltip>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}
