import type { Meta, StoryObj } from '@storybook/vue3'

import { ScalarButton } from '../../'
import ScalarContextMenu from './ScalarContextMenu.vue'

const meta = {
  component: ScalarContextMenu,
  tags: ['autodocs'],
  argTypes: {
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
      ScalarContextMenu,
      ScalarButton,
    },
    setup() {
      return { args }
    },
    template: `
<div class="flex items-center justify-center w-full h-screen">
  <ScalarContextMenu v-bind="args">
    <template #trigger>
      <div class="border border-dashed p-6 rounded">Right Click Me</div>
    </template>
    <template #content>
      <div class="bg-b-1 border p-2 rounded">Context Menu Content</div>
    </template>
  </ScalarContextMenu>
</div>
`,
  }),
} satisfies Meta<typeof ScalarContextMenu>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}
