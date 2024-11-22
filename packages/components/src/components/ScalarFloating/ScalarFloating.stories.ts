import { placements } from '@floating-ui/utils'
import { offset } from '@floating-ui/vue'
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
    <div class="rounded border bg-b-2 p-2">Target for #floating</div>
    <template #floating="{ width, height }">
      <div 
        class="flex items-center justify-center rounded border shadow bg-b-2 p-1" 
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

/**
 * You can override the offset (or other middleware) by passing a custom middleware array
 */
export const CustomOffset: Story = {
  render: () => ({
    components: { ScalarFloating },
    setup() {
      const middleware = [offset(15)]
      return { middleware }
    },
    template: `
<div class="flex items-center justify-center w-full h-screen">
  <ScalarFloating :middleware="middleware">
    <div class="rounded border bg-b-2 p-2">Target for #floating</div>
    <template #floating="{ width, height }">
      <div 
        class="flex items-center justify-center rounded border shadow bg-b-2 p-1" 
        :style="{ width, height }">
        Floating
      </div>
    </template>
  </ScalarDropdown>
</div>
`,
  }),
}
