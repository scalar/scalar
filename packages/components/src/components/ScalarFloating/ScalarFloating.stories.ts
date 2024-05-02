import { placements } from '@floating-ui/utils'
import type { Meta, StoryObj } from '@storybook/vue3'

import ScalarFloating from './ScalarFloating.vue'

const meta: Meta = {
  component: ScalarFloating,
  tags: ['autodocs'],
  argTypes: {
    placement: {
      control: 'select',
      options: placements,
    },
  },
  render: (args) => ({
    components: { ScalarFloating },
    setup() {
      return { args }
    },
    template: `
<div class="flex items-center justify-center w-full h-screen">
  <ScalarFloating v-bind="args">
    <div class="rounded border bg-back-2 p-2">Target for #floating</div>
    <template #floating="{ width, height }">
      <div 
        class="flex items-center justify-center rounded border shadow bg-back-2 p-1" 
        :style="{ width, height }">
        Floating
      </div>
    </template>
  </ScalarDropdown>
</div>
`,
  }),
} satisfies Meta<typeof ScalarFloating>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}
