import type { Meta, StoryObj } from '@storybook/vue3-vite'

import ScalarCopy from './ScalarCopy.vue'
import ScalarCopyBackdrop from './ScalarCopyBackdrop.vue'

const meta = {
  component: ScalarCopy,
  argTypes: {
    placement: {
      control: 'select',
      options: ['left', 'right'],
    },
    duration: { control: 'number' },
    content: { control: 'text' },
    copy: { control: 'text' },
    copied: { control: 'text' },
  },
  args: {
    placement: 'right',
    content: 'Hello, world!',
    duration: 1500,
  },
  tags: ['autodocs'],
  render: (args) => ({
    components: { ScalarCopy },
    setup() {
      return { args }
    },
    template: `
<div class="flex" :class="{ 'justify-end': args.placement === 'left' }">
  <ScalarCopy v-bind="args">
    <template v-if="args.copy" #copy>{{ args.copy }}</template>
    <template v-if="args.copied" #copied>{{ args.copied }}</template>
  </ScalarCopy>
</div>`,
  }),
} satisfies Meta<typeof ScalarCopy>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}

export const Backdrop: Story = {
  args: {
    class: 'bg-b-3',
  },
  parameters: {
    layout: 'fullscreen',
  },
  render: (args) => ({
    components: { ScalarCopy, ScalarCopyBackdrop },
    setup() {
      return { args }
    },
    template: `
    <div class="h-dvh w-dvw p-3 bg-b-2">
<ScalarCopy v-bind="args">
  <template #backdrop>
    <ScalarCopyBackdrop class="bg-b-2" />
  </template>
</ScalarCopy>
</div>`,
  }),
}
