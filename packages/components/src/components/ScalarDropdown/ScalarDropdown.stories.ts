import { placements } from '@floating-ui/utils'
import type { Meta, StoryObj } from '@storybook/vue3'

import { ScalarButton } from '../../'
import ScalarDropdown from './ScalarDropdown.vue'

const meta = {
  component: ScalarDropdown,
  tags: ['autodocs'],
  argTypes: {
    placement: {
      control: 'select',
      options: placements,
    },
  },
  render: (args) => ({
    components: { ScalarDropdown, ScalarButton },
    setup() {
      return { args }
    },
    template: `
<div class="flex items-center justify-center w-screen h-screen">
  <ScalarDropdown v-bind="args">
    <ScalarButton>Click Me</ScalarButton>
    <template #items>
      Items go here
    </template>
  </ScalarDropdown>
</div>
`,
  }),
} satisfies Meta<typeof ScalarDropdown>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}
